document.addEventListener('DOMContentLoaded', function() {
    console.log('Викторина жүктелуде...');
    
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
        selectedCategory: 'all'
    };
    
   
    
    // Загружаем вопросы
    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            if (response.ok) {
                const data = await response.json();
                quiz.allQuestions = data.questions || defaultQuestions;
                console.log(`JSON файлдан ${quiz.allQuestions.length} сұрақ жүктелді`);
            } else {
                throw new Error('JSON файл табылмады');
            }
        } catch (error) {
            console.log('Әдепкі сұрақтар қолданылады:', error);
            quiz.allQuestions = defaultQuestions;
        }
        
        // Обновляем счетчики
        progressElements.total.textContent = quiz.allQuestions.length;
        quiz.userAnswers = new Array(quiz.allQuestions.length).fill(null);
    }
    
    // Перемешивание массива
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    // Перемешивание вариантов ответа
    function shuffleQuestion(question) {
        const options = [...question.options];
        const correctAnswer = options[question.correct];
        
        const shuffledOptions = shuffleArray(options);
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
        
        return {
            ...question,
            options: shuffledOptions,
            correct: newCorrectIndex
        };
    }
    
    // Настройка выбора категории
    function setupCategories() {
        const categories = document.querySelectorAll('.category');
        categories.forEach(cat => {
            cat.addEventListener('click', function() {
                categories.forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                quiz.selectedCategory = this.dataset.category;
                console.log('Таңдалған категория:', quiz.selectedCategory);
            });
        });
    }
    
    // Начало викторины
    function startQuiz() {
        console.log('Викторина басталды...');
        
        // Фильтруем вопросы по категории
        if (quiz.selectedCategory === 'all') {
            quiz.filteredQuestions = [...quiz.allQuestions];
        } else {
            quiz.filteredQuestions = quiz.allQuestions.filter(
                q => q.category === quiz.selectedCategory
            );
        }
        
        console.log(`Таңдалған ${quiz.filteredQuestions.length} сұрақ`);
        
        // Перемешиваем вопросы и варианты
        quiz.filteredQuestions = shuffleArray(quiz.filteredQuestions);
        quiz.filteredQuestions = quiz.filteredQuestions.map(shuffleQuestion);
        
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
        
        // Очищаем предыдущие варианты
        questionElements.options.innerHTML = '';
        
        // Создаем варианты ответов
        question.options.forEach((option, optionIndex) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            
            // Если ответ уже выбран
            if (quiz.userAnswers[index] === optionIndex) {
                optionElement.classList.add('selected');
            }
            
            // Обработчик клика
            optionElement.addEventListener('click', () => {
                // Убираем выделение у всех
                document.querySelectorAll('.option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Выделяем выбранный
                optionElement.classList.add('selected');
                
                // Сохраняем ответ
                quiz.userAnswers[index] = optionIndex;
                console.log(`Сұрақ ${index + 1}: ${optionIndex}-ші жауап`);
                
                updateProgress();
            });
            
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
        
        const answered = quiz.userAnswers.filter(answer => answer !== null).length;
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
            
            if (userAnswer === null) {
                skipped++;
            } else if (userAnswer === question.correct) {
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
            const isCorrect = userAnswer === question.correct;
            const isSkipped = userAnswer === null;
            
            // Определяем класс для вопроса
            let questionClass = '';
            if (isSkipped) questionClass = 'skipped';
            else if (isCorrect) questionClass = 'correct';
            else questionClass = 'wrong';
            
            // Создаем элемент вопроса
            const questionDiv = document.createElement('div');
            questionDiv.className = `review-question ${questionClass}`;
            
            // Создаем HTML
            questionDiv.innerHTML = `
                <div class="review-question-header">
                    <div class="review-question-number">${index + 1}</div>
                    <div class="review-question-category">${question.category}</div>
                </div>
                
                <div class="review-question-text">${question.question}</div>
                
                <div class="review-options">
                    ${question.options.map((option, optIndex) => {
                        let optionClass = '';
                        let indicator = '';
                        
                        if (optIndex === question.correct) {
                            optionClass = 'correct';
                            indicator = 'Д';
                        }
                        
                        if (userAnswer === optIndex) {
                            optionClass += ' user';
                            indicator = 'С';
                        }
                        
                        if (userAnswer === optIndex && optIndex !== question.correct) {
                            optionClass = 'wrong';
                        }
                        
                        return `
                            <div class="review-option ${optionClass}">
                                <div class="option-indicator">${indicator}</div>
                                ${option}
                            </div>
                        `;
                    }).join('')}
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
        quiz.userAnswers = new Array(quiz.allQuestions.length).fill(null);
        quiz.selectedCategory = 'all';
        
        // Сбрасываем выбор категории
        document.querySelectorAll('.category').forEach((cat, index) => {
            if (index === 0) {
                cat.classList.add('selected');
            } else {
                cat.classList.remove('selected');
            }
        });
        
        // Обновляем счетчик
        progressElements.total.textContent = quiz.allQuestions.length;
        
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
        
        // Загружаем вопросы
        await loadQuestions();
        
        // Настраиваем категории
        setupCategories();
        
        // Назначаем обработчики событий
        buttons.start.addEventListener('click', startQuiz);
        buttons.next.addEventListener('click', nextQuestion);
        buttons.prev.addEventListener('click', prevQuestion);
        buttons.submit.addEventListener('click', showResults);
        buttons.restart.addEventListener('click', restartQuiz);
        buttons.review.addEventListener('click', showReview);
        buttons.back.addEventListener('click', backToResults);
        
        console.log('Викторина дайын!');
    }
    
    // Запускаем
    init();
});