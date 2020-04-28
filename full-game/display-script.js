controllerWindow = window.opener;
targetOrigin = null;

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
window.addEventListener("message", receiveMessage, false);
function receiveMessage(event) {
  console.log(event);
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
}