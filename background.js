const audioCapture = (chunks) => {
  let mediaRecorder;
  chrome.tabCapture.capture({audio: true}, (stream) => {
    const liveStream = stream;
    mediaRecorder = new MediaRecorder(stream);
    // const audioContainer = document.getElementById("audio-result");
    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    }
    mediaRecorder.onstop = () => {
      console.log(chunks);
      const blob = new Blob(chunks, {'type' : 'audio/ogg; codecs=opus'})
      const audioURL = window.URL.createObjectURL(blob);
      chrome.downloads.download({url: audioURL, filename: "sound.wav"})
      liveStream.getAudioTracks()[0].stop();
    }
    mediaRecorder.start();
    chrome.commands.onCommand.addListener((command) => {
      if (command === "stop") {
        mediaRecorder.stop();
      }
    })
    let audio = new Audio();
    audio.srcObject = liveStream;
    audio.play();
    // let audio = document.createElement('audio');
    // audioContainer.appendChild(audio);
    // audio.srcObject = liveStream;
    // audio.onloadedmetadata = (e) => {
    //   audio.play();
    // }
  });
  return mediaRecorder;
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "start") {
    let chunks = [];
    let capture = audioCapture(chunks);
  }
})
