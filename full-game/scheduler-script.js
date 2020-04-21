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

//https://codingwithspike.wordpress.com/2018/03/10/making-settimeout-an-async-await-function/
async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function saveScheduleToLocalStorage(confirmSave=true) {
  if (!generateMissingVowelsSchedule()) { // add other schedule generators here - use ||
    return false
  }
  cachedVersion = localStorage.getItem("only-connect-schedule-cached");
  newVersion = JSON.stringify(gameSchedule);
  saveButtonIcon = document.getElementById("toolbar-save-button-icon");
  saveButtonIcon.setAttribute("class", "");
  saveButtonIcon.setAttribute("class", "fas fa-sync fa-spin");
  if (cachedVersion !== null && cachedVersion != newVersion && confirmSave) {
    if (!confirm("There is an older schedule saved in local storage\nContinue saving and overwrite the older version?")) {
      alert("Operation cancelled");
      return false
    }
    //If accepted, continue
  }
  newVersion = JSON.stringify(gameSchedule);
  localStorage.setItem("only-connect-schedule-cached", newVersion);
  /*if (confirmSave) {
    alert("Schedule saved successfully");
  }*/
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

function addMissingVowelsCategory() {
  if ('content' in document.createElement("template")) {
    //clone the template
    var template = document.getElementById("round-4-input-window-template");
    var insertionParent = document.getElementById("scheduler-round-4-tab");
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
    if (!confirm("Are you sure you want to delete all "+String(inputWindows.length)+" categories within this round?\nThis action cannot be undone")) {
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
  categoryName = parentElement.querySelector(".input-window-title > [contenteditable]").innerText;
  if (categoryName == "") {
    categoryNameEmbedded = "this category";
  } else {
    categoryNameEmbedded = `the category "${categoryName}"`;
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
    document.getElementById("top-toolbar-title").innerText = tabOptionsObj.title;
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
  vowelsRemoved = eventElement.innerText.replace(/[^B-DF-HJ-NP-TV-Z\(\)\'\,\?\!\.0-9]/ig, "").toUpperCase();
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
  eventElement.parentElement.children[1].innerText = questionWithSpaces;
}

function checkMissingVowelsCustomEdit(eventElement) {
  //used to check that any edits to the question match the original answer
  originalAnswer = eventElement.parentElement.children[0].innerText;
  newQuestion = eventElement.innerText;
  answerVowelsSpacesRemoved = originalAnswer.replace(/[^B-DF-HJ-NP-TV-Z\(\)\'\,\?\!\.0-9]/ig, "").toUpperCase();
  questionVowelsSpacesRemoved = newQuestion.replace(/[^B-DF-HJ-NP-TV-Z\(\)\'\,\?\!\.0-9]/ig, "").toUpperCase();
  questionVowelsRemoved = newQuestion.replace(/[^B-DF-HJ-NP-TV-Z\(\)\'\,\?\!\.0-9\s]/ig, "").toUpperCase();
  if (answerVowelsSpacesRemoved != questionVowelsSpacesRemoved || questionVowelsRemoved != newQuestion || newQuestion === "") {
    alert("Warning: question no longer matches answer\nThe question has been recalculated");
    processMissingVowelsEdit(eventElement.parentElement.children[0]);
  }
}

function generateMissingVowelsSchedule() {
  inputWindows = document.getElementById("scheduler-round-4-tab").querySelectorAll(".scheduler-input-window");
  missingVowelsSchedule = [];
  for(let i = 0; i < inputWindows.length; i++) {
    inputWindow = inputWindows[i];
    categoryTitle = inputWindow.querySelector(".input-window-title [contenteditable]").innerText;
    if (categoryTitle === "") {
      alert("Error saving schedule (missing vowels round):\nOne or more categories does not have a title");
      return false
    }
    categorySchedule = {"cat":categoryTitle, "list":[]};
    missingVowelsSchedule.push(categorySchedule);
    dataCells = inputWindow.querySelectorAll("td");
    for(let j = 0; j < dataCells.length; j+=2) {
      answerText = dataCells[j].innerText;
      questionText = dataCells[j+1].innerText;
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
    addMissingVowelsCategory();
    inputWindows = document.getElementById("scheduler-round-4-tab").querySelectorAll(".scheduler-input-window");
    inputWindow = inputWindows[inputWindows.length - 1];
    inputWindow.querySelector(".input-window-title [contenteditable]").innerText = categorySchedule.cat;
    dataCells = inputWindow.querySelectorAll("td");
    for(let j = 0; j < dataCells.length; j+=2) {
      dataCells[j].innerText = categorySchedule.list[j/2].a;
      dataCells[j+1].innerText = categorySchedule.list[j/2].q;
    }
  }
}

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