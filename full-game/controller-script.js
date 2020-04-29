const timerLength = [30, 30, 120]; //Time allowed per question in seconds, by round
countdownTimer = null; //Stores the countdown timer object
timeRemaining = 0; //Stores the time remaining in seconds
displayWindow = null;
targetOrigin = null;
gameSchedule = null; //Stores the original database of questions
remainingSchedule = null; //Starts the same as gameSchedule, but its questions are removed as they're played
activeRound = null; //The object of the current round. Questions are removed as they're played
activeRoundNumber = null; //The round number, ie. 1-4
activeQuestion = null; //Stores the question object currently being played
activeHieroglyph = null; //Stores the index of the selected hieroglyph, ie. 0 means 𓇌 (two reeds)
pointsAvailable = 0; //Points available for a correct answer
pointsType = "normal"; //normal for most, steal if attempting for a bonus point
activeTeam = 0; //1 or 2, depending on the active team
scores = [0, 0]; //An array of the current scores
teamNames = ["Team 1", "Team 2"]; //An array of the team names

//Load question files
function loadQuestionFileLocalStorage() {
  cachedSchedule = localStorage.getItem("only-connect-schedule-cached");
  if (cachedSchedule === null) {
    return false
  } else {
    gameSchedule = JSON.parse(cachedSchedule);
    remainingSchedule = gameSchedule;
    loadNewRound(true); //load the first round
    return true
  }
}

//Load a new round of questions
//Skip delete for the first round
function loadNewRound(skipDelete=false) {
  if (!skipDelete) {
    if (remainingSchedule.round1.length > 0) {
      //this is a round 1
      remainingSchedule.round1.shift();
    } else if (remainingSchedule.round2.length > 0) {
      //this is a round 2
      remainingSchedule.round2.shift();
    } else if (remainingSchedule.round3.length > 0) {
      //this is a round 3
      remainingSchedule.round3.shift();
    } else if (remainingSchedule.round4.length > 0) {
      //this is a round 4
      remainingSchedule.round4.shift();
    }
  }
  //Load the question bank
  if (remainingSchedule.round1.length > 0) {
    //this is a round 1
    document.getElementById("round-name-cell").innerHTML = "Round 1: Connections";
    activeRound = remainingSchedule.round1[0];
    activeRoundNumber = 1;
  } else if (remainingSchedule.round2.length > 0) {
    //this is a round 2
    document.getElementById("round-name-cell").innerHTML = "Round 2: Sequences";
    activeRound = remainingSchedule.round2[0];
    activeRoundNumber = 2;
  } else if (remainingSchedule.round3.length > 0) {
    //this is a round 3
    document.getElementById("round-name-cell").innerHTML = "Round 3: Connecting walls";
    activeRound = remainingSchedule.round3[0];
    activeRoundNumber = 3;
  } else if (remainingSchedule.round4.length > 0) {
    //this is a round 4
    document.getElementById("round-name-cell").innerHTML = "Round 4: Missing vowels";
    activeRound = remainingSchedule.round4[0];
    activeRoundNumber = 4;
  } else {
    //game is complete
    document.getElementById("round-name-cell").innerHTML = "Game complete!";
    activeRoundNumber = null;
    activeRound = null;
    alert("Game complete");
    return
  }
  postMessageToDisplay({"message":"newRound", "number":activeRoundNumber});
  //Reset all buttons to their default state, ready for a new round
  //hieroglyph buttons
  allButtons = document.querySelectorAll(".hieroglyph-button");
  for (let i = 0; i < allButtons.length; i++) {
    button = allButtons[i];
    button.classList.remove("active-hieroglyph-button");
    button.classList.remove("disabled-hieroglyph-button");
    activeHieroglyph = null;
  }
  if (activeRoundNumber == 1 || activeRoundNumber == 2) {
    postMessageToDisplay({"message":"showHieroglyphSelect"});
    updateHieroglyphList();
  }
  //game table
  document.getElementById("game-timer-cell").innerHTML = "Start new round";
  document.getElementById("game-points-cell").innerHTML = "Waiting for host";
  //clue cells
  clueCells = document.querySelectorAll(".game-clue-cell");
  for (let i = 0; i < clueCells.length; i++) {
    clueCell = clueCells[i];
    clueCell.classList.remove("game-clue-cell-revealed");
  }
  document.getElementById("game-connection-cell").innerHTML = "Idle";
  document.getElementById("game-connection-cell").classList.remove("connection-revealed");
  document.querySelectorAll(".control-button").forEach(function(button) {
    button.classList.remove("control-button-active");
  });
  activeQuestion = null;
  pointsAvailable = 0;
}

//Start the timer and update the display 
//To pause the timer: clearInterval(countdownTimer);
function startTimer() {
  clearInterval(countdownTimer);
  timeRemaining = timerLength[activeRoundNumber-1];
  postMessageToDisplay({"message":"timerStarted", "seconds":timeRemaining});
  if (timeRemaining == 0) {
    document.getElementById("game-timer-cell").innerHTML = `Unlimited time`;
    return
  }
  document.getElementById("game-timer-cell").innerHTML = `<strong>${timeRemaining}</strong> seconds left`;
  countdownTimer = setInterval(function() {
    timeRemaining -= 1;
    document.getElementById("game-timer-cell").innerHTML = `<strong>${timeRemaining}</strong> seconds left`;
    if (timeRemaining < 0) {
      clearInterval(countdownTimer);
      document.getElementById("game-timer-cell").innerHTML = "<strong>OUT OF TIME</strong>";
      postMessageToDisplay({"message":"outOfTime"});
    }
  }, 1000);
}

//From the restart timer button
function restartTimer(sourceElement) {
  return //TESTING
  if (!sourceElement.classList.contains("control-button-active")) {
    return
  }
  startTimer();
}

//Allow the active team to guess the answer
function attemptSolve(sourceElement, teamNumber) {
  if (!sourceElement.classList.contains("control-button-active")) {
    return
  }
  sourceElement.classList.remove("control-button-active");
  document.getElementsByClassName("correct-button")[teamNumber-1].classList.add("control-button-active");
  document.getElementsByClassName("incorrect-button")[teamNumber-1].classList.add("control-button-active");
  //Stop the clock
  clearInterval(countdownTimer);
  document.getElementById("reset-timer-button").classList.remove("control-button-active"); 
  postMessageToDisplay({"message":"attemptingSolve", "team":teamNumber});
}

//Record the team's answer as correct
function recordAnswerAsCorrect(sourceElement, teamNumber) {
  if (!sourceElement.classList.contains("control-button-active")) {
    return
  }
  document.getElementsByClassName("correct-button")[teamNumber-1].classList.remove("control-button-active");
  document.getElementsByClassName("incorrect-button")[teamNumber-1].classList.remove("control-button-active");
  scores[teamNumber-1] += pointsAvailable;
  document.getElementById("reveal-button").classList.add("control-button-active");
  enableShowNotesButton();
  updateScoresTable();
}

//Record the team's answer as incorrect and throw it over to the other team
function recordAnswerAsIncorrect(sourceElement, teamNumber) {
  if (!sourceElement.classList.contains("control-button-active")) {
    return
  }
  document.getElementsByClassName("correct-button")[teamNumber-1].classList.remove("control-button-active");
  document.getElementsByClassName("incorrect-button")[teamNumber-1].classList.remove("control-button-active");
  if (pointsType == "normal") {
    pointsType = "steal";
    pointsAvailable = 1;
    updatePointsAvailable();
    switch (teamNumber) {
      case 1:
        //Allow team 2 to steal point
        teamButtonIndex = 1;
        break;
      case 2:
        teamButtonIndex = 0;
        break;
    }
    clueCells = document.querySelectorAll(".game-clue-cell");
    for (let i = 0; i < clueCells.length; i++) {
      clueCell = clueCells[i];
      clueCell.classList.add("game-clue-cell-revealed");
    }
    document.getElementsByClassName("correct-button")[teamButtonIndex].classList.add("control-button-active");
    document.getElementsByClassName("incorrect-button")[teamButtonIndex].classList.add("control-button-active");
    updateScoresTable();
    postMessageToDisplay({"message":"attemptingSteal", "team":teamButtonIndex+1});
  } else {
    document.getElementById("reveal-button").classList.add("control-button-active");
    enableShowNotesButton();
  }
}

//Enables the 'show notes' button if notes are available
function enableShowNotesButton() {
  var needed = false;
  for (let i = 0; i < activeQuestion.clues.length; i++) {
    note = activeQuestion.clues[i].r;
    if (note !== "") {
      needed = true;
    }
  }
  if (needed) {
    document.getElementById("notes-button").classList.add("control-button-active");
  }
}

//Shows explanatory notes saved with the clues - useful for images
function showNotes(sourceElement) {
  if (!sourceElement.classList.contains("control-button-active")) {
    return
  }
  sourceElement.classList.remove("control-button-active");
  clueCells = document.querySelectorAll(".game-clue-cell");
  for (let i = 0; i < clueCells.length; i++) {
    clueCell = clueCells[i];
    note = activeQuestion.clues[i].r;
    if (note !== "") {
      clueCell.innerHTML = `<p class='game-clue-cell-note'>${note}</p>`;
    }
  }
  postMessageToDisplay({"message":"showNotes"});
}

//Reveals all clues and the connection
function revealAnswer(sourceElement) {
  if (!sourceElement.classList.contains("control-button-active")) {
    return
  }
  sourceElement.classList.remove("control-button-active");
  if (activeRoundNumber == 1 || activeRoundNumber == 2) {
    clueCells = document.querySelectorAll(".game-clue-cell");
    for (let i = 0; i < clueCells.length; i++) {
      clueCell = clueCells[i];
      clueCell.classList.add("game-clue-cell-revealed");
    }
    document.getElementById("game-connection-cell").classList.add("connection-revealed");
    document.getElementById("next-question-button").classList.add("control-button-active");
  }
  postMessageToDisplay({"message":"revealConnection"});
}

//Change a team name
/*function changeTeamName(teamNumber) {
  newName = prompt(`Enter a new name for team ${teamNames[teamNumber-1]}:`);
  if (newName !== "") {
    teamNames[teamNumber-1] = newName;
    updateTeamNames();
  }
}*/
function changeTeamName(sourceElement) {
  sourceElement.contentEditable = true;
  sourceElement.focus();
}
function processTeamNameChange(sourceElement, teamNumber) {
  newName = sourceElement.innerHTML;
  sourceElement.contentEditable = false;
  if (!newName.match(/[^\w\s.&,!?@:]/g) && !teamNames.includes(newName) && newName!=="") {
    teamNames[teamNumber-1] = newName;
    postMessageToDisplay({"message":"teamNameChange"});
  }
  updateTeamNames();
}

//Update the team names table
function updateTeamNames() {
  nameCells = document.querySelectorAll(".team-name-cell");
  for (let i = 0; i < nameCells.length; i++) {
    nameCell = nameCells[i];
    nameCell.innerHTML = teamNames[i];
  }
}

//Update the scores table
function updateScoresTable() {
  scoreCells = document.getElementsByClassName("team-points-cell");
  for (let i = 0; i < scores.length; i++) {
    scoreToShow = scores[i];
    scoreCell = scoreCells[i];
    if (scoreToShow == 1) {
      pointsWord = "point";
    } else {
      pointsWord = "points";
    }
    scoreCell.innerHTML = String(scoreToShow)+" "+pointsWord;
  }
}

//Clear the buttons and allow the controller to select the next hieroglyph
//Skip delete for the first question
function preloadNextQuestion(sourceElement, skipDelete=false) {
  if (!sourceElement.classList.contains("control-button-active")) {
    return
  }
  if (activeRoundNumber == 1 || activeRoundNumber == 2) {
    //Connections or sequences round
    //Set previously active hieroglyphs to disabled mode
    activeHieroglyph = null;
    alreadyActiveButtons = document.querySelectorAll(".active-hieroglyph-button");
    if (alreadyActiveButtons.length > 0) {
      for (let i = 0; i < alreadyActiveButtons.length; i++) {
        button = alreadyActiveButtons[i];
        button.classList.remove("active-hieroglyph-button");
        button.classList.add("disabled-hieroglyph-button");
      }
    }
    updateHieroglyphList();
    if (!skipDelete && activeQuestion !== null) { //If the active question isn't set, don't delete the first (assume new round)
      const indexToRemove = activeRound.indexOf(activeQuestion);
      if (indexToRemove > -1) {
        activeRound.splice(indexToRemove, 1);
      }
    }
    if (activeRound.length == 0) {
      loadNewRound();
    }
    if (activeRoundNumber == 1 || activeRoundNumber == 2) {
      postMessageToDisplay({"message":"showHieroglyphSelect"});
    }
    //game table
    document.getElementById("game-timer-cell").innerHTML = "Select hieroglyph";
    document.getElementById("game-points-cell").innerHTML = "Waiting for host";
  }
  switchActiveTeam();
  //Reset the buttons
  //clue cells
  clueCells = document.querySelectorAll(".game-clue-cell");
  for (let i = 0; i < clueCells.length; i++) {
    clueCell = clueCells[i];
    clueCell.classList.remove("game-clue-cell-revealed");
    clueCell.innerHTML = "";
    clueCell.classList.remove("game-clue-cell-image");
    clueCell.style.backgroundImage = "";
  }
  document.getElementById("game-connection-cell").innerHTML = "Idle";
  document.getElementById("game-connection-cell").classList.remove("connection-revealed");
  document.querySelectorAll(".control-button").forEach(function(button) {
    button.classList.remove("control-button-active");
  });
  pointsType = "normal";
  //document.getElementB"yId("next-question-button").classList.add("control-button-active"); //TESTING
  postMessageToDisplay({"message":"hideQuestionsRound1or2"});
}

//Select and display the active team
function switchActiveTeam() {
  switch (activeTeam) {
    case 1:
      activeTeam = 2;
      teamCells = document.querySelectorAll(".team-name-cell, .team-points-cell");
      teamCells[0].classList.remove("team-cell-active");
      teamCells[2].classList.remove("team-cell-active");
      teamCells[1].classList.add("team-cell-active");
      teamCells[3].classList.add("team-cell-active");
      break;
    case 2:
    default:
      activeTeam = 1;
      teamCells = document.querySelectorAll(".team-name-cell, .team-points-cell");
      teamCells[1].classList.remove("team-cell-active");
      teamCells[3].classList.remove("team-cell-active");
      teamCells[0].classList.add("team-cell-active");
      teamCells[2].classList.add("team-cell-active");
      break;
  }
}

//Load a random question from the round
function loadNextQuestion() {
  if (activeRoundNumber == 1 || activeRoundNumber == 2) {
    activeQuestion = activeRound[activeRound.length * Math.random() | 0]; //https://stackoverflow.com/questions/5915096/get-random-item-from-javascript-array
    document.getElementById("game-connection-cell").innerHTML = activeQuestion.link;
    //clue cells
    cluesList = activeQuestion.clues;
    clueCells = document.querySelectorAll(".game-clue-cell");
    for (let i = 0; i < clueCells.length; i++) {
      clueCell = clueCells[i];
      clue = cluesList[i];
      if (clue.t == "t") {
        //Text question
        clueCell.innerHTML = clue.c;
      } else if (clue.t == "i") {
        //Image question
        clueCell.classList.add("game-clue-cell-image");
        clueCell.style.backgroundImage = `url(${clue.c})`;
      }  
    } 
    if (activeRoundNumber == 1) {
      postMessageToDisplay({"message":"loadNewQuestionRound1", "question":activeQuestion});
    } else if (activeRoundNumber == 2) {
      postMessageToDisplay({"message":"loadNewQuestionRound2", "question":activeQuestion});
    }
  }
}

//Select a hieroglyph to play - this loads a new question
function selectHieroglyph(sourceElement) {
  if (activeHieroglyph === null) {
    //Activate the current button
    sourceElement.classList.add("active-hieroglyph-button");
    glyph = sourceElement.innerHTML;
    allButtons = sourceElement.parentElement.querySelectorAll(".hieroglyph-button");
    for (let i = 0; i < allButtons.length; i++) {
      button = allButtons[i];
      if (button.innerHTML == glyph) {
        activeHieroglyph = i;
      }
    }
    updateHieroglyphList();
    loadNextQuestion();
  }
}

function updateHieroglyphList() {
  allButtons = document.querySelectorAll(".hieroglyph-button");
  hieroglyphList = [{"name":"two-reeds", "status":"normal"},{"name":"lion", "status":"normal"},{"name":"twisted-flax", "status":"normal"},{"name":"horned-viper", "status":"normal"},{"name":"water", "status":"normal"},{"name":"eye", "status":"normal"}];
  counter = 0;
  allButtons.forEach(function(button) {
    if (button.classList.contains("active-hieroglyph-button")) {
      hieroglyphList[counter].status = "active";
    } else if (button.classList.contains("disabled-hieroglyph-button")) {
      hieroglyphList[counter].status = "disabled";
    }
    counter += 1;
  });
  //localStorage.setItem("OCL-hieroglyph-list", JSON.stringify(hieroglyphList));
  postMessageToDisplay({"message":"hieroglyphUpdate", "list":hieroglyphList});
}

//Update the points available counter
function updatePointsAvailable() {
  if (pointsAvailable == 1) {
    plural = "point";
  } else {
    plural = "points";
  }
  document.getElementById("game-points-cell").innerHTML = `<strong>${pointsAvailable} ${plural}</strong> available`;
}

//Reveal a clue
function revealClue(sourceElement, clueNumber) {
  allRevealedClues = document.querySelectorAll(".game-clue-cell-revealed");
  expectedClueNumber = allRevealedClues.length+1;
  if (expectedClueNumber != clueNumber) {
    return false
  }
  if (clueNumber == 4 && activeRoundNumber == 2) {
    alert("Cannot reveal clue\nIt's the answer to this sequence!");
    return false
  }
  sourceElement.classList.add("game-clue-cell-revealed");
  if (sourceElement.classList.contains("game-clue-cell-image")) {
    sourceElement.innerHTML = "REVEALED";
  }
  switch (clueNumber) {
    case 1:
      pointsAvailable = 5;
      pointsType = "normal";
      startTimer();
      break;
    case 2:
      pointsAvailable = 3;
      break;
    case 3:
      pointsAvailable = 2;
      break;
    case 4:
      pointsAvailable = 1;
      break;
  }
  updatePointsAvailable();
  //Show the buttons for this round
  document.getElementsByClassName("attempt-solve-button")[activeTeam-1].classList.add("control-button-active"); 
  document.getElementById("reset-timer-button").classList.add("control-button-active"); 
  postMessageToDisplay({"message":"revealClue", "number":clueNumber});
}

//Show a full page error message
function showFullPageErrorMessage(title, subtitle, tinytitle="") {
  document.getElementById("full-page-alert-title").innerHTML = title;
  document.getElementById("full-page-alert-subtitle").innerHTML = subtitle;
  document.getElementById("full-page-alert-tinytitle").innerHTML = tinytitle;
  document.getElementById("full-page-alert").style.display = "block";
}
function hideFullPageErrorMessage() {
  document.getElementById("full-page-alert").style.display = "none";
}

//Sending and receiving messages
function postMessageToDisplay(message) {
  if (targetOrigin == null) {
    if (window.location.origin == "file://") {
      console.warn("Caution: messages between windows are insecure (running as local file)")
      targetOrigin = "*";
    } else {
      targetOrigin = window.location.href;
    }
  }
  displayWindow.postMessage(message, targetOrigin);
}
window.addEventListener("message", receiveMessage, false);
function receiveMessage(event) {
  console.log(event);
  if (event.data.message == "displayLoaded") {
    hideFullPageErrorMessage();
    initialiseGame();
  }
  if (event.data.message == "displayClosed") {
    showFullPageErrorMessage("Contestant screen closed", "The contestant screen has been closed<br>Click <a href='javascript:loadDisplayWindow()'>here</a> to reopen it", "<span onclick='hideFullPageErrorMessage()'>Dismiss</span>")
  }
}

function loadDisplayWindow() {
  displayWindow = window.open("display.html",'targetWindow',
  `toolbar=no,
  location=no,
  status=no,
  menubar=no,
  scrollbars=no,
  resizable=yes,
  width=${screen.width},
  height=${screen.height},
  left=0,
  top=0`);
  if (displayWindow === null || displayWindow.closed) {
    showFullPageErrorMessage("Failed to load contestant screen", "It looks like you might have popups blocked<br>Please enable popups, then reload the page to start");
    return false
  } else {
    //Bring focus back to main window
    window.open().close();
    return true
  }
}

function initialiseGame() {
  if (!loadQuestionFileLocalStorage()) {
    alert("Error: question file not found in local storage. Please go to the scheduler and save a game schedule")
  }
  switchActiveTeam();
  updateTeamNames();
}

//Page load
function pageLoadInit() {
  loadDisplayWindow();
}


//window size = 530x620 pixels