var selectedWindow = "home"; //home, round1, round2, round3, round4, settings
var tabOptions = {
  "home":{"title":"Home", "tab":"scheduler-home-tab"},
  "round1":{"title":"Connections", "tab":"scheduler-round-1-tab"},
  "round2":{"title":"Sequences", "tab":"scheduler-round-2-tab"},
  "round3":{"title":"Connecting wall", "tab":"scheduler-round-3-tab"},
  "round4":{"title":"Missing vowels", "tab":"scheduler-round-4-tab"},
  "settings":{"title":"Settings", "tab":""}
}
var gameSchedule = {
  "round1":[],
  "round2":[],
  "round3":[],
  "round4":[]
}
var roundTemplates = {
  "round1":{},
  "round2":{},
  "round3":{},
  "round4":{"cat":"", "list": [{"q":"", "a":""}, {"q":"", "a":""}, {"q":"", "a":""}, {"q":"", "a":""}]}
}
var unsavedChangesTimer = 0;

//https://codingwithspike.wordpress.com/2018/03/10/making-settimeout-an-async-await-function/
async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function alertUnsavedChanges() {
  var now = new Date().getTime();
  if (unsavedChangesTimer == 0) {
    unsavedChangesTimer = now;
  } else if (now - unsavedChangesTimer > 30000) {
    document.getElementById("toolbar-save-button").classList.add("save-button-colour-pulse");
  }
}

async function saveScheduleToLocalStorage(confirmSave=true) {
  if (!generateMissingVowelsSchedule() || !generateRound1Schedule() || !generateRound2Schedule()) { // add other schedule generators here - use ||
    return false
  }
  cachedVersion = localStorage.getItem("only-connect-schedule-cached");
  newVersion = JSON.stringify(gameSchedule);
  saveButtonIcon = document.getElementById("toolbar-save-button-icon");
  saveButtonIcon.setAttribute("class", "");
  saveButtonIcon.setAttribute("class", "fas fa-sync fa-spin");
  if (cachedVersion !== null && cachedVersion != newVersion && confirmSave) {
    if (!confirm("There is an older schedule saved in local storage\nContinue saving and overwrite the older version?")) {
      saveButtonIcon.setAttribute("class", "");
      saveButtonIcon.setAttribute("class", "fas fa-times");
      await wait(1500);
      saveButtonIcon.setAttribute("class", "");
      saveButtonIcon.setAttribute("class", "far fa-save");
      return false
    }
    //If accepted, continue
  }
  newVersion = JSON.stringify(gameSchedule);
  localStorage.setItem("only-connect-schedule-cached", newVersion);
  /*if (confirmSave) {
    alert("Schedule saved successfully");
  }*/
  document.getElementById("toolbar-save-button").classList.remove("save-button-colour-pulse");
  unsavedChangesTimer = new Date().getTime();
  await wait(700);
  saveButtonIcon.setAttribute("class", "");
  saveButtonIcon.setAttribute("class", "fas fa-check");
  await wait(1500);
  saveButtonIcon.setAttribute("class", "");
  saveButtonIcon.setAttribute("class", "far fa-save");
}

function fetchScheduleFromLocalStorage() {
  //fetch the cached version of the schedule from LS and apply it
  cachedVersion = localStorage.getItem("only-connect-schedule-cached");
  if (cachedVersion === null) {
    alert("Unable to load from memory\n(No cached schedule could be found)");
  } else {
    try {
      parsedSchedule = JSON.parse(cachedVersion);
      roundNumbers = [parsedSchedule.round1.length, parsedSchedule.round2.length, parsedSchedule.round3.length, parsedSchedule.round4.length];
      if (confirm("Overwrite current schedule with cached version?\n\nThe version found in memory is as follows:\n"+String(roundNumbers[0])+" connections rounds\n"+String(roundNumbers[1])+" sequences rounds\n"+String(roundNumbers[2]/2)+" connecting walls\n"+String(roundNumbers[3])+" missing vowels categories\n\nContinue and restore saved version?")) {
        gameSchedule = parsedSchedule;
        //switchTab("home");
        reloadTabs();
        //loadMissingVowelsSchedule();
        //alert("Saved schedule loaded successfully");
      } else {
        alert("Operation cancelled");
      }
    }
    catch (err) {
      console.error("Unable to fetch schedule from memory: "+err);
      alert("Unable to load from memory\n(A schedule was found, but it could not be loaded correctly)");
    }
  }
}

function exportSchedule() {
  var scheduleRaw = JSON.stringify(gameSchedule);
  var data = new Blob([scheduleRaw], {type: 'application/json'});
  var url = window.URL.createObjectURL(data);
  var downloadButton = document.getElementById('export-download-link');
  var d = new Date();
  var ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
  var mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
  var da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
  var hour = new Intl.DateTimeFormat('en', { hour: '2-digit' }).format(d).substring(0,2);
  var min = new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(d);
  var dateString = `${da}${mo}${ye}-${hour}${min}`;
  downloadButton.href = url;
  downloadButton.download = "onlyconnectschedule"+dateString+".json";
  downloadButton.click();
}

function promptFileUpload() {
  var uploadButton = document.getElementById('upload-link');
  uploadButton.addEventListener("change", processUploadedFile, false);
  uploadButton.click();
}

async function processUploadedFile(event) {
  sourceElement = event.srcElement;
  rawSchedule = await sourceElement.files[0].text();
  previousSchedule = gameSchedule;
  if (confirm("Apply the uploaded file and overwrite the current schedule?")) {
    try {
      parsedSchedule = JSON.parse(rawSchedule);
      gameSchedule = parsedSchedule;
      //switchTab("home");
      reloadTabs();
      //alert("Uploaded schedule loaded successfully");
    }
    catch (err) {
      console.error("Failed to apply uploaded schedule: "+err);
      gameSchedule = previousSchedule;
      //switchTab("home");
      reloadTabs();
      alert("An error occurred while processing the uploaded file. The previous schedule has been restored.");
    }
  }
}

function addRoundToSchedule(roundNumber) {
  //used to add an additional round, e.g. a second connecting wall
  roundRef = "round"+String(roundNumber);
  template = roundTemplates[roundRef];
  gameSchedule[roundRef].push(template);
}

//Obsolete
/*function addMissingVowelsCategory() {
  if ('content' in document.createElement("template")) {
    //clone the template
    var template = document.getElementById("round-4-input-window-template");
    var insertionParent = document.getElementById("scheduler-round-4-tab");
    var clone = template.content.cloneNode(true);
    //label and id the clone
    var td = clone.querySelectorAll("td");
    var inputBlockEl = clone.querySelectorAll(".scheduler-input-window")[0];
    var tableID = insertionParent.children.length-1;
    //insert the clone
    insertionParent.appendChild(clone);
  } else {
    alert("Browser not supported\nSorry, this browser doesn't seem to meet the minimum requirements to run this application");
  }
}*/

function addNewSubRound(round) {
  if ('content' in document.createElement("template")) {
    roundNumber = String(round);
    //clone the template
    var template = document.getElementById(`round-${roundNumber}-input-window-template`);
    var insertionParent = document.getElementById(`scheduler-round-${roundNumber}-tab`);
    var clone = template.content.cloneNode(true);
    //label and id the clone
    var td = clone.querySelectorAll("td");
    var inputBlockEl = clone.querySelectorAll(".scheduler-input-window")[0];
    var tableID = insertionParent.children.length-1;
    /*inputBlockEl.id = "round-4-input-table-"+String(tableID);
    var idCounter = 0;
    td.forEach(function(cloneRow) {
      idCounter += 1;
      cloneRow.id = "round-4-input-row-"+String(tableID)+"-"+String(idCounter);
    });*/
    //insert the clone
    insertionParent.appendChild(clone);
  } else {
    alert("Browser not supported\nSorry, this browser doesn't seem to meet the minimum requirements to run this application");
  }
}

function removeAllSubRounds(round, checkFirst=true) {
  //provide the round number as an integer (1, 2, 3 or 4)
  roundNumber = String(round);
  /*var parentWindow = document.getElementById(`scheduler-round-${roundNumber}-tab`);
  if (parentWindow.children.length <= 2) {
    //nothing to delete
    return
  }
  if (checkFirst != false) {
    if (!confirm("Are you sure you want to delete all "+String(parentWindow.children.length-2)+" categories within this round?\nThis action cannot be undone")) {
      return
    }
  }
  while (parentWindow.children.length > 2) {
    parentWindow.removeChild(parentWindow.lastChild);
  }*/
  inputWindows = document.getElementById(`scheduler-round-${roundNumber}-tab`).querySelectorAll(".scheduler-input-window");
  if (inputWindows.length == 0) {
    //nothing to delete
    return
  }
  if (checkFirst != false) {
    if (!confirm("Are you sure you want to delete all "+String(inputWindows.length)+" subrounds/categories within this round?\nThis action cannot be undone")) {
      return
    }
  }
  counter = 0;
  while (counter < inputWindows.length) {
    inputWindows[counter].remove();
    counter += 1;
  }
}

function removeSubRound(sourceElement, checkFirst=true) {
  parentElement = sourceElement.parentElement;
  categoryName = parentElement.querySelector(".input-window-title > [contenteditable]");
  if (categoryName === null) {
    categoryNameEmbedded = "this subround";
  } else if (categoryName.textContent == "") {
    categoryNameEmbedded = `this category`;
  } else {
    categoryNameEmbedded = `the category "${categoryName.textContent}"`;
  }
  if (checkFirst != false) {
    if (!confirm(`Are you sure you want to delete ${categoryNameEmbedded}?\nThis action cannot be undone`)) {
      return
    }
  }
  parentElement.remove();
}

function reloadTabs() {
  //useful after a new file is uploaded or fetched from memory
  loadRound1Schedule();
  loadRound2Schedule();
  loadMissingVowelsSchedule();
}

function switchTab(tab) {
  //change the title and switch the screen to the given tab
  var tabOptionsObj = tabOptions[tab];
  //hide all screens
  var allScreenObjects = Object.keys(tabOptions);
  //allScreenObjects.forEach(screen => if (screen.tab !== "") {document.getElementById(screen.tab).style.display = "none"});
  allScreenObjects.forEach(function(screenID) {
    screen = tabOptions[screenID];
    if (screen.tab !== "") {
      document.getElementById(screen.tab).style.display = "none";
    }
  });
  if (tabOptionsObj !== undefined) {
    document.getElementById("top-toolbar-title").textContent = tabOptionsObj.title;
    if (tabOptionsObj.tab !== "") {
      document.getElementById(tabOptionsObj.tab).style.display = "block";
    }
  }
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//https://stackoverflow.com/questions/4313841/insert-a-string-at-a-specific-index
String.prototype.insert = function(index, string) {
  if (index > 0) {
    return this.substring(0, index) + string + this.substring(index, this.length);
  }
  return string + this;
};
//https://stackoverflow.com/questions/9050345/selecting-last-element-in-javascript-array
if (!Array.prototype.last){
  Array.prototype.last = function(){
      return this[this.length - 1];
  };
} else {
  console.warn("Array.last() is already defined");
}

function processMissingVowelsEdit(eventElement) {
  //fired after the answer box of a missing vowels round is edited (onblur)
  vowelsRemoved = eventElement.textContent.replace(/[^B-DF-HJ-NP-TV-Z\(\)\'\,\?\!\.0-9]/ig, "").toUpperCase();
  questionLength = vowelsRemoved.length;
  questionWithSpaces = vowelsRemoved;
  if (questionLength > 4) {
    /*lowerBound = Math.floor((questionLength/4));
    higherBound = Math.ceil((questionLength/2.5));*/
    lowerBound = 2;
    higherBound = 4;
    stringCursor = 0;
    while (stringCursor < questionWithSpaces.length) {
      stringCursor += randomInteger(lowerBound, higherBound);
      questionWithSpaces = questionWithSpaces.insert(stringCursor, " ");
      stringCursor += 1;
    }
  }
  eventElement.parentElement.children[1].textContent = questionWithSpaces;
  alertUnsavedChanges();
}

function checkMissingVowelsCustomEdit(eventElement) {
  //used to check that any edits to the question match the original answer
  originalAnswer = eventElement.parentElement.children[0].textContent;
  newQuestion = eventElement.textContent;
  answerVowelsSpacesRemoved = originalAnswer.replace(/[^B-DF-HJ-NP-TV-Z\(\)\'\,\?\!\.0-9]/ig, "").toUpperCase();
  questionVowelsSpacesRemoved = newQuestion.replace(/[^B-DF-HJ-NP-TV-Z\(\)\'\,\?\!\.0-9]/ig, "").toUpperCase();
  questionVowelsRemoved = newQuestion.replace(/[^B-DF-HJ-NP-TV-Z\(\)\'\,\?\!\.0-9\s]/ig, "").toUpperCase();
  if (answerVowelsSpacesRemoved != questionVowelsSpacesRemoved || questionVowelsRemoved != newQuestion || newQuestion === "") {
    alert("Warning: question no longer matches answer\nThe question has been recalculated");
    processMissingVowelsEdit(eventElement.parentElement.children[0]);
  }
  alertUnsavedChanges();
}

function autoSaveRound1or2(sourceElement) {
  alertUnsavedChanges();
  sourceElement.parentElement.parentElement.parentElement.parentElement.querySelector(".scroll-button-active").click(); //Simulate a click on its own button
}

function makePuzzleNumberActive(roundNumber, puzzleNumber, sourceElement, skipSave=false) {
  //save the current puzzle
  activeButton = sourceElement.parentElement.querySelector(".input-window-scroll-button.scroll-button-active");
  activeButtonNumber = activeButton.textContent;
  if (skipSave) {
    completeFlag = true;
  } else {
    completeFlag = saveActivePuzzle(activeButtonNumber, sourceElement);
  }
  activeButton.classList.remove("scroll-button-complete");
  //activeButton.classList.remove("scroll-button-error");
  if (completeFlag) {
    activeButton.classList.add("scroll-button-complete");
    //activeButton.classList.remove("scroll-button-error");
  } else {
    activeButton.classList.remove("scroll-button-complete");
    //activeButton.classList.add("scroll-button-error");
  }
  //set the active button
  otherButtons = sourceElement.parentElement.querySelectorAll(".input-window-scroll-button");
  otherButtons.forEach(function(button) {
    if (button.textContent != sourceElement.textContent) {
      button.classList.remove("scroll-button-active");
    }
  })
  sourceElement.classList.add("scroll-button-active");
  //sourceElement.classList.remove("scroll-button-complete");
  //sourceElement.classList.remove("scroll-button-error");
  //reset and reload the input fields
  puzzleStore = JSON.parse(sourceElement.parentElement.querySelector("input.temporary-puzzle-store").value);
  puzzleToLoad = puzzleStore[puzzleNumber-1];
  sourceElement.parentElement.querySelector("th[contenteditable]").innerHTML = puzzleToLoad.link;
  clueCells = sourceElement.parentElement.querySelectorAll("td[contenteditable]");
  clueTypeCells = sourceElement.parentElement.querySelectorAll(".input-window-type-select");
  for(let i = 0; i < clueCells.length; i+=2) {
    clueCells[i].innerHTML = puzzleToLoad.clues[i/2].c;
    clueCells[i+1].innerHTML = puzzleToLoad.clues[i/2].r;
    switch (puzzleToLoad.clues[i/2].t) {
      case "i":
        clueTypeCells[i/2].innerHTML = "Image";
        break;
      case "t":
      default:
        clueTypeCells[i/2].innerHTML = "Text";
        break;
    }
  }
}

function saveActivePuzzle(subRoundNumber, sourceElement) {
  roundNumberIndex = parseInt(subRoundNumber)-1;
  emptyPuzzleObj = {"link":"", "clues":[{"t":"", "c":"", "r":""},{"t":"", "c":"", "r":""},{"t":"", "c":"", "r":""},{"t":"", "c":"", "r":""}]}; //t = type (t for text, i for image), c for the clue text, r for the reveal text (optional)
  //save the puzzle currently being edited before moving to another button
  //get the required elements
  connectionText = sourceElement.parentElement.querySelector("th[contenteditable]").innerHTML;
  clueCells = sourceElement.parentElement.querySelectorAll("td[contenteditable]");
  clueTypeCells = sourceElement.parentElement.querySelectorAll(".input-window-type-select");
  puzzleStoreField = sourceElement.parentElement.querySelector("input.temporary-puzzle-store");
  //process the previous puzzle object
  previousAllPuzzles = JSON.parse(puzzleStoreField.value);
  if (Object.keys(previousAllPuzzles).length == 0) {
    //an empty object, so create the basic JSON object
    emptyPuzzleClone = JSON.parse(JSON.stringify(emptyPuzzleObj));
    previousAllPuzzles = Array(6).fill(emptyPuzzleClone);
  }
  completeFlag = true;
  newPuzzle = emptyPuzzleObj;
  newPuzzle.link = connectionText;
  if (connectionText == "") {
    completeFlag = false;
  }
  for(let i = 0; i < clueCells.length; i+=2) {
    clueText = clueCells[i].innerHTML;
    newPuzzle.clues[i/2].c = clueText;
    if (clueText == "") {
      completeFlag = false;
    }
    revealText = clueCells[i+1].innerHTML;
    newPuzzle.clues[i/2].r = revealText;
    typeText = clueTypeCells[i/2].innerHTML;
    if (typeText == "Image") {
      newPuzzle.clues[i/2].t = "i";
    } else if (typeText == "Text") {
      newPuzzle.clues[i/2].t = "t";
    } else {
      newPuzzle.clues[i/2].t = "t";
      completeFlag = false;
    }
  }
  previousAllPuzzles[roundNumberIndex] = newPuzzle;
  puzzleStoreField.value = JSON.stringify(previousAllPuzzles);
  return completeFlag //true means no issues found so mark button green, false means an empty field so mark it red
}

function switchClueType(sourceElement) {
  switch(sourceElement.innerHTML) {
    case "Text":
      sourceElement.innerHTML = "Image";
      break;
    case "Image":
      sourceElement.innerHTML = "Text";
      break;
  }
  autoSaveRound1or2(sourceElement);
  alertUnsavedChanges();
}

function generateRound1Schedule() {
  inputWindows = document.getElementById("scheduler-round-1-tab").querySelectorAll(".scheduler-input-window");
  round1Schedule = [];
  for(let i = 0; i < inputWindows.length; i++) {
    inputWindow = inputWindows[i];
    hiddenDataField = inputWindow.querySelector("input.temporary-puzzle-store");
    subRoundSchedule = JSON.parse(hiddenDataField.value);
    //could do with a validation mechanism here - return false if an error is found
    round1Schedule.push(subRoundSchedule);
  }
  gameSchedule.round1 = round1Schedule;
  return round1Schedule
}

function loadRound1Schedule() {
  removeAllSubRounds(1, false);
  round1Schedule = gameSchedule.round1;
  for(let i = 0; i < round1Schedule.length; i++) {
    subRoundSchedule = round1Schedule[i];
    addNewSubRound(1);
    inputWindows = document.getElementById("scheduler-round-1-tab").querySelectorAll(".scheduler-input-window");
    inputWindow = inputWindows[inputWindows.length - 1];
    hiddenDataField = inputWindow.querySelector("input.temporary-puzzle-store");
    hiddenDataField.value = JSON.stringify(subRoundSchedule);
    firstButton = inputWindow.querySelectorAll(".input-window-scroll-button")[5]; //Click the first button to load the schedule for that subround
    makePuzzleNumberActive(1, 1, firstButton, true);
  }
}

function generateRound2Schedule() {
  inputWindows = document.getElementById("scheduler-round-2-tab").querySelectorAll(".scheduler-input-window");
  round2Schedule = [];
  for(let i = 0; i < inputWindows.length; i++) {
    inputWindow = inputWindows[i];
    hiddenDataField = inputWindow.querySelector("input.temporary-puzzle-store");
    subRoundSchedule = JSON.parse(hiddenDataField.value);
    //could do with a validation mechanism here - return false if an error is found
    round2Schedule.push(subRoundSchedule);
  }
  gameSchedule.round2 = round2Schedule;
  return round2Schedule
}

function loadRound2Schedule() {
  removeAllSubRounds(2, false);
  round2Schedule = gameSchedule.round2;
  for(let i = 0; i < round2Schedule.length; i++) {
    subRoundSchedule = round2Schedule[i];
    addNewSubRound(2);
    inputWindows = document.getElementById("scheduler-round-2-tab").querySelectorAll(".scheduler-input-window");
    inputWindow = inputWindows[inputWindows.length - 1];
    hiddenDataField = inputWindow.querySelector("input.temporary-puzzle-store");
    hiddenDataField.value = JSON.stringify(subRoundSchedule);
    firstButton = inputWindow.querySelectorAll(".input-window-scroll-button")[5]; //Click the first button to load the schedule for that subround
    makePuzzleNumberActive(2, 1, firstButton, true);
  }
}

function generateMissingVowelsSchedule() {
  inputWindows = document.getElementById("scheduler-round-4-tab").querySelectorAll(".scheduler-input-window");
  missingVowelsSchedule = [];
  for(let i = 0; i < inputWindows.length; i++) {
    inputWindow = inputWindows[i];
    categoryTitle = inputWindow.querySelector(".input-window-title [contenteditable]").textContent;
    if (categoryTitle === "") {
      alert("Error saving schedule (missing vowels round):\nOne or more categories does not have a title");
      return false
    }
    categorySchedule = {"cat":categoryTitle, "list":[]};
    missingVowelsSchedule.push(categorySchedule);
    dataCells = inputWindow.querySelectorAll("td");
    for(let j = 0; j < dataCells.length; j+=2) {
      answerText = dataCells[j].textContent;
      questionText = dataCells[j+1].textContent;
      if (answerText === "" || questionText === "") {
        alert("Error saving schedule (missing vowels round):\nA question/answer is missing");
        return false
      }
      questionObj = {"q":questionText, "a":answerText};
      categorySchedule.list.push(questionObj);
    }
  }
  gameSchedule.round4 = missingVowelsSchedule;
  return missingVowelsSchedule
}

function loadMissingVowelsSchedule() {
  removeAllSubRounds(4, false);
  missingVowelsSchedule = gameSchedule.round4;
  for(let i = 0; i < missingVowelsSchedule.length; i++) {
    categorySchedule = missingVowelsSchedule[i];
    addNewSubRound(4);
    inputWindows = document.getElementById("scheduler-round-4-tab").querySelectorAll(".scheduler-input-window");
    inputWindow = inputWindows[inputWindows.length - 1];
    inputWindow.querySelector(".input-window-title [contenteditable]").textContent = categorySchedule.cat;
    dataCells = inputWindow.querySelectorAll("td");
    for(let j = 0; j < dataCells.length; j+=2) {
      dataCells[j].textContent = categorySchedule.list[j/2].a;
      dataCells[j+1].textContent = categorySchedule.list[j/2].q;
    }
  }
}

/*function loadMissingVowelsFromText() {
  rawSchedule = prompt("Paste your missing vowels questions below (no categoires, answers only, newline between each)\nThis will erase the current missing vowels questions");
  importedSchedule = rawSchedule.split("\n");
  missingVowelsSchedule = [];
  for(let i = 0; i < importedSchedule.length; i++) {
    console.log("Not done yet!");
  }
}*/

//PAGE LOAD FUNCTIONS

window.addEventListener('beforeunload', function (e) {
  // Cancel the event
  e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
  // Chrome requires returnValue to be set
  e.returnValue = '';
});

function pageLoadInit() {
  selectedWindow = "home";
}