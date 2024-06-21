const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;
let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */
async function getCategoryIds() {
    let response = await axios.get('https://jservice.io/api/categories?count=100');
    let catIds = response.data.map(c => c.id);
    return _.sampleSize(catIds, NUM_CATEGORIES);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */
async function getCategory(catId) {
    let response = await axios.get(`https://jservice.io/api/category?id=${catId}`);
    let catData = response.data;
    let clues = catData.clues.slice(0, NUM_QUESTIONS_PER_CAT).map(c => ({
        question: c.question,
        answer: c.answer,
        showing: null,
    }));
    return { title: catData.title, clues };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */
async function fillTable() {
    const table = document.getElementById('jeopardy');
    table.innerHTML = '';

    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    categories.forEach(category => {
        const th = document.createElement('th');
        th.innerText = category.title;
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let i = 0; i < NUM_QUESTIONS_PER_CAT; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < NUM_CATEGORIES; j++) {
            const td = document.createElement('td');
            td.innerText = '?';
            td.dataset.catIndex = j;
            td.dataset.clueIndex = i;
            td.addEventListener('click', handleClick);
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */
function handleClick(evt) {
    const catIndex = evt.target.dataset.catIndex;
    const clueIndex = evt.target.dataset.clueIndex;
    const clue = categories[catIndex].clues[clueIndex];

    if (clue.showing === null) {
        evt.target.innerText = clue.question;
        clue.showing = 'question';
    } else if (clue.showing === 'question') {
        evt.target.innerText = clue.answer;
        clue.showing = 'answer';
    }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */
function showLoadingView() {
    document.getElementById('spinner').style.display = 'block';
    document.getElementById('start-button').disabled = true;
}

/** Remove the loading spinner and update the button used to fetch data. */
function hideLoadingView() {
    document.getElementById('spinner').style.display = 'none';
    document.getElementById('start-button').disabled = false;
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 */
async function setupAndStart() {
    showLoadingView();
    const catIds = await getCategoryIds();
    categories = await Promise.all(catIds.map(id => getCategory(id)));
    fillTable();
    hideLoadingView();
}

/** On click of start / restart button, set up game. */
document.getElementById('start-button').addEventListener('click', setupAndStart);

/** On page load, add event handler for clicking clues */
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#jeopardy td').forEach(cell => {
        cell.addEventListener('click', handleClick);
    });
});
