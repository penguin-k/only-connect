//HOW TO LOAD A NEW QUESTIONS FILE
//EXPORT GOOGLE SHEETS FILE AS CSV (INCLUDE HEADER ROWS)
//OPEN IN NOTEPAD, LOAD SITE, PRESS L KEY, PASTE IN RAW TEXT

var status = "idle";
/*var questionsDatabase = [];

function resetGame() {
  currentCategory = 0;
  currentQuestion = -1;
}

function loadNewFile(rawFile) {
  splitRounds = rawFile.split("\n");
  questionsDatabase = [];
  //Ignore first row (headers)
  for (var i = 1, length = splitRounds.length; i < length; i++) {
    splitQuestion = splitRounds[i].split(",");
    category = splitQuestion[0];
    question = splitQuestion[2];
    answer = splitQuestion[3];
    categoryID = Math.floor((i-1) / 4);
    if ((i-1) % 4 == 0) {
      //Start of a group of 4, record category title and start new group
      newCategoryObj = {"category":category, questions:[]};
      questionsDatabase.push(newCategoryObj);
    }
    newQuestionObj = {"question":question, "answer":answer};
    questionsDatabase[categoryID].questions.push(newQuestionObj);
  }
  resetGame();
}

document.addEventListener("keydown", function(event) {
  if (status == "solving" && event.which == 82) {
    //r key, reveal answer
    document.getElementById("missing-vowels-question").innerHTML = questionsDatabase[currentCategory].questions[currentQuestion].answer.toUpperCase();
    status = "revealed";
  }
  if ((status == "revealed" || status == "readyToStart") && event.which == 78) {
    //n key, next question
    if (currentQuestion == 3) {
      if (currentCategory+1 == questionsDatabase.length) {
        document.getElementById("missing-vowels-title").innerHTML = "Game complete";
        document.getElementById("missing-vowels-question").innerHTML = "Press x to restart";
        status = "finished";
      } else {
        currentQuestion = 0;
        currentCategory += 1;
      }
    } else {
      currentQuestion += 1;
    }
    if (status != "finished") {
      document.getElementById("missing-vowels-title").innerHTML = questionsDatabase[currentCategory].category;
      document.getElementById("missing-vowels-question").innerHTML = questionsDatabase[currentCategory].questions[currentQuestion].question;
      status = "solving";
    }
  }
  if (status == "waiting" && event.which == 76) {
    //l key, load new stack
    questionsFile = prompt("Paste a question file below and press enter");
    loadNewFile(questionsFile);
    document.getElementById("missing-vowels-question").innerHTML = "Ready to start";
    status = "readyToStart";
  }
  if (event.which == 88) {
    //x key, reset game
    resetGame();
    document.getElementById("missing-vowels-title").innerHTML = "Missing vowels";
    document.getElementById("missing-vowels-question").innerHTML = "Ready to start";
    status = "readyToStart";
  }
})*/

function showReadyScreen() {
  document.getElementById("missing-vowels-title").innerHTML = "Missing vowels";
  document.getElementById("missing-vowels-question").innerHTML = "Ready to play!";
}

function showCompleteScreen() {
  document.getElementById("missing-vowels-title").innerHTML = "Game complete";
  document.getElementById("missing-vowels-question").innerHTML = "Thanks for playing!";
}

function showQuestionScreen() {
  questionObj = JSON.parse(localStorage.getItem("only-connect-question"));
  document.getElementById("missing-vowels-title").innerHTML = questionObj.category;
  document.getElementById("missing-vowels-question").innerHTML = questionObj.question;
}

function showAnswerScreen() {
  questionObj = JSON.parse(localStorage.getItem("only-connect-question"));
  document.getElementById("missing-vowels-title").innerHTML = questionObj.category;
  document.getElementById("missing-vowels-question").innerHTML = questionObj.answer;
  document.getElementById("missing-vowels-tips").style.display = "none";
}

function updateScoreTable() {
  scoresTable = JSON.parse(localStorage.getItem("scoresTable"));
  teamNames = JSON.parse(localStorage.getItem("teamNames"));
  document.getElementById("score-team-1-score").innerHTML = scoresTable[0];
  document.getElementById("score-team-2-score").innerHTML = scoresTable[1];
  document.getElementById("score-team-1-name").innerHTML = teamNames[0];
  document.getElementById("score-team-2-name").innerHTML = teamNames[1];
}

function updateState() {
  status = localStorage.getItem("only-connect-status");
  if (status == "readyToStart") {
    showReadyScreen();
    document.getElementById("missing-vowels-question").style.display = "block";
  } else if (status == "finished") {
    showCompleteScreen();
    document.getElementById("missing-vowels-question").style.display = "block";
  } else if (status == "solving") {
    showQuestionScreen();
    document.getElementById("missing-vowels-question").style.display = "block";
  } else if (status == "revealed") {
    showAnswerScreen();
    document.getElementById("missing-vowels-question").style.display = "block";
  } else if (status == "nextCategory") {
    document.getElementById("missing-vowels-question").style.display = "none";
    setTimeout(function(){ 
      showQuestionScreen(); 
    }, 250);
  }
}

window.addEventListener('storage', () => {
  // When local storage changes, dump the list to
  // the console.
  if (localStorage.getItem("only-connect-status") != status) {
    updateState();
  } else if (localStorage.getItem("only-connect-simplified") == "spaces") {
    document.getElementById("missing-vowels-tips").style.display = "block";
    showQuestionScreen();
  }
  updateScoreTable();
});

function pageLoadInit() {
  if (localStorage.getItem("only-connect-status") != "waiting") {
    updateState();
    updateScoreTable();
  }
}