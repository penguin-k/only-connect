controllerWindow = window.opener;
targetOrigin = null;
activeQuestionNotes = [];
activeRoundNumber = 0;

//Update the hieroglyphs
function updateHieroglyphList(list=null) {
  if (list === null){
    hieroglyphList = JSON.parse(localStorage.getItem("OCL-hieroglyph-list")); 
  } else {
    hieroglyphList = list;
  }
  hieroglyphList.forEach(function(hitem) {
    hieroglyphButton = document.getElementById("hieroglyph-"+hitem.name).parentElement;
    status = hitem.status;
    if (status == "active") {
      hieroglyphButton.classList.add("hieroglyph-selected");
    } else {
      hieroglyphButton.classList.remove("hieroglyph-selected");
    }
    if (status == "disabled") {
      hieroglyphButton.classList.add("hieroglyph-complete");
    } else {
      hieroglyphButton.classList.remove("hieroglyph-complete");
    }
  });
}

function showHieroglyphSelect() {
  document.getElementById("hieroglyphs-selection").style.display = "block";
}
function hideHieroglyphSelect() {
  document.getElementById("hieroglyphs-selection").style.display = "none";
}

function showRound1Or2Boxes() {
  document.getElementById("clue-boxes").style.display = "block";
}
function hideRound1Or2Boxes() {
  resetTimerBars();
  resetClueBoxes();
  setTimeout(function(){ 
    document.getElementById("clue-boxes").style.display = "none";
  }, 300);
}

//Loads a new round 1 question into the display screen
function loadNewRound1Question(questionObj) {
  showRound1Or2Boxes();
  //Load the details of the next question
  cluesList = questionObj.clues;
  clueBoxesList = document.getElementsByClassName("clue-box");
  activeQuestionNotes = [];
  for (let i = 0; i < cluesList.length; i++) {
    if (cluesList[i].t == "t") {
      //Text question
      clueBoxesList[i].innerHTML = cluesList[i].c;
    } else if (cluesList[i].t == "i") {
      //Image question
      clueBoxesList[i].classList.add("clue-box-image");
      clueBoxesList[i].style.backgroundImage = `url(${cluesList[i].c})`;
    }
    activeQuestionNotes.push(cluesList[i].r);
  }
  document.getElementsByClassName("clue-box-connection")[0].innerHTML = questionObj.link;
}
//Loads a new round 2 question into the display screen
function loadNewRound2Question(questionObj) {
  showRound1Or2Boxes();
  //Load the details of the next question
  cluesList = questionObj.clues;
  clueBoxesList = document.getElementsByClassName("clue-box");
  activeQuestionNotes = [];
  for (let i = 0; i < cluesList.length; i++) {
    if (cluesList[i].t == "t") {
      //Text question
      clueBoxesList[i].innerHTML = cluesList[i].c;
    } else if (cluesList[i].t == "i") {
      //Image question
      clueBoxesList[i].classList.add("clue-box-image");
      clueBoxesList[i].style.backgroundImage = `url(${cluesList[i].c})`;
    }
    activeQuestionNotes.push(cluesList[i].r);
  }
  var questionMark = document.createElement("div");
  questionMark.id = "clue-box-question-mark";
  questionMark.innerHTML = "?";
  clueBoxesList[3].appendChild(questionMark);
  document.getElementsByClassName("clue-box-connection")[0].innerHTML = questionObj.link;
}

//Reveals the given clue
//Provide clue number 1-4
function revealClue(clueNumber) {
  var clueBoxesList = document.getElementsByClassName("clue-box");
  clueBoxesList[clueNumber-1].classList.add("clue-box-revealed");
  switchToTimerBar(clueNumber);
  if (activeRoundNumber == 2 && clueNumber == 3) {
    clueBoxesList[3].classList.add("clue-box-revealed");
  }
}

//Reveals all clues (not the answer)
function revealAllClues() {
  var clueBoxesList = document.getElementsByClassName("clue-box");
  for (let clueBox of clueBoxesList) {
    /*clueBox.style.opacity = "1";*/
    clueBox.classList.add("clue-box-revealed");
  }
}

//Reveals notes for all clues
function revealNotes() {
  var clueBoxesList = document.getElementsByClassName("clue-box");
  for (let i = 0; i < activeQuestionNotes.length; i++) {
    if (activeQuestionNotes[i] !== "") {
      //clueBoxesList[i].classList.add("clue-box-note");
      if (clueBoxesList[i].classList.contains("clue-box-image")) {
        var noteClass = "clue-box-note clue-box-note-image";
      } else {
        var noteClass = "clue-box-note";
      }
      clueBoxesList[i].innerHTML = `<p class="${noteClass}">${activeQuestionNotes[i]}</p>`;
    }
  }
}

//Reveals the connection (also hides the timer bar)
function revealConnection() {
  document.getElementsByClassName("clue-box-connection")[0].style.opacity = "1";
  if (activeRoundNumber == 2) {
    document.getElementById("clue-box-question-mark").remove();
  }
  resetTimerBars();
}

//Hides all round 1 and 2 clue boxes (inc. the connections box), and clears their text
function resetClueBoxes() {
  var allClueBoxes = document.getElementsByClassName("clue-box");
  for (let clueBox of allClueBoxes) {
    /*clueBox.style.opacity = "0";*/
    clueBox.innerHTML = "";
    clueBox.classList.remove("clue-box-image");
    clueBox.classList.remove("clue-box-revealed");
    clueBox.classList.remove("clue-box-note");
    clueBox.style.backgroundImage = "";
  }
  var allAnswerBoxes = document.getElementsByClassName("clue-box-connection");
  for (let answerBox of allAnswerBoxes) {
    answerBox.style.opacity = "0";
    answerBox.innerHTML = "";
  }
}

//Starts the round 1&2 timer bars counting down
function startTimerBars(timeInSeconds) {
  var allTimerBars = document.getElementsByClassName("clue-box-timer-bar");
  resetTimerBars();
  setTimeout(function(){ 
    for (let timerBar of allTimerBars) {
      //Set new style
      timerBar.style.transition = "width "+String(timeInSeconds)+"s linear";
      timerBar.style.width = "100%";
    }
  }, 100);
}

//Resets the timer bars to 0
function resetTimerBars() {
  var allTimerBars = document.getElementsByClassName("clue-box-timer-bar");
  for (let timerBar of allTimerBars) {
    //Remove old style
    timerBar.style.transition = "none";
    timerBar.style.width = "0px";
    timerBar.parentElement.style.opacity = "0";
  }
  //allTimerBars[0].parentElement.style.opacity = "1";
}

//Pauses the timer bars
function pauseTimerBars() {
  var allTimerBars = document.getElementsByClassName("clue-box-timer-bar");
  for (let timerBar of allTimerBars) {
    timerBar.style.width = String(timerBar.offsetWidth)+"px";
  }
}

//Hides all timer bars
function hideAllTimerBars() {
  var allTimerBars = document.getElementsByClassName("clue-box-timer-bar");
  for (let timerBar of allTimerBars) {
    timerBar.parentElement.style.opacity = "0";
  }
}

//Shows only the selected timer bar
//Pass index number 1-4
function switchToTimerBar(timeBarIndex) {
  var allTimerBars = document.getElementsByClassName("clue-box-timer-bar");
  hideAllTimerBars();
  allTimerBars[timeBarIndex-1].parentElement.style.opacity = "1";
}

//Sending and receiving messages
function postMessageToController(message) {
  if (targetOrigin == null) {
    if (window.location.origin == "file://") {
      console.warn("Caution: messages between windows are insecure (running as local file)")
      targetOrigin = "*";
    } else {
      targetOrigin = window.location.href;
    }
  }
  controllerWindow.postMessage(message, targetOrigin);
}

//Receiving messages from controller screen
window.addEventListener("message", receiveMessage, false);
function receiveMessage(event) {
  if (typeof event.data == "object") {
    messageText = event.data.message;
    console.log(messageText);
    switch (messageText) {
      case "newRound":
        activeRoundNumber = event.data.number;
        break;
      case "hieroglyphUpdate":
        showHieroglyphSelect();
        updateHieroglyphList(event.data.list);
        break;
      case "timerStarted":
        startTimerBars(event.data.seconds);
        break;
      case "loadNewQuestionRound1":
        loadNewRound1Question(event.data.question);
        break;
      case "loadNewQuestionRound2":
        loadNewRound2Question(event.data.question);
        break;
      case "revealClue":
        hideHieroglyphSelect();
        revealClue(event.data.number);
        break;
      case "hideQuestionsRound1or2":
        hideRound1Or2Boxes();
        break;
      case "showNotes":
        revealNotes();
        break;
      case "attemptingSolve":
        pauseTimerBars();
        break;
      case "attemptingSteal":
        revealAllClues();
        switchToTimerBar(4);
        break;
      case "revealConnection":
        revealAllClues();
        revealConnection();
        break;
      case "showHieroglyphSelect":
        showHieroglyphSelect();
        break;
      case "hideHieroglyphSelect":
        hideHieroglyphSelect();
        break;
    }
  }
}


//Alert controller if the display page is closed
window.addEventListener('beforeunload', (event) => {
  event.preventDefault();
  event.returnValue = '';
  postMessageToController({"message":"displayClosed"});
});

function pageLoadInit() {
  console.log("Page loaded");
  postMessageToController({"message":"displayLoaded"});
  hideRound1Or2Boxes();
  hideHieroglyphSelect();
}