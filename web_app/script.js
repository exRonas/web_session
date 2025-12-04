const ITEMS_PER_PAGE = 30;
let currentPage = 0;
let userAnswers = {}; // { questionIndex: selectedOptionText }
let isSubmitted = false;

// Parse URL params
const urlParams = new URLSearchParams(window.location.search);
const startParam = parseInt(urlParams.get('start'));
const endParam = parseInt(urlParams.get('end'));
const mode = urlParams.get('mode');

let activeQuestions = [];
let questionOffset = 0;

if (mode === 'all') {
    activeQuestions = questions;
} else if (!isNaN(startParam) && !isNaN(endParam)) {
    activeQuestions = questions.slice(startParam, endParam);
    questionOffset = startParam;
} else {
    // Default fallback
    activeQuestions = questions;
}

// We need to prepare the questions: shuffle options for each question
// We do this once so they don't change when switching pages
let preparedQuestions = activeQuestions.map((q, index) => {
    // Create a copy of variants to shuffle
    let variants = [...q.variants];
    shuffleArray(variants);
    return {
        ...q,
        originalIndex: index,
        shuffledVariants: variants
    };
});

const quizContainer = document.getElementById('quiz-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');
const submitBtn = document.getElementById('submit-btn');
const resetBtn = document.getElementById('reset-btn');
const resultSummary = document.getElementById('result-summary');
const scoreDisplay = document.getElementById('score-display');

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderPage(page) {
    quizContainer.innerHTML = '';
    const start = page * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, preparedQuestions.length);

    for (let i = start; i < end; i++) {
        const q = preparedQuestions[i];
        const card = document.createElement('div');
        card.className = 'question-card';
        card.dataset.index = i;

        // Question text
        const qText = document.createElement('div');
        qText.className = 'question-text';
        qText.textContent = `${questionOffset + i + 1}. ${q.question}`;
        card.appendChild(qText);

        // Options
        const optionsList = document.createElement('div');
        optionsList.className = 'options-list';

        q.shuffledVariants.forEach(variant => {
            const label = document.createElement('label');
            label.className = 'option-label';

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `question-${i}`;
            input.value = variant;
            input.className = 'option-input';
            
            // Restore selection
            if (userAnswers[i] === variant) {
                input.checked = true;
            }

            // Disable if submitted
            if (isSubmitted) {
                input.disabled = true;
            }

            input.addEventListener('change', () => {
                if (!isSubmitted) {
                    userAnswers[i] = variant;
                }
            });

            const span = document.createElement('span');
            span.textContent = variant;

            // Feedback styling
            if (isSubmitted) {
                if (variant === q.correct_answer) {
                    span.classList.add('correct-answer');
                    // Add a checkmark or something?
                    span.innerHTML += ' ✅';
                } else if (userAnswers[i] === variant && variant !== q.correct_answer) {
                    span.classList.add('wrong-answer');
                    span.innerHTML += ' ❌';
                }
            }

            label.appendChild(input);
            label.appendChild(span);
            optionsList.appendChild(label);
        });

        card.appendChild(optionsList);

        // Feedback message for the card
        if (isSubmitted) {
            const feedback = document.createElement('div');
            feedback.className = 'feedback';
            if (userAnswers[i] === q.correct_answer) {
                card.classList.add('correct');
                feedback.style.display = 'none';
            } else {
                card.classList.add('wrong');
                feedback.style.display = 'block';
                feedback.textContent = `Правильный ответ: ${q.correct_answer}`;
                if (!userAnswers[i]) {
                    feedback.textContent = `Вы не ответили. Правильный ответ: ${q.correct_answer}`;
                }
            }
            card.appendChild(feedback);
        }

        quizContainer.appendChild(card);
    }

    // Update controls
    pageInfo.textContent = `Страница ${page + 1} из ${Math.ceil(preparedQuestions.length / ITEMS_PER_PAGE)}`;
    prevBtn.disabled = page === 0;
    nextBtn.disabled = end >= preparedQuestions.length;
    
    // Scroll to top
    window.scrollTo(0, 0);
}

prevBtn.addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        renderPage(currentPage);
    }
});

nextBtn.addEventListener('click', () => {
    if ((currentPage + 1) * ITEMS_PER_PAGE < preparedQuestions.length) {
        currentPage++;
        renderPage(currentPage);
    }
});

submitBtn.addEventListener('click', () => {
    if (confirm('Вы уверены, что хотите завершить тест?')) {
        submitTest();
    }
});

resetBtn.addEventListener('click', () => {
    if (confirm('Начать заново? Все ответы будут сброшены.')) {
        isSubmitted = false;
        userAnswers = {};
        currentPage = 0;
        // Reshuffle options? Maybe not necessary, but good for practice.
        // Let's keep same shuffle for now or reload page.
        location.reload();
    }
});

function submitTest() {
    isSubmitted = true;
    let score = 0;
    
    preparedQuestions.forEach((q, i) => {
        if (userAnswers[i] === q.correct_answer) {
            score++;
        }
    });

    // Show results
    renderPage(currentPage); // Re-render to show feedback
    submitBtn.style.display = 'none';
    resetBtn.style.display = 'inline-block';
    
    resultSummary.classList.remove('hidden');
    const percentage = Math.round((score / preparedQuestions.length) * 100);
    scoreDisplay.textContent = `Вы ответили правильно на ${score} из ${preparedQuestions.length} вопросов (${percentage}%).`;
    
    // Scroll to results? Or top?
    resultSummary.scrollIntoView({ behavior: 'smooth' });
}

// Initial render
renderPage(0);
