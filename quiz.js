document.addEventListener('DOMContentLoaded', function() {
    console.log('Тарих викторинасы жүктелуде...');
    
    // Экраны
    const screens = {
        start: document.getElementById('start-screen'),
        question: document.getElementById('question-screen'),
        result: document.getElementById('result-screen'),
        review: document.getElementById('review-screen')
    };
    
    // Кнопки
    const buttons = {
        start: document.getElementById('start-btn'),
        next: document.getElementById('next-btn'),
        prev: document.getElementById('prev-btn'),
        submit: document.getElementById('submit-btn'),
        restart: document.getElementById('restart-btn'),
        review: document.getElementById('review-btn'),
        back: document.getElementById('back-btn')
    };
    
    // Элементы вопроса
    const questionElements = {
        text: document.getElementById('question-text'),
        number: document.getElementById('question-number'),
        category: document.getElementById('question-category'),
        type: document.getElementById('question-type'),
        options: document.getElementById('options-container')
    };
    
    // Элементы прогресса
    const progressElements = {
        current: document.getElementById('current-question'),
        total: document.getElementById('total-questions'),
        fill: document.getElementById('progress-fill')
    };
    
    // Элементы результатов
    const resultElements = {
        percent: document.getElementById('score-percent'),
        count: document.getElementById('score-count'),
        correct: document.getElementById('correct-answers'),
        wrong: document.getElementById('wrong-answers'),
        skipped: document.getElementById('skipped-answers')
    };
    
    // Элементы просмотра
    const reviewElements = {
        container: document.getElementById('questions-review')
    };
    
    // Данные викторины
    const quiz = {
        allQuestions: [],
        filteredQuestions: [],
        currentIndex: 0,
        userAnswers: [],
        selectedCategory: 'Тарих',
        usedQuestionIds: new Set() // Для отслеживания использованных вопросов
    };
    
    // Загружаем вопросы
    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            if (response.ok) {
                const data = await response.json();
                quiz.allQuestions = data.questions || [];
                console.log(`JSON файлдан ${quiz.allQuestions.length} сұрақ жүктелді`);
            } else {
                throw new Error('JSON файл табылмады');
            }
        } catch (error) {
            console.log('Қате: ', error);
            quiz.allQuestions = [];
        }
        
        // Обновляем счетчики
        progressElements.total.textContent = 20;
        quiz.userAnswers = new Array(20).fill(null);
    }
    
    // Перемешивание массива (без повторений)
    function shuffleArray(array) {
        const newArray = [...array];
        
        // Используем алгоритм Фишера-Йетса
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    // Перемешивание вариантов ответа с сохранением правильного ответа
    function shuffleQuestion(question) {
        // Создаем массив объектов с индексами и текстом
        const optionsWithIndex = question.options.map((text, index) => ({ text, index }));
        
        // Перемешиваем варианты
        const shuffledOptions = shuffleArray(optionsWithIndex);
        
        // Определяем новый индекс правильного ответа
        let newCorrectIndex;
        
        if (Array.isArray(question.correct)) {
            // Для множественного выбора
            newCorrectIndex = question.correct.map(correctIdx => {
                return shuffledOptions.findIndex(option => option.index === correctIdx);
            }).filter(idx => idx !== -1).sort((a, b) => a - b);
        } else {
            // Для одиночного выбора
            const correctOption = shuffledOptions.find(option => option.index === question.correct);
            newCorrectIndex = correctOption ? shuffledOptions.indexOf(correctOption) : -1;
        }
        
        // Извлекаем только тексты вариантов
        const optionTexts = shuffledOptions.map(option => option.text);
        
        return {
            ...question,
            options: optionTexts,
            correct: newCorrectIndex,
            isMultiple: Array.isArray(newCorrectIndex)
        };
    }
    
    // Настройка выбора категории
    function setupCategories() {
        quiz.selectedCategory = 'Тарих';
        console.log('Категория автоматты түрде таңдалды: Тарих');
        
        const historyQuestions = quiz.allQuestions.filter(q => q.category === 'Тарих');
        document.querySelector('.start-content p').textContent = 
            `Түркі қағанаттары тарихы бойынша 20 сұрақтық викторина (барлығы: ${historyQuestions.length} сұрақ)`;
    }
    
    // Начало викторины
    function startQuiz() {
        console.log('Викторина басталды...');
        
        // Фильтруем только вопросы по истории
        const historyQuestions = quiz.allQuestions.filter(q => q.category === 'Тарих');
        
        if (historyQuestions.length === 0) {
            alert('Тарих сұрақтары табылмады!');
            return;
        }
        
        console.log(`Тарихтан табылды: ${historyQuestions.length} сұрақ`);
        
        if (historyQuestions.length < 20) {
            alert(`Тек ${historyQuestions.length} сұрақ бар. 20 сұрақ қажет.`);
            return;
        }
        
        // Перемешиваем вопросы
        let shuffledQuestions = shuffleArray(historyQuestions);
        
        // Берем первые 20 УНИКАЛЬНЫХ вопросов
        const selectedQuestions = [];
        quiz.usedQuestionIds.clear();
        
        for (let question of shuffledQuestions) {
            if (selectedQuestions.length >= 20) break;
            
            // Проверяем, не использовался ли уже этот вопрос (по тексту вопроса)
            const questionKey = question.question.trim();
            if (!quiz.usedQuestionIds.has(questionKey)) {
                selectedQuestions.push(question);
                quiz.usedQuestionIds.add(questionKey);
            }
        }
        
        // Если все же недостаточно уникальных вопросов, добавляем любые
        if (selectedQuestions.length < 20) {
            const remaining = shuffledQuestions.filter(q => !selectedQuestions.includes(q));
            selectedQuestions.push(...remaining.slice(0, 20 - selectedQuestions.length));
        }
        
        quiz.filteredQuestions = selectedQuestions;
        console.log(`${quiz.filteredQuestions.length} бірегей сұрақтан викторина құрылды`);
        
        // Перемешиваем варианты в каждом вопросе и определяем тип
        quiz.filteredQuestions = quiz.filteredQuestions.map(question => {
            const shuffledQuestion = shuffleQuestion(question);
            return {
                ...shuffledQuestion,
                isMultiple: Array.isArray(shuffledQuestion.correct),
                originalQuestion: question.question // Сохраняем оригинальный текст для отслеживания
            };
        });
        
        // Сбрасываем данные
        quiz.currentIndex = 0;
        quiz.userAnswers = new Array(quiz.filteredQuestions.length).fill(null);
        
        // Обновляем счетчик
        progressElements.total.textContent = quiz.filteredQuestions.length;
        
        // Переключаем экран
        showScreen('question');
        
        // Показываем первый вопрос
        showQuestion(quiz.currentIndex);
        updateProgress();
    }
    
    // Показать экран
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    }
    
    // Показать вопрос
    function showQuestion(index) {
        if (!quiz.filteredQuestions || quiz.filteredQuestions.length === 0) {
            console.error('Сұрақтар жоқ!');
            return;
        }
        
        const question = quiz.filteredQuestions[index];
        
        // Обновляем текст вопроса
        questionElements.text.textContent = question.question;
        questionElements.number.textContent = index + 1;
        questionElements.category.textContent = question.category;
        
        // Устанавливаем тип вопроса
        if (question.isMultiple) {
            questionElements.type.textContent = 'Бірнеше жауап';
            questionElements.type.style.display = 'block';
        } else {
            questionElements.type.textContent = 'Бір жауап';
            questionElements.type.style.display = 'block';
        }
        
        // Очищаем предыдущие варианты
        questionElements.options.innerHTML = '';
        
        // Создаем варианты ответов
        question.options.forEach((option, optionIndex) => {
            const optionElement = document.createElement('div');
            optionElement.className = `option ${question.isMultiple ? 'multiple' : ''}`;
            
            if (question.isMultiple) {
                // Для множественного выбора
                const isSelected = quiz.userAnswers[index] && 
                                   Array.isArray(quiz.userAnswers[index]) && 
                                   quiz.userAnswers[index].includes(optionIndex);
                
                optionElement.innerHTML = `
                    <div class="checkbox-container">
                        <div class="checkbox ${isSelected ? 'selected' : ''}"></div>
                        <span>${option}</span>
                    </div>
                `;
                
                optionElement.addEventListener('click', () => {
                    const checkbox = optionElement.querySelector('.checkbox');
                    checkbox.classList.toggle('selected');
                    
                    let selectedAnswers = quiz.userAnswers[index] || [];
                    if (!Array.isArray(selectedAnswers)) {
                        selectedAnswers = [];
                    }
                    
                    if (checkbox.classList.contains('selected')) {
                        if (!selectedAnswers.includes(optionIndex)) {
                            selectedAnswers.push(optionIndex);
                            selectedAnswers.sort((a, b) => a - b);
                        }
                    } else {
                        selectedAnswers = selectedAnswers.filter(idx => idx !== optionIndex);
                    }
                    
                    quiz.userAnswers[index] = selectedAnswers.length > 0 ? selectedAnswers : null;
                    
                    // Обновляем класс selected для option
                    if (selectedAnswers.length > 0) {
                        optionElement.classList.add('selected');
                    } else {
                        optionElement.classList.remove('selected');
                    }
                    
                    console.log(`Сұрақ ${index + 1}: ${JSON.stringify(selectedAnswers)} жауаптар`);
                    updateProgress();
                });
            } else {
                // Для одиночного выбора
                optionElement.textContent = option;
                
                if (quiz.userAnswers[index] === optionIndex) {
                    optionElement.classList.add('selected');
                }
                
                optionElement.addEventListener('click', () => {
                    // Убираем выделение у всех вариантов одиночного выбора
                    document.querySelectorAll('.option:not(.multiple)').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    // Убираем выделение у чекбоксов множественного выбора
                    document.querySelectorAll('.multiple .checkbox').forEach(cb => {
                        cb.classList.remove('selected');
                    });
                    document.querySelectorAll('.multiple').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    // Выделяем выбранный
                    optionElement.classList.add('selected');
                    
                    // Сохраняем ответ
                    quiz.userAnswers[index] = optionIndex;
                    console.log(`Сұрақ ${index + 1}: ${optionIndex}-ші жауап`);
                    updateProgress();
                });
            }
            
            questionElements.options.appendChild(optionElement);
        });
        
        updateNavigationButtons();
    }
    
    // Обновить кнопки навигации
    function updateNavigationButtons() {
        buttons.prev.disabled = quiz.currentIndex === 0;
        
        if (quiz.currentIndex === quiz.filteredQuestions.length - 1) {
            buttons.next.style.display = 'none';
            buttons.submit.style.display = 'flex';
        } else {
            buttons.next.style.display = 'flex';
            buttons.submit.style.display = 'none';
        }
    }
    
    // Обновить прогресс
    function updateProgress() {
        progressElements.current.textContent = quiz.currentIndex + 1;
        
        const answered = quiz.userAnswers.filter(answer => {
            if (answer === null) return false;
            if (Array.isArray(answer)) return answer.length > 0;
            return true;
        }).length;
        
        const progress = (answered / quiz.filteredQuestions.length) * 100;
        progressElements.fill.style.width = `${progress}%`;
    }
    
    // Следующий вопрос
    function nextQuestion() {
        if (quiz.currentIndex < quiz.filteredQuestions.length - 1) {
            quiz.currentIndex++;
            showQuestion(quiz.currentIndex);
            updateProgress();
        }
    }
    
    // Предыдущий вопрос
    function prevQuestion() {
        if (quiz.currentIndex > 0) {
            quiz.currentIndex--;
            showQuestion(quiz.currentIndex);
            updateProgress();
        }
    }
    
    // Проверка ответов (для множественного выбора)
    function checkMultipleChoiceAnswer(userAnswer, correctAnswer) {
        if (!userAnswer || !correctAnswer || !Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
            return 'wrong';
        }
        
        const userSet = new Set(userAnswer);
        const correctSet = new Set(correctAnswer);
        
        // Проверяем, совпадают ли множества
        if (userSet.size === correctSet.size && 
            [...userSet].every(item => correctSet.has(item))) {
            return 'correct';
        }
        
        return 'wrong';
    }
    
    // Проверка одиночного ответа
    function checkSingleChoiceAnswer(userAnswer, correctAnswer) {
        return userAnswer === correctAnswer ? 'correct' : 'wrong';
    }
    
    // Показать результаты
    function showResults() {
        showScreen('result');
        calculateResults();
    }
    
    // Рассчитать результаты
    function calculateResults() {
        let correct = 0;
        let wrong = 0;
        let skipped = 0;
        
        quiz.filteredQuestions.forEach((question, index) => {
            const userAnswer = quiz.userAnswers[index];
            
            // Проверяем, отвечен ли вопрос
            const isAnswered = userAnswer !== null && 
                (Array.isArray(userAnswer) ? userAnswer.length > 0 : true);
            
            if (!isAnswered) {
                skipped++;
                return;
            }
            
            let isCorrect;
            
            if (question.isMultiple) {
                // Для множественного выбора
                const result = checkMultipleChoiceAnswer(userAnswer, question.correct);
                isCorrect = (result === 'correct');
            } else {
                // Для одиночного выбора
                isCorrect = checkSingleChoiceAnswer(userAnswer, question.correct) === 'correct';
            }
            
            if (isCorrect) {
                correct++;
            } else {
                wrong++;
            }
        });
        
        const total = quiz.filteredQuestions.length;
        const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        // Обновляем отображение
        resultElements.percent.textContent = `${percent}%`;
        resultElements.count.textContent = `${correct}/${total}`;
        resultElements.correct.textContent = correct;
        resultElements.wrong.textContent = wrong;
        resultElements.skipped.textContent = skipped;
        
        // Обновляем круговую диаграмму
        const circle = document.querySelector('.circle');
        if (circle) {
            circle.style.background = `conic-gradient(#4a6fa5 ${percent}%, #e0e0e0 0%)`;
        }
        
        // Сохраняем результаты для отображения в режиме просмотра
        quiz.results = { correct, wrong, skipped, total, percent };
    }
    
    // Показать ответы
    function showReview() {
        showScreen('review');
        displayReview();
    }
    
    // Отобразить ответы для просмотра
    function displayReview() {
        reviewElements.container.innerHTML = '';
        
        quiz.filteredQuestions.forEach((question, index) => {
            const userAnswer = quiz.userAnswers[index];
            const isAnswered = userAnswer !== null && 
                (Array.isArray(userAnswer) ? userAnswer.length > 0 : true);
            
            let questionClass = '';
            let resultType = '';
            let isCorrect = false;
            
            if (!isAnswered) {
                questionClass = 'skipped';
                resultType = 'Өткізілген';
            } else if (question.isMultiple) {
                const result = checkMultipleChoiceAnswer(userAnswer, question.correct);
                isCorrect = (result === 'correct');
                questionClass = isCorrect ? 'correct' : 'wrong';
                resultType = isCorrect ? 'Дұрыс' : 'Қате';
            } else {
                const result = checkSingleChoiceAnswer(userAnswer, question.correct);
                isCorrect = (result === 'correct');
                questionClass = isCorrect ? 'correct' : 'wrong';
                resultType = isCorrect ? 'Дұрыс' : 'Қате';
            }
            
            // Создаем элемент вопроса
            const questionDiv = document.createElement('div');
            questionDiv.className = `review-question ${questionClass}`;
            
            // Создаем HTML для вариантов ответа
            let optionsHTML = question.options.map((option, optIndex) => {
                let optionClass = '';
                let indicator = '';
                let isUserSelected = false;
                let isCorrectAnswer = false;
                
                // Определяем, является ли этот вариант правильным
                if (question.isMultiple) {
                    isCorrectAnswer = question.correct && Array.isArray(question.correct) && 
                                      question.correct.includes(optIndex);
                } else {
                    isCorrectAnswer = optIndex === question.correct;
                }
                
                // Определяем, выбрал ли пользователь этот вариант
                if (question.isMultiple) {
                    isUserSelected = userAnswer && Array.isArray(userAnswer) && 
                                     userAnswer.includes(optIndex);
                } else {
                    isUserSelected = userAnswer === optIndex;
                }
                
                // Определяем класс и индикатор
                if (isCorrectAnswer && isUserSelected) {
                    optionClass = question.isMultiple ? 'multiple-correct' : 'correct user';
                    indicator = 'Д/С';
                } else if (isCorrectAnswer) {
                    optionClass = question.isMultiple ? 'multiple-correct' : 'correct';
                    indicator = 'Д';
                } else if (isUserSelected) {
                    optionClass = question.isMultiple ? 'multiple-selected' : 'wrong user';
                    indicator = 'С';
                }
                
                return `
                    <div class="review-option ${optionClass}">
                        <div class="option-indicator">${indicator}</div>
                        ${option}
                    </div>
                `;
            }).join('');
            
            questionDiv.innerHTML = `
                <div class="review-question-header">
                    <div class="review-question-info">
                        <div class="review-question-number">${index + 1}</div>
                        <div class="review-question-type">${question.isMultiple ? 'Бірнеше жауап' : 'Бір жауап'}</div>
                        <div class="review-question-category">${question.category}</div>
                    </div>
                    <div class="review-result-type">${resultType}</div>
                </div>
                
                <div class="review-question-text">${question.question}</div>
                
                <div class="review-options">
                    ${optionsHTML}
                </div>
                
                ${question.explanation ? `
                    <div class="review-explanation">
                        <h4><i class="fas fa-lightbulb"></i> Түсіндірме:</h4>
                        <p>${question.explanation}</p>
                    </div>
                ` : ''}
            `;
            
            reviewElements.container.appendChild(questionDiv);
        });
    }
    
    // Перезапустить викторину
    function restartQuiz() {
        quiz.currentIndex = 0;
        quiz.userAnswers = new Array(20).fill(null);
        quiz.selectedCategory = 'Тарих';
        quiz.usedQuestionIds.clear();
        
        progressElements.total.textContent = 20;
        
        showScreen('start');
        updateProgress();
    }
    
    // Назад к результатам
    function backToResults() {
        showScreen('result');
    }
    
    // Инициализация
    async function init() {
        console.log('Викторина инициализациясы басталды...');
        
        await loadQuestions();
        setupCategories();
        
        buttons.start.addEventListener('click', startQuiz);
        buttons.next.addEventListener('click', nextQuestion);
        buttons.prev.addEventListener('click', prevQuestion);
        buttons.submit.addEventListener('click', showResults);
        buttons.restart.addEventListener('click', restartQuiz);
        buttons.review.addEventListener('click', showReview);
        buttons.back.addEventListener('click', backToResults);
        
        console.log('Тарих викторинасы дайын!');
    }
    
    init();
});