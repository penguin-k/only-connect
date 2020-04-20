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

function saveScheduleToLocalStorage() {
  cachedVersion = localStorage.getItem("only-connect-schedule-cached");
  newVersion = JSON.stringify(gameSchedule);
  if (cachedVersion !== null && cachedVersion != newVersion) {
    if (!confirm("There is an older schedule saved in local storage\nContinue saving and overwrite the older version?")) {
      alert("Operation cancelled");
      return false
    }
    //If accepted, continue
  }
  newVersion = JSON.stringify(gameSchedule);
  localStorage.setItem("only-connect-schedule-cached", newVersion);
  alert("Schedule saved successfully");
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
        switchTab("home");
        //RELOAD SCREENS HERE
        alert("Saved schedule loaded successfully");
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
      switchTab("home");
      //RELOAD SCREENS HERE
      alert("Uploaded schedule loaded successfully");
    }
    catch (err) {
      console.error("Failed to apply uploaded schedule: "+err);
      gameSchedule = previousSchedule;
      switchTab("home");
      //RELOAD SCREENS HERE
      alert("An error occurred while processing the uploaded file. The previous schedule has been restored.");
    }
  }
}

function addRound(roundNumber) {
  //used to add an additional round, e.g. a second connecting wall
  roundRef = "round"+String(roundNumber);
  template = roundTemplates[roundRef];
  gameSchedule[roundRef].push(template);
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

function pageLoadInit() {
  selectedWindow = "home";
}