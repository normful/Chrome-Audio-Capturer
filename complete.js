document.addEventListener('DOMContentLoaded', () => {
  const encodeProgress = document.getElementById('encodeProgress');
  let mediaRecorder;
  let format;
  let audioURL;
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.audioURL) {
      chrome.downloads.download({url: request.audioURL, filename: `Capture.` + `${request.format}`})
    } else {
      mediaRecorder = request.recorder;
      format = request.format;
      mediaRecorder.onEncodingProgress = (recorder, progress) => {
        console.log(progress);
      }
    }
  });
})
