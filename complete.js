document.addEventListener('DOMContentLoaded', () => {
  const encodeProgress = document.getElementById('encodeProgress');
  let mediaRecorder;
  let format;
  let audioURL;
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.type === "createTab") {
      console.log("instant");
      if(request.audioURL) {
        generateSave(request.audioURL);
      } else {
        mediaRecorder = request.recorder;
        format = request.format;
        mediaRecorder.onEncodingProgress = (recorder, progress) => {
          encodeProgress.value = progress * 100;
        }
      }
    }
    if(request.type === "encodingComplete") {
      console.log("delay");
      generateSave(request.audioURL);
    }
    function generateSave(url) {
      const currentDate = new Date(Date.now()).toDateString();
      chrome.downloads.download({url: url, filename: `${currentDate}.${format}`, saveAs: true});
    }
  });
})
