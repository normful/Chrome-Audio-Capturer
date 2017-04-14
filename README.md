# Chrome Audio Capture

Chrome Audio Capture is a Chrome extension that allows users to capture any audio playing on the current tab. Multiple tabs can be captured simultaneously. Completed captures will be downloaded to the chrome downloads folder and will be saved as .wav files. Users will have the option to mute tabs that are currently being captured.

Chrome Audio Capture is available in the [Chrome Store](https://chrome.google.com/webstore/detail/chrome-audio-capture/kfokdmfpdnokpmpbjhjbcabgligoelgp)

Hotkeys for Windows:
 - Ctrl + Shift + S: Start capture on current tab
 - Ctrl + Shift + X: Stop capture on current tab

Hotkeys for MAC:
 - Command + Shift + U: Start capture on current tab
 - Command + Shift + X: Stop capture on current tab

 The main interface of the extension

![start]

[start]: ./docs/main.png

Interface during capture

![capturing]

[capturing]: ./docs/capturing.png


## Implementation Details

### Capturing Audio
To capture the audio in the current tab, I used the chrome `tabCapture` API to obtain a `MediaStream` object of the current tab. Next I used the `MediaStream` object to initialize a recorder that will encode the stream into a .wav file using the `Recorder.js` library.

```javascript
chrome.tabCapture.capture({audio: true}, (stream) => {
  let startTabId;
  chrome.tabs.query({active:true, currentWindow: true}, (tabs) => startTabId = tabs[0].id)
  const liveStream = stream;
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  let mediaRecorder = new Recorder(source);
```

### Tab Management
To allow audio capture on multiple tabs simultaneously, I stored the `tabId` of each tab being captured into the `sessionStorage` object. When a `stopCapture` command is issued, the extension will check whether the current tab is the same as the tab that the capture was started on, and only stop the specific instance of the capture on the current tab.

```javascript
const stopCapture = function() {
  let endTabId;
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    endTabId = tabs[0].id;
    if(mediaRecorder && startTabId === endTabId){
      mediaRecorder.stop();
      mediaRecorder.exportWAV((blob)=> {
        const audioURL = window.URL.createObjectURL(blob);
        const now = new Date(Date.now());
        const currentDate = now.toDateString();
        chrome.downloads.download({url: audioURL, filename: `${currentDate.replace(/\s/g, "-")} Capture`})
      })
```

### Audio Playback During Capture
By default, using `tabCapture` will mute the audio on the current tab in order for the capture to take place. To allow audio to continue playing during the capture, I created an `Audio` object which has its source linked to the ongoing stream that is being captured. In the options menu, users will have the option to keep the tab muted or unmuted during the capture.

```javascript
chrome.storage.sync.get({
  muteTab: false
}, (options) => {
  if(!options.muteTab) {
    let audio = new Audio();
    audio.srcObject = liveStream;
    audio.play();
  }
});
```

![options]

[options]: ./docs/options.png

### Future Work

- [ ] Ability to cut parts of the audio off before saving
- [ ] Ability to pause and resume captures
