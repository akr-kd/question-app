let selectedAnswers = {};
let questions = [];
let recommendations = [];
let currentIndex = 0;

// DOM要素をあらかじめ取得
const startScreen = document.getElementById("startScreen");
const quizDiv = document.getElementById("quiz");
const resultDiv = document.getElementById("result");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const startBtn = document.getElementById("startBtn");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");

window.onload = async () => {
  try {
    // Excelファイルを一つ上の階層のdataフォルダから読み込む
    const response = await fetch("../data/questions.xlsx");
    if (!response.ok) {
      throw new Error('questions.xlsx が見つからないか、読み込みに失敗しました。');
    }
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, {type: "array"});

    // 1. 質問シートの解析
    const questionsSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonQuestions = XLSX.utils.sheet_to_json(questionsSheet);
    questions = parseQuestions(jsonQuestions);

    // 2. 推薦シートの解析
    const recommendationsSheet = workbook.Sheets[workbook.SheetNames[1]];
    const jsonRecommendations = XLSX.utils.sheet_to_json(recommendationsSheet);
    recommendations = parseRecommendations(jsonRecommendations);

    startBtn.onclick = startQuiz;
    nextBtn.onclick = nextQuestion;
    restartBtn.onclick = restartQuiz;

  } catch (error) {
    console.error("データの読み込みまたは解析に失敗しました:", error);
    const startScreenP = document.querySelector("#startScreen p");
    startScreenP.innerHTML = `診断データの読み込みに失敗しました。<br>(${error.message})`;
    startScreenP.style.color = 'red';
    startBtn.disabled = true; // ボタンは消さずに、クリックできないようにする
  }
};

function parseQuestions(jsonData) {
  const questionMap = {};
  jsonData.forEach(row => {
    if (!row.id || !row.question || !row.option_label || !row.option_value) return;
    if (!questionMap[row.id]) {
      questionMap[row.id] = {
        id: row.id,
        question: row.question,
        options: []
      };
    }
    questionMap[row.id].options.push({ label: row.option_label, value: row.option_value });
  });
  return Object.values(questionMap);
}

function parseRecommendations(jsonData) {
  return jsonData.map(row => {
    const conditions = Object.keys(row)
      .filter(key => key.startsWith('condition') && row[key])
      .map(key => row[key]);
    return {
      conditions: conditions,
      recommendation: row.recommendation
    };
  }).filter(rec => rec.conditions.length > 0 && rec.recommendation);
}

function startQuiz() {
  startScreen.style.display = "none";
  resultDiv.style.display = "none";
  restartBtn.style.display = "none";
  
  quizDiv.style.display = "block";
  nextBtn.style.display = "inline-block";
  progressContainer.style.display = "block";

  selectedAnswers = {};
  currentIndex = 0;
  updateProgress();
  renderQuestion();
}

function nextQuestion() {
  const q = questions[currentIndex];
  const selected = document.querySelector(`input[name='${q.id}']:checked`);
  
  if (selected) {
    selectedAnswers[q.id] = selected.value;
    currentIndex++;
    if (currentIndex < questions.length) {
      updateProgress();
      renderQuestion();
    } else {
      showResult();
    }
  } else {
    alert("選択肢を選んでください。");
  }
}

function renderQuestion() {
  quizDiv.innerHTML = ""; // 前回の質問をクリア
  if (!questions[currentIndex]) return;

  const q = questions[currentIndex];
  const questionWrapper = document.createElement("div");
  questionWrapper.className = "question fade-in";
  
  const questionText = document.createElement("p");
  questionText.textContent = q.question;
  questionWrapper.appendChild(questionText);

  q.options.forEach(opt => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = q.id;
    input.value = opt.value;
    input.id = `${q.id}_${opt.value}`;

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = opt.label;

    optionDiv.appendChild(input);
    optionDiv.appendChild(label);
    questionWrapper.appendChild(optionDiv);
  });

  quizDiv.appendChild(questionWrapper);
}

function showResult() {
  quizDiv.style.display = "none";
  nextBtn.style.display = "none";
  progressContainer.style.display = "none";

  resultDiv.style.display = "block";
  restartBtn.style.display = "inline-block";
  resultDiv.classList.add("fade-in");

  const answers = Object.values(selectedAnswers);
  const match = recommendations.find(rec =>
    rec.conditions.length > 0 && rec.conditions.every(c => answers.includes(c))
  );
  
  resultDiv.textContent = match
    ? match.recommendation
    : "あなたにぴったりの支援は見つかりませんでした。";
}

function restartQuiz() {
  resultDiv.style.display = "none";
  restartBtn.style.display = "none";
  quizDiv.innerHTML = "";
  resultDiv.textContent = "";
  resultDiv.classList.remove("fade-in");
  
  startScreen.style.display = "block";
  startScreen.classList.add("fade-in");
  
  // Reset quiz state
  selectedAnswers = {};
  currentIndex = 0;
  updateProgress(); // Progress barをリセット
}

function updateProgress() {
  if (questions.length === 0) {
    progressBar.style.width = '0%';
    return;
  }
  const progress = (currentIndex / questions.length) * 100;
  progressBar.style.width = `${progress}%`;
}

