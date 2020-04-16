//HOW TO LOAD A NEW QUESTIONS FILE
//EXPORT GOOGLE SHEETS FILE AS CSV (INCLUDE HEADER ROWS)
//OPEN IN NOTEPAD, LOAD SITE, PRESS L KEY, PASTE IN RAW TEXT

var status = "waiting";
localStorage.setItem("only-connect-status", "waiting");
var questionsDatabase = [];
var categoriesList = [];
var categorySchedule = [];
var archiveSchedule = [];
var scoresTable = [0, 0];
var teamNames = ["Team 1", "Team 2"];
const defaultPoints = 1; //Default points per question
var teamNumberStore = -1; //Used to hold the team whose score is being updated
var teamScoreStore = null; //Used to hold the score about to be added
var nextButton = null;
var skipButton = null;
var team1awardButton = null;
var team2awardButton = null;
var loadFileButton = null;
var changeScheduleButton = null;
var completedCategories = [];
var scheduleButtonMode = "normal";

function resetGame() {
  currentCategory = 0;
  currentCatName = categorySchedule[0];
  currentQuestion = -1;
  var scoresTable = [0, 0];
}

function removeVowels(answer) {
  capitalAnswer = answer.toUpperCase();
  return capitalAnswer.replace(/[aeiou()]/gi, '');
}

function simplifyQuestion() {
  if (status == "solving") {
    answer = questionsDatabase[currentCatName].questions[currentQuestion].answer;
    newQuestion = removeVowels(answer);
    document.getElementById("missing-vowels-question").innerHTML = newQuestion;
    localStorage.setItem("only-connect-question", JSON.stringify({"category":currentCatName, "question":newQuestion, "answer":questionsDatabase[currentCatName].questions[currentQuestion].answer.toUpperCase()}));
    localStorage.setItem("only-connect-simplified", "spaces");
  }
}

function selectTeam(teamNumber) {
  teamNumberStore = teamNumber;
  document.getElementById("missing-vowels-command").innerHTML = "<b>Team "+String(teamNumber)+"</b>: "+String(defaultPoints)+" points (default)";
  teamScoreStore = null;
}

function addPoints(teamNumber, points) {
  scoresTable[teamNumber - 1] += points;
  updateScoreTable();
}

function updateTeamName(teamNumber) {
  if (status != "waiting" && status != "readyToStart") {
    if (status == "finished") {
      return
    } else {
      manuallyAdjustScore(teamNumber);
      return
    }
  }
  nameInput = prompt("Type a new name for team "+String(teamNumber));
  if (nameInput != "") {
    teamNames[teamNumber-1] = nameInput;
    updateScoreTable();
  }
}

function manuallyAdjustScore(teamNumber) {
  if (status == "waiting" || status == "readyToStart" || status == "finished") {
    return
  } 
  try {
    var newScore = parseInt(prompt("**ADJUST SCORE**\nEnter a new score for the team "+teamNames[teamNumber-1]+":"));
    scoresTable[teamNumber-1] = newScore;
    updateScoreTable();
  }
  catch (err) {
    console.error(err);
    alert("Failed to update score");
  }
}

function updateScoreTable() {
  document.getElementById("score-team-1-score").innerHTML = scoresTable[0];
  document.getElementById("score-team-2-score").innerHTML = scoresTable[1];
  document.getElementById("score-team-1-name").innerHTML = teamNames[0];
  document.getElementById("score-team-2-name").innerHTML = teamNames[1];
  localStorage.setItem("scoresTable", JSON.stringify(scoresTable));
  localStorage.setItem("teamNames", JSON.stringify(teamNames));
}

function createScheduleOriginalOrder() {
  //schedule the categories according to their original order in the imported file
  categorySchedule = [];
  archiveSchedule = [];
  for (var i = 0, length = categoriesList.length; i < length; i++) {
    categorySchedule.push(categoriesList[i]);
  }
  archiveSchedule = categorySchedule;
}

function loadNewFile(rawFile) {
  splitRounds = rawFile.split("\n");
  questionsDatabase = [];
  categoriesList = [];
  categorySchedule = [];
  archiveSchedule = [];
  //Ignore first row (headers)
  //Find the categories
  for (var i = 1, length = splitRounds.length; i < length; i++) {
    splitQuestion = splitRounds[i].split(",");
    category = splitQuestion[0];
    if (!categoriesList.includes(category) && category !== "") {
      questionsDatabase[category] = {"category":category, questions:[]};
      categoriesList.push(category);
    }
  }
  //Populate the categories
  for (var i = 1, length = splitRounds.length; i < length; i++) {
    splitQuestion = splitRounds[i].split(",");
    category = splitQuestion[0];
    question = splitQuestion[2];
    answer = splitQuestion[3];
    if (category === "" || question === "" || answer === "" || !categoriesList.includes(category)) {
      continue
    }
    /*categoryID = Math.floor((i-1) / 4);
    if ((i-1) % 4 == 0) {
      //Start of a group of 4, record category title and start new group
      newCategoryObj = {"category":category, questions:[]};
      questionsDatabase.push(newCategoryObj);
    }
    newQuestionObj = {"question":question, "answer":answer};
    questionsDatabase[categoryID].questions.push(newQuestionObj);*/
    newQuestionObj = {"question":question, "answer":answer};
    questionsDatabase[category].questions.push(newQuestionObj);
  }
  createScheduleOriginalOrder();
  resetGame();
  changeScheduleButton.classList.remove("buttonDisabled");
  document.getElementById("missing-vowels-question").innerHTML = "Question file loaded";
  document.getElementById("missing-vowels-answer").innerHTML = "Ready: "+String(categorySchedule.length)+" categories loaded";
  status = "readyToStart";
  localStorage.setItem("only-connect-status", "readyToStart");
  nextButton.classList.remove("buttonDisabled");
  nextButton.innerHTMl = "Start (N)";
  updateScoreTable();
}

function moveToNextQuestion() {
  if (status != "revealed" && status != "readyToStart" && status != "nextCategory") {
    //Wrong mode
    return
  }
  if (currentQuestion == questionsDatabase[currentCatName].questions.length-1) {
    //If there are no questions left in this category, move to the next round
    currentQuestion = -1;
    //currentCategory += 1;
    completedCategories.push(currentCatName);
    categorySchedule.shift();
    if (categorySchedule.length == 0) {
      //If there are no categories left, end the game
      document.getElementById("missing-vowels-title").innerHTML = "Game complete";
      document.getElementById("missing-vowels-question").innerHTML = "Press F5 to restart";
      document.getElementById("missing-vowels-answer").innerHTML = "Ready";
      status = "finished";
      localStorage.setItem("only-connect-status", "finished");
      nextButton.classList.add("buttonDisabled");
      skipButton.classList.add("buttonDisabled");
      team1awardButton.classList.add("buttonDisabled");
      team2awardButton.classList.add("buttonDisabled");
      return false
    } else {
      currentCatName = categorySchedule[0];
      status = "nextCategory";
      localStorage.setItem("only-connect-status", "nextCategory");
      document.getElementById("missing-vowels-title").innerHTML = currentCatName;
      document.getElementById("missing-vowels-question").innerHTML = "<em>New round</em>";
      document.getElementById("missing-vowels-answer").innerHTML = "Press n key to continue";
      localStorage.setItem("only-connect-question", JSON.stringify({"category":currentCatName, "question":"New round", "answer":"New round"}));
      return
    }
  /*if (categorySchedule.length == 0) {
    //If there are no categories left, end the game
    document.getElementById("missing-vowels-title").innerHTML = "Game complete";
    document.getElementById("missing-vowels-question").innerHTML = "Press F5 to restart";
    document.getElementById("missing-vowels-answer").innerHTML = "Ready";
    status = "finished";
    localStorage.setItem("only-connect-status", "finished");
    nextButton.classList.add("buttonDisabled");
    skipButton.classList.add("buttonDisabled");
    team1awardButton.classList.add("buttonDisabled");
    team2awardButton.classList.add("buttonDisabled");
  } else if (currentQuestion == questionsDatabase[currentCatName].questions.length-1) {
    //If there are no questions left in this category, move to the next round
    currentQuestion = -1;
    //currentCategory += 1;
    completedCategories.push(currentCatName);
    categorySchedule.shift();
    //currentCatName = categorySchedule[currentCategory];
    currentCatName = categorySchedule[0];
    status = "nextCategory";
    localStorage.setItem("only-connect-status", "nextCategory");
    document.getElementById("missing-vowels-title").innerHTML = currentCatName;
    document.getElementById("missing-vowels-question").innerHTML = "<em>New round</em>";
    document.getElementById("missing-vowels-answer").innerHTML = "Press n key to continue";
    localStorage.setItem("only-connect-question", JSON.stringify({"category":currentCatName, "question":"New round", "answer":"New round"}));
    return*/
  } else {
    //If there are still questions left to go in this round, continue to the next question
    currentQuestion += 1;
  }
  if (status != "finished") {
    document.getElementById("missing-vowels-title").innerHTML = currentCatName;
    document.getElementById("missing-vowels-question").innerHTML = questionsDatabase[currentCatName].questions[currentQuestion].question;
    document.getElementById("missing-vowels-answer").innerHTML = questionsDatabase[currentCatName].questions[currentQuestion].answer.toUpperCase();
    localStorage.setItem("only-connect-question", JSON.stringify({"category":currentCatName, "question":questionsDatabase[currentCatName].questions[currentQuestion].question, "answer":questionsDatabase[currentCatName].questions[currentQuestion].answer.toUpperCase()}));
    status = "solving";
    localStorage.setItem("only-connect-status", "solving");
    nextButton.classList.add("buttonDisabled");
    nextButton.innerHTML = "Next (N)";
    skipButton.classList.remove("buttonDisabled");
    team1awardButton.classList.remove("buttonDisabled");
    team2awardButton.classList.remove("buttonDisabled");
    loadFileButton.classList.add("buttonDisabled");
  }
}

function revealAnswer() {
  if (status == "solving") {
    document.getElementById("missing-vowels-question").innerHTML = "<em>Revealed</em>";
    status = "revealed";
    localStorage.setItem("only-connect-status", "revealed");
    localStorage.setItem("only-connect-simplified", "no");
    nextButton.classList.remove("buttonDisabled");
    skipButton.classList.add("buttonDisabled");
  }
}

function submitScoreChange() {
  if (teamScoreStore === null) {
    teamScoreStore = defaultPoints;
  }
  addPoints(teamNumberStore, parseInt(teamScoreStore));
  document.getElementById("missing-vowels-command").innerHTML = "Press 1 or 2 to select team";
  teamNumberStore = -1;
  teamScoreStore = null;
  //moveToNextQuestion();
  revealAnswer();
}

function awardDefaultPoints(team) {
  if (status == "solving" || status == "revealed") {
    selectTeam(team); submitScoreChange();
  }
}

function saveFileToMemory(rawFile) {
  localStorage.setItem("only-connect-missing-vowels-file", rawFile);
}

function loadCachedFile() {
  if (localStorage.getItem("only-connect-missing-vowels-file" === null)) {
    return false
  } else {
    try {
      rawFile = localStorage.getItem("only-connect-missing-vowels-file");
      loadNewFile(rawFile);
      return true
    }
    catch (err) {
      console.error("Failed to load cached questions file: ", err)
      return false
    }
  }
}

function promptFileUpload() {
  if (status == "waiting" || status == "readyToStart") {
    questionsFile = prompt("Paste a question file below and press enter");
    loadNewFile(questionsFile);
    saveFileToMemory(questionsFile);
  }
}

function updateScheduleWindowButtonStates() {
  //Get button
  var firstButton = document.getElementById("schedule-window-first-button");
  var lastButton = document.getElementById("schedule-window-last-button");
  //Clear all
  firstButton.classList.remove("button-mode-active");
  lastButton.classList.remove("button-mode-active");
  //Reset as required
  if (scheduleButtonMode == "first") {
    firstButton.classList.add("button-mode-active");
  } else if (scheduleButtonMode == "last") {
    lastButton.classList.add("button-mode-active");
  }
}

function engageNextModeSchedule(button) {
  if (scheduleButtonMode == "first") {
    scheduleButtonMode = "normal";
  } else {
    scheduleButtonMode = "first";
  }
  updateScheduleWindowButtonStates();
}

function engageLastModeSchedule(button) {
  if (scheduleButtonMode == "last") {
    scheduleButtonMode = "normal";
  } else {
    scheduleButtonMode = "last";
  }
  updateScheduleWindowButtonStates();
}

function removeCategoryFromSchedule(catName) {
  if (scheduleButtonMode == "first") {
    //send item to first (i.e. next) place
    var currentIndex = categorySchedule.indexOf(catName);
    categorySchedule.splice(currentIndex, 1);
    categorySchedule.unshift(catName);
    //scheduleButtonMode = "normal"; //BUTTON DOES NOT RESET AUTOMATICALLY NOW
    //updateScheduleWindowButtonStates();
    populateScheduleWindow();
  } if (scheduleButtonMode == "last") {
    //send item to last place
    var currentIndex = categorySchedule.indexOf(catName);
    categorySchedule.splice(currentIndex, 1);
    categorySchedule.push(catName);
    //scheduleButtonMode = "normal"; //BUTTON DOES NOT RESET AUTOMATICALLY NOW
    //updateScheduleWindowButtonStates();
    populateScheduleWindow();
  } else if (scheduleButtonMode == "normal") {
    //delete item from schedule side, then refresh to update the other side
    var oldItemPos = categorySchedule.indexOf(categoryName);
    var newSchedule = categorySchedule.filter(e => e !== catName);
    categorySchedule = newSchedule;
    document.getElementById("schedule-selected-option-"+String(oldItemPos)).remove();
    populateScheduleWindow();
  }
}

function addCategoryToSchedule(catName) {
  //add to schedule, then refresh to update
  //note: item will be added to the bottom of the schedule (i.e. last in the game)
  var currentIndex = categorySchedule.indexOf(catName);
  if (currentIndex > -1) {
    //If already in the schedule, move it to the end
    //categorySchedule.splice(currentIndex, 1);
    //Cancel operation
    return
  }
  categorySchedule.push(catName);
  populateScheduleWindow();
}

function populateScheduleWindow() {
  //Section 1: get elements required
  var bankWindow = document.getElementById("schedule-bank-window");
  var selectedWindow = document.getElementById("schedule-selected-window");
  //Section 1a: clear those elements
  while (bankWindow.firstChild) {
    bankWindow.firstChild.remove();
  }
  while (selectedWindow.firstChild) {
    selectedWindow.firstChild.remove();
  }
  //Section 2: populate bank of categories
  for (var i = 0, length = categoriesList.length; i < length; i++) {
    categoryName = categoriesList[i];
    var optionNode = document.createElement("div");
    optionNode.classList.add("schedule-option");
    optionNode.id = "schedule-bank-option-"+String(i);
    questionsInCat = questionsDatabase[categoryName].questions.length;
    optionNode.innerHTML = categoryName+" ("+String(questionsInCat)+")";
    eval(`optionNode.onclick = function() {addCategoryToSchedule('${categoryName}')}`);
    if (completedCategories.includes(categoryName)) {
      //Already seen, so blank it out
      optionNode.classList.add("schedule-option-seen");
    } else if (categorySchedule.includes(categoryName)) {
      optionNode.classList.add("schedule-option-selected");
    }
    bankWindow.appendChild(optionNode);
  }
  //Section 3: populate current schedule
  for (var i = 0, length = categorySchedule.length; i < length; i++) {
    categoryName = categorySchedule[i];
    var optionNode = document.createElement("div");
    optionNode.classList.add("schedule-option");
    optionNode.id = "schedule-selected-option-"+String(i);
    questionsInCat = questionsDatabase[categoryName].questions.length;
    optionNode.innerHTML = categoryName+" ("+String(questionsInCat)+")";
    eval(`optionNode.onclick = function() {removeCategoryFromSchedule('${categoryName}')}`);
    if (completedCategories.includes(categoryName)) {
      //Already seen, so blank it out
      optionNode.classList.add("schedule-option-seen");
    }
    selectedWindow.appendChild(optionNode);
  }
}

function showScheduleWindow() {
  populateScheduleWindow();
  document.getElementById("schedule-window").style.display = "block";
  scheduleButtonMode = "normal";
  updateScheduleWindowButtonStates();
}

function hideScheduleWindow() {
  if (document.getElementById("schedule-window").style.display == "block") {
    document.getElementById("schedule-window").style.display = "none";
    currentCatName = categorySchedule[0];
    if (completedCategories.length == 0) {
      return
    } else if (currentQuestion == questionsDatabase[currentCatName].questions.length-1 || currentQuestion < 0) {
      status = "nextCategory";
      localStorage.setItem("only-connect-status", "-");
      localStorage.setItem("only-connect-status", "nextCategory");
      document.getElementById("missing-vowels-title").innerHTML = currentCatName;
      document.getElementById("missing-vowels-question").innerHTML = "<em>New round</em>";
      document.getElementById("missing-vowels-answer").innerHTML = "Press n key to continue";
      localStorage.setItem("only-connect-question", JSON.stringify({"category":currentCatName, "question":"New round", "answer":"New round"}));
    }
  }
  scheduleButtonMode = "normal";
  updateScheduleWindowButtonStates();
}

document.addEventListener("keydown", function(event) {
  if (status == "solving" && event.which == 82) {
    //r key, reveal answer
    revealAnswer();
  }
  if ((status == "revealed" || status == "readyToStart" || status == "nextCategory") && event.which == 78) {
    //n key, next question
    moveToNextQuestion();
  }
  if ((status == "waiting" || status == "readyToStart") && event.which == 76) {
    //l key, load new stack
    promptFileUpload();
  }
  if (event.which == 88 && false == true) {
    //DISABLED
    //x key, reset game
    resetGame();
    document.getElementById("missing-vowels-title").innerHTML = "Missing vowels";
    document.getElementById("missing-vowels-question").innerHTML = "Question file loaded";
    document.getElementById("missing-vowels-answer").innerHTML = "Ready";
    status = "readyToStart";
    localStorage.setItem("only-connect-status", "readyToStart");
    updateScoreTable();
  }
  if (event.which == 83 && status == "solving") {
    simplifyQuestion();
  } else if (event.which == 49 && teamNumberStore == -1) {
    //addPoints(1, defaultPoints);
    selectTeam(1);
    submitScoreChange(); //TEMP - removes option to add a score other than the default
  } else if (event.which == 50 && teamNumberStore == -1) {
    //addPoints(2, defaultPoints);
    selectTeam(2);
    submitScoreChange(); //TEMP - removes option to add a score other than the default
  } else if (event.which >= 48 && event.which <= 57) {
    /*scoreToAdd = String(event.which - 48);
    if (teamScoreStore === null) {
      teamScoreStore = scoreToAdd;
    } else {
      teamScoreStore += scoreToAdd;
    }*/ //Disables score updates through keyboard
    document.getElementById("missing-vowels-command").innerHTML = "<b>Team "+String(teamNumberStore)+"</b>: "+String(teamScoreStore)+" points";
  } else if (event.which == 189) {
    /*if (teamScoreStore === null) {
      teamScoreStore = "-";
    } else if (teamScoreStore[0] != "-") {
      teamScoreStore = "-"+teamScoreStore;
    } else {
      teamScoreStore = teamScoreStore.substring(1);
    }*/ //Disables score updates through keyboard
    document.getElementById("missing-vowels-command").innerHTML = "<b>Team "+String(teamNumberStore)+"</b>: "+String(teamScoreStore)+" points";
  }
  if (event.which == 27) {
    hideScheduleWindow();
  }
  if (event.which == 27 && teamNumberStore != -1) {
    document.getElementById("missing-vowels-command").innerHTML = "Press 1 or 2 to select team";
    teamNumberStore = -1;
    teamScoreStore = null;
  }
  if (event.which == 13 && teamNumberStore != -1 && teamScoreStore != "-") {
    submitScoreChange();
  } else if (event.which == 13) {
    if (status == "revealed") {
      moveToNextQuestion();
    }
  }
})

function pageLoadInit() {
  nextButton = document.getElementById("next-question-button");
  skipButton = document.getElementById("skip-button");
  team1awardButton = document.getElementById("team-1-points-button");
  team2awardButton = document.getElementById("team-2-points-button");
  loadFileButton = document.getElementById("load-file-button");
  changeScheduleButton = document.getElementById("change-schedule-button");
  nextButton.classList.add("buttonDisabled");
  skipButton.classList.add("buttonDisabled");
  team1awardButton.classList.add("buttonDisabled");
  team2awardButton.classList.add("buttonDisabled");
  changeScheduleButton.classList.add("buttonDisabled");
  localStorage.setItem("only-connect-status", "waiting");
  localStorage.setItem("only-connect-question", "waiting");
  localStorage.setItem("scoresTable", scoresTable);
  teamNames = JSON.parse(localStorage.getItem("teamNames"));
  localStorage.setItem("only-connect-simplified", "no");
  updateScoreTable();
  loadCachedFile();
}

window.addEventListener('beforeunload', function (e) {
  // Cancel the event
  e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
  // Chrome requires returnValue to be set
  e.returnValue = '';
});