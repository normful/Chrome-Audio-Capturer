document.addEventListener('DOMContentLoaded', () => {
  const mute = document.getElementById('mute');
  const maxTime = document.getElementById('maxTime');
  const save = document.getElementById('save');
  const status = document.getElementById('status');
  const mp3Select = document.getElementById('mp3');
  const wavSelect = document.getElementById('wav');
  let currentFormat;
  chrome.storage.sync.get({
    muteTab: false,
    maxTime: 1200000,
    format: "mp3"
  }, (options) => {
    mute.checked = options.muteTab;
    maxTime.value = options.maxTime/60000;
    currentFormat = options.format;
    if (options.format === "mp3") {
      mp3Select.checked = true;
    } else {
      wavSelect.checked = true;
    }
  });

  mute.onchange = () => {
    status.innerHTML = "";
  }

  maxTime.onchange = () => {
    status.innerHTML = "";
    if(maxTime.value > 20) {
      maxTime.value = 20;
    } else if (maxTime.value < 1) {
      maxTime.value = 1;
    } else if (isNaN(maxTime.value)) {
      maxTime.value = 20;
    }
  }

  mp3Select.onclick = () => {
    currentFormat = "mp3";
  }

  wavSelect.onclick = () => {
    currentFormat = "wav";
  }

  save.onclick = () => {
    chrome.storage.sync.set({
      muteTab: mute.checked,
      maxTime: maxTime.value*60000,
      format: currentFormat
    });
    status.innerHTML = "Settings saved!"
  }
});
