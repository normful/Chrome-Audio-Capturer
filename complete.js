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
        encodeProgress.style.width = '100%';
        generateSave(request.audioURL);
      } else {
        encoding = true;
      }
    }
    if(request.type === "encodingComplete" && encoding) {
      encoding = false;
      encodeProgress.style.width = '100%';
      generateSave(request.audioURL);
    }
    if(request.type === "encodingProgress" && encoding) {
      encodeProgress.style.width = `${request.progress * 100}%`;
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
