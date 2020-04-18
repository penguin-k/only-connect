//HOW TO LOAD A NEW QUESTIONS FILE
//EXPORT GOOGLE SHEETS FILE AS CSV (INCLUDE HEADER ROWS)
//OPEN IN NOTEPAD, LOAD SITE, PRESS L KEY, PASTE IN RAW TEXT

var status = "waiting";
var questionsDatabase = [];

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
})