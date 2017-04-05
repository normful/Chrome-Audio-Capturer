document.addEventListener('DOMContentLoaded', () => {
  const encodeProgress = document.getElementById('encodeProgress');
  let mediaRecorder;
  let format;
  let audioURL;
  let encoding = false;
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.type === "createTab") {
      format = request.format;
      if(request.audioURL) {
        generateSave(request.audioURL);
      } else {
        encoding = true;
        mediaRecorder = request.recorder;
        mediaRecorder.onEncodingProgress = (recorder, progress) => {
          console.log(progress);
          encodeProgress.value = progress * 100;
        }
      }
    }
    if(request.type === "encodingComplete" && encoding) {
      encoding = false;
      mediaRecorder = null;
      encodeProgress.value = 100;
      generateSave(request.audioURL);
    }
    function generateSave(url) {
      const currentDate = new Date(Date.now()).toDateString();
      chrome.downloads.download({url: url, filename: `${currentDate}.${format}`, saveAs: true});
    }
  });
})
