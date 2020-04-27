controllerWindow = window.opener;

function pageLoadInit() {
  console.log("Page loaded")
  controllerWindow.postMessage("Display loaded", window.location.href);
}