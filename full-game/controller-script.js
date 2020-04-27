displayWindow = null;


//Sending messages
window.addEventListener("message", receiveMessage, false);
function receiveMessage(event) {
  console.log(event);
  if (event.data == "Display loaded") {
    document.getElementById("popup-blocked-alert").style.display = "none";
  }
}

function pageLoadInit() {
  console.log("Controller loaded");
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
    document.getElementById("popup-blocked-alert").style.display = "block";
  } else {
    //Bring focus back to main window
    window.open().close();
  }
}