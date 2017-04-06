document.addEventListener('DOMContentLoaded', () => {
  const encodeProgress = document.getElementById('encodeProgress');
  const saveButton = document.getElementById('saveCapture');
  let format;
  let audioURL;
  let encoding = false;
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.type === "createTab") {
      format = request.format;
      if(request.audioURL) {
        encodeProgress.value = 100;
        generateSave(request.audioURL);
      } else {
        encoding = true;
        progressDisplay.style.display = "block";
      }
    }
    if(request.type === "encodingComplete" && encoding) {
      encoding = false;
      encodeProgress.value = 100;
      generateSave(request.audioURL);
    }
    if(request.type === "encodingProgress" && encoding) {
      encodeProgress.value = request.progress * 100;
    }
    function generateSave(url) {
      const currentDate = new Date(Date.now()).toDateString();
      saveButton.onclick = () => {
        chrome.downloads.download({url: url, filename: `${currentDate}.${format}`, saveAs: true});
      };
      saveButton.style.display = "block";
    }
  });
})
