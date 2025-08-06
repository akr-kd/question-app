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
    const [questionsRes, recommendationsRes] = await Promise.all([
      fetch("data/questions-2.json"),
      fetch("data/recommendations-2.json")
    ]);
    if (!questionsRes.ok || !recommendationsRes.ok) {
      throw new Error('ファイルが見つからないか、読み込みに失敗しました。');
    }
    let questionsData = await questionsRes.json();
    let recommendationsData = await recommendationsRes.json();

    // データ形式をチェックして、必要であれば整形する
    if (questionsData.length > 0 && questionsData[0].option_label) {
      questions = parseQuestions(questionsData);
    } else {
      questions = questionsData;
    }

    if (recommendationsData.length > 0 && recommendationsData[0].condition1) {
      recommendations = parseRecommendations(recommendationsData);
    } else {
      recommendations = recommendationsData;
    }

    startBtn.onclick = startQuiz;
    nextBtn.onclick = nextQuestion;
    restartBtn.onclick = restartQuiz;
  } catch (error) {
    console.error("データの読み込みに失敗しました:", error);
    const startScreenP = document.querySelector("#startScreen p");
    startScreenP.innerHTML = "診断データの読み込みに失敗しました。<br>ファイルを確認してください。";
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
}

function updateProgress() {
  if (questions.length === 0) return;
  const progress = (currentIndex / questions.length) * 100;
  progressBar.style.width = `${progress}%`;
}