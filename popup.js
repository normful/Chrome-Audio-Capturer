let interval;
let timeLeft;
const startButton = document.createElement("button");
startButton.innerHTML = "Start Capture"
startButton.onclick = () => {chrome.runtime.sendMessage("startCapture")};

const stopButton = document.createElement("button");
stopButton.innerHTML = "Stop Capture";
stopButton.onclick = () => {chrome.runtime.sendMessage("stopCapture")};

const displayStatus = function() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const status = document.getElementById("status");
    const timeRem = document.getElementById("timeRem");
    const buttons = document.getElementById("buttons");
    if(tabs[0].url.toLowerCase().includes("youtube")) {
      status.innerHTML = "Capture is disabled on this site due to copyright";
    } else {
      chrome.runtime.sendMessage({currentTab: tabs[0].id}, (response) => {
        if(response) {
          chrome.storage.sync.get({
            maxTime: 1200000
          }, (options) => {
            if(options.maxTime > 1200000) {
              chrome.storage.sync.set({
                maxTime: 1200000
              });
              timeLeft = 1200000 - (Date.now() - response)
            } else {
              timeLeft = options.maxTime - (Date.now() - response)
            }
            status.innerHTML = "Tab is currently being captured";
            timeRem.innerHTML = `${parseTime(timeLeft)} remaining`
            interval = setInterval(() => {
              timeLeft = timeLeft - 1000;
              timeRem.innerHTML = `${parseTime(timeLeft)} remaining`
            }, 1000);
          });
          buttons.appendChild(stopButton);
        } else {
          buttons.appendChild(startButton);
        }
      });
    }
  });
}

const parseTime = function(time) {
  let minutes = Math.floor((time/1000)/60);
  let seconds = Math.floor((time/1000) % 60);
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  if (seconds < 10) {
    seconds = '0' + seconds;
  }
  return `${minutes}:${seconds}`
}

chrome.runtime.onMessage.addListener((request, sender) => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const status = document.getElementById("status");
    const timeRem = document.getElementById("timeRem");
    const buttons = document.getElementById("buttons");
    if(request.captureStarted && request.captureStarted === tabs[0].id) {
      chrome.storage.sync.get({
        maxTime: 1200000
      }, (options) => {
        if(options.maxTime > 1200000) {
          chrome.storage.sync.set({
            maxTime: 1200000
          });
          timeLeft = 1200000 - (Date.now() - request.startTime)
        } else {
          timeLeft = options.maxTime - (Date.now() - request.startTime)
        }
        status.innerHTML = "Tab is currently being captured";
        timeRem.innerHTML = `${parseTime(timeLeft)} remaining`
        interval = setInterval(() => {
          timeLeft = timeLeft - 1000;
          timeRem.innerHTML = `${parseTime(timeLeft)} remaining`
        }, 1000);
      });
      buttons.appendChild(stopButton);
      buttons.removeChild(startButton);
    } else if(request.captureStopped && request.captureStopped === tabs[0].id) {
      status.innerHTML = "";
      buttons.appendChild(startButton);
      buttons.removeChild(stopButton);
      timeRem.innerHTML = "";
      clearInterval(interval);
    }
  });
});



document.addEventListener('DOMContentLoaded', function() {
  displayStatus();
  const startKey = document.getElementById("startKey");
  const endKey = document.getElementById("endKey");
  chrome.runtime.getPlatformInfo((info) => {
    if(info.os === "mac") {
      startKey.innerHTML = "Command + Shift + U to start capture on current tab";
      endKey.innerHTML = "Command + Shift + X to stop capture on current tab";
    } else {
      startKey.innerHTML = "Ctrl + Shift + S to start capture on current tab";
      endKey.innerHTML = "Ctrl + Shift + X to stop capture on current tab";
    }
  })
  const options = document.getElementById("options");
  options.onclick = () => {chrome.runtime.openOptionsPage()};
  const git = document.getElementById("GitHub");
  git.onclick = () => {chrome.tabs.create({url: "https://github.com/arblast/Chrome-Audio-Capturer"})};
});
