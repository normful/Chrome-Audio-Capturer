const startButton = document.createElement("button");
startButton.innerHTML = "Start Capture"
startButton.onclick = () => {chrome.runtime.sendMessage("startCapture")};

const stopButton = document.createElement("button");
stopButton.innerHTML = "Stop Capture";
stopButton.onclick = () => {chrome.runtime.sendMessage("stopCapture")};

const displayStatus = function() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.runtime.sendMessage({currentTab: tabs[0].id}, (response) => {
      const status = document.getElementById("status");
      const buttons = document.getElementById("buttons");
      if(response) {
        status.innerHTML = "Tab is currently being captured";
        buttons.appendChild(stopButton);
      } else {
        buttons.appendChild(startButton);
      }
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender) => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const status = document.getElementById("status");
    const buttons = document.getElementById("buttons");
    if(request.captureStarted && request.captureStarted === tabs[0].id) {
      status.innerHTML = "Tab is currently being captured";
      buttons.appendChild(stopButton);
      buttons.removeChild(startButton);
    } else if(request.captureStopped && request.captureStopped === tabs[0].id) {
      status.innerHTML = "";
      buttons.appendChild(startButton);
      buttons.removeChild(stopButton);
    }
  });
});



document.addEventListener('DOMContentLoaded', function() {
  displayStatus();
  const options = document.getElementById("options");
  options.onclick = () => {chrome.runtime.openOptionsPage()};
  const git = document.getElementById("GitHub");
  git.onclick = () => {chrome.tabs.create({url: "https://github.com/arblast/Chrome-Audio-Capturer"})};
});
