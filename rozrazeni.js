const STORAGE_KEY = 'bradavice_student_v1';

const questions = [
  {
    text: 'Přijdeš do školy jako nový student. Co uděláš jako první?',
    answers: [
      ['Rozhlédnu se a zkusím pochopit, jak to tu funguje.', 'H'],
      ['Najdu někoho, kdo vypadá ztraceně, a pomůžu mu.', 'M'],
      ['Bez váhání se vydám prozkoumat nejzajímavější část hradu.', 'N'],
      ['Všímám si, kdo má ve škole vliv a jak se tu dá nejlépe uspět.', 'Z']
    ]
  },
  {
    text: 'Která vlastnost je ti nejbližší?',
    answers: [
      ['Chytrost.', 'H'],
      ['Věrnost.', 'M'],
      ['Odvaha.', 'N'],
      ['Ambice.', 'Z']
    ]
  },
  {
    text: 'Uprostřed noci uslyšíš za zdí podivný zvuk. Co uděláš?',
    answers: [
      ['Vymyslím plán a zkusím zjistit, co to je.', 'H'],
      ['Vzbudím někoho dalšího, ať tam nejsem sám nebo sama.', 'M'],
      ['Jdu to hned prověřit.', 'N'],
      ['Nejdřív zvážím, jestli mi to může přinést výhodu.', 'Z']
    ]
  },
  {
    text: 'Který předmět by tě lákal nejvíc?',
    answers: [
      ['Lektvary.', 'Z'],
      ['Péče o kouzelné tvory.', 'M'],
      ['Obrana proti černé magii.', 'N'],
      ['Starodávné runy.', 'H']
    ]
  },
  {
    text: 'Jaký typ lidí si nejvíc pouštíš k sobě?',
    answers: [
      ['Ty, kteří jsou upřímní a spolehliví.', 'M'],
      ['Ty, kteří jsou bystří a mají rozhled.', 'H'],
      ['Ty, kteří jsou odvážní a jdou si za svým.', 'N'],
      ['Ty, kteří jsou schopní a míří vysoko.', 'Z']
    ]
  },
  {
    text: 'Kdybys našel nebo našla tajnou místnost, co bys udělal/a?',
    answers: [
      ['Důkladně ji prozkoumám a hledám skryté souvislosti.', 'H'],
      ['Nechám si to zatím pro sebe a promyslím, jak to využít.', 'Z'],
      ['Pozvu i ostatní, ať máme objev společně.', 'M'],
      ['Vstoupím bez váhání hned dovnitř.', 'N']
    ]
  },
  {
    text: 'Co je pro tebe větší úspěch?',
    answers: [
      ['Když překonám vlastní strach.', 'N'],
      ['Když někomu opravdu pomůžu.', 'M'],
      ['Když přijdu na něco, co ostatním uniklo.', 'H'],
      ['Když se dostanu nejdál.', 'Z']
    ]
  },
  {
    text: 'Jak by tě nejspíš popsali kamarádi?',
    answers: [
      ['Rozvážný/á.', 'H'],
      ['Statečný/á.', 'N'],
      ['Laskavý/á.', 'M'],
      ['Cílevědomý/á.', 'Z']
    ]
  },
  {
    text: 'Co tě víc přitahuje?',
    answers: [
      ['Zakázaná chodba.', 'N'],
      ['Tichá knihovna.', 'H'],
      ['Teplá společenská místnost.', 'M'],
      ['Tajemství moci a starých rodů.', 'Z']
    ]
  },
  {
    text: 'Kdo bys byl/a v týmu?',
    answers: [
      ['Ten, kdo ostatní podrží.', 'M'],
      ['Ten, kdo přijde s řešením.', 'H'],
      ['Ten, kdo převezme vedení v krizi.', 'N'],
      ['Ten, kdo dotlačí tým k vítězství.', 'Z']
    ]
  },
  {
    text: 'Co by sis vybral/a jako symbol?',
    answers: [
      ['Oheň.', 'N'],
      ['Strom.', 'M'],
      ['Hvězdu.', 'H'],
      ['Hadí kůži.', 'Z']
    ]
  },
  {
    text: 'Které prostředí je ti nejbližší?',
    answers: [
      ['Vysoká věž plná knih a výhledů.', 'H'],
      ['Hřejivé místo plné jídla, smíchu a klidu.', 'M'],
      ['Síň s praskajícím krbem a trofejemi.', 'N'],
      ['Chladná kamenná místnost plná tajemství.', 'Z']
    ]
  },
  {
    text: 'Co uděláš, když tvůj kamarád poruší pravidla?',
    answers: [
      ['Kryju ho, pokud šlo o správnou věc.', 'N'],
      ['Domluvím mu a zkusím mu pomoct to napravit.', 'M'],
      ['Zajímá mě, proč to udělal, a vyhodnotím situaci.', 'H'],
      ['Pokud by mě to mohlo poškodit, držím si odstup.', 'Z']
    ]
  },
  {
    text: 'Co je podle tebe nejdůležitější při cestě za cílem?',
    answers: [
      ['Odvaha udělat první krok.', 'N'],
      ['Trpělivost a vytrvalost.', 'M'],
      ['Schopnost myslet jinak než ostatní.', 'H'],
      ['Vůle zvítězit.', 'Z']
    ]
  },
  {
    text: 'Kdyby si tě měl Moudrý klobouk zapamatovat jednou větou, která by to byla?',
    answers: [
      ['Má dobré srdce a vždy vydrží.', 'M'],
      ['Myslí rychle a vidí dál než ostatní.', 'H'],
      ['Nebojí se jít do rizika.', 'N'],
      ['Ví, čeho chce dosáhnout.', 'Z']
    ]
  }
];

const houses = {
  N: {
    key: 'gryffindor',
    name: 'Nebelvír',
    crest: 'img/nebelvir-erb.webp',
    page: 'prihlaseniNeb.html',
    welcome: 'Vítej mezi odvážnými.',
    message: 'Odvaha, rozhodnost a ochota postavit se tomu, čeho se ostatní bojí, tě přivedly právě sem.'
  },
  M: {
    key: 'hufflepuff',
    name: 'Mrzimor',
    crest: 'img/mrzimor-erb.webp',
    page: 'prihlaseniMrzimor.html',
    welcome: 'Vítej tam, kde na každém záleží.',
    message: 'Trpělivost, věrnost a poctivost jsou silnější, než se na první pohled zdá. Tady mají své místo.'
  },
  H: {
    key: 'ravenclaw',
    name: 'Havraspár',
    crest: 'img/havraspar-erb.webp',
    page: 'prihlaseniHavraspar.html',
    welcome: 'Vítej mezi těmi, kteří hledají odpovědi.',
    message: 'Zvědavost, důvtip a touha poznávat tě přivedly právě sem. Otázky jsou tu stejně cenné jako odpovědi.'
  },
  Z: {
    key: 'slytherin',
    name: 'Zmijozel',
    crest: 'img/zmijozel-erb.webp',
    page: 'prihlaseniZmijozel.html',
    welcome: 'Vítej mezi těmi, kteří vědí, kam směřují.',
    message: 'Ambice, rozhodnost a schopnost najít vlastní cestu tě přivedly právě sem. Využij svůj potenciál naplno.'
  }
};

const introStage = document.getElementById('introStage');
const quizStage = document.getElementById('quizStage');
const thinkingStage = document.getElementById('thinkingStage');
const resultStage = document.getElementById('resultStage');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const questionText = document.getElementById('questionText');
const answerGrid = document.getElementById('answerGrid');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');
const questionPanel = document.querySelector('.question-panel');
const studentGreeting = document.getElementById('studentGreeting');

let currentQuestion = 0;
let answers = [];
let locked = false;

function getStudent() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch (_) {
    return null;
  }
}

function setStudentGreeting() {
  const student = getStudent();
  if (student?.firstName) {
    studentGreeting.textContent = `${student.firstName}, posaďte se. Klobouk už přemýšlí.`;
  }
}

function resetQuiz() {
  currentQuestion = 0;
  answers = [];
  locked = false;
  resultStage.hidden = true;
  thinkingStage.hidden = true;
  quizStage.hidden = false;
  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderQuestion() {
  locked = false;
  const question = questions[currentQuestion];
  progressText.textContent = `Otázka ${currentQuestion + 1} z ${questions.length}`;
  progressBar.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
  questionText.textContent = question.text;
  answerGrid.innerHTML = '';

  question.answers.forEach(([label, house], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-button';
    button.textContent = label;
    button.dataset.house = house;
    button.dataset.index = index;
    button.addEventListener('click', () => chooseAnswer(button, house));
    answerGrid.appendChild(button);
  });

  questionPanel.classList.remove('leaving');
  questionPanel.classList.add('entering');
  window.setTimeout(() => questionPanel.classList.remove('entering'), 340);
}

function chooseAnswer(button, house) {
  if (locked) return;
  locked = true;
  button.classList.add('selected');
  answers[currentQuestion] = house;

  window.setTimeout(() => {
    questionPanel.classList.add('leaving');
    window.setTimeout(() => {
      currentQuestion += 1;
      if (currentQuestion >= questions.length) {
        finishQuiz();
      } else {
        renderQuestion();
      }
    }, 230);
  }, 250);
}

function calculateResult() {
  const scores = { N: 0, M: 0, H: 0, Z: 0 };
  answers.forEach(house => { if (scores[house] !== undefined) scores[house] += 1; });

  const max = Math.max(...Object.values(scores));
  let candidates = Object.keys(scores).filter(house => scores[house] === max);

  if (candidates.length > 1 && candidates.includes(answers[14])) return { house: answers[14], scores };
  if (candidates.length > 1 && candidates.includes(answers[6])) return { house: answers[6], scores };
  if (candidates.length > 1) {
    for (let i = answers.length - 1; i >= 0; i -= 1) {
      if (candidates.includes(answers[i])) return { house: answers[i], scores };
    }
  }
  return { house: candidates[0], scores };
}

async function saveResult(houseCode, scores) {
  const student = getStudent();
  const house = houses[houseCode];
  if (!student) throw new Error('Chybí přihlášený student.');

  if (window.BradaviceDB?.client) {
    try {
      await window.BradaviceDB.setHouseOnce(houseCode);
      const fresh = await window.BradaviceDB.hydrateAll();
      const effectiveCode = fresh?.houseCode || houseCode;
      const effectiveHouse = houses[effectiveCode] || house;
      const updated = {
        ...(fresh || student),
        status: 'sorted',
        sortingCompleted: true,
        house: effectiveHouse.name,
        houseCode: effectiveCode,
        sortingCompletedAt: new Date().toISOString(),
        sortingScores: scores
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.BradaviceAchievements?.award('prvni-kroky', {silent:true});
      return effectiveCode;
    } catch (error) {
      console.error('Rozřazení se nepodařilo uložit do databáze.', error);
      throw error;
    }
  }

  const updated = {
    ...student,
    status: 'sorted',
    sortingCompleted: true,
    house: house.name,
    houseCode,
    sortingCompletedAt: new Date().toISOString(),
    sortingScores: scores
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.BradaviceAchievements?.award('prvni-kroky');
  return houseCode;
}

async function finishQuiz() {
  quizStage.hidden = true;
  thinkingStage.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const result = calculateResult();
  try {
    const effectiveHouse = await saveResult(result.house, result.scores);
    window.setTimeout(() => showResult(effectiveHouse), 2200);
  } catch (error) {
    thinkingStage.hidden = true;
    quizStage.hidden = false;
    alert('Rozřazení se nepodařilo uložit do databáze. Zkontrolujte připojení a zkuste poslední krok znovu.');
  }
}

function showResult(houseCode) {
  const house = houses[houseCode];
  const student = getStudent();

  thinkingStage.hidden = true;
  resultStage.hidden = false;
  resultStage.className = `result-stage ${house.key}`;

  const crest = document.getElementById('resultCrest');
  crest.src = house.crest;
  crest.alt = `Erb koleje ${house.name}`;
  document.getElementById('resultHouse').textContent = house.name;
  document.getElementById('resultWelcome').textContent = house.welcome;
  document.getElementById('resultMessage').textContent = house.message;
  const access=document.getElementById('resultAccess');
  const weekly=window.BradaviceAchievements?.getWeeklyEntry(houseCode);
  if(access){
    if(houseCode==='N') access.textContent=`VSTUP · PORTRÉT · HESLO TÝDNE: ${weekly?.display||'—'}`;
    else if(houseCode==='Z') access.textContent=`VSTUP · KAMENNÁ STĚNA · HESLO TÝDNE: ${weekly?.display||'—'}`;
    else if(houseCode==='H') access.textContent='VSTUP · ORLÍ KLEPADLO · ODPOVĚZ NA JEHO OTÁZKU';
    else access.textContent='VSTUP · SUDY U KUCHYNÍ · SPRÁVNÝ RYTMUS POKLEPÁNÍ';
  }
  document.getElementById('enterHouseLink').href = house.page;

  const personal = document.getElementById('resultPersonal');
  personal.textContent = student?.firstName
    ? `${student.firstName}, tvá cesta v Bradavicích právě začíná.`
    : 'Tvá cesta v Bradavicích právě začíná.';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

startButton.addEventListener('click', () => {
  introStage.hidden = true;
  resetQuiz();
});

restartButton.addEventListener('click', () => {
  resetQuiz();
});

setStudentGreeting();
