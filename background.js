class Recorder {

  constructor(source, cfg) {
      this.config = {
          bufferLen: 4096,
          numChannels: 2,
          mimeType: 'audio/wav'
      };

      this.recording = false;

      this.callbacks = {
          getBuffer: [],
          exportWAV: []
      };
      Object.assign(this.config, cfg);
      this.context = source.context;
      this.node = (this.context.createScriptProcessor ||
      this.context.createJavaScriptNode).call(this.context,
          this.config.bufferLen, this.config.numChannels, this.config.numChannels);

      this.node.onaudioprocess = (e) => {
          if (!this.recording) return;

          var buffer = [];
          for (var channel = 0; channel < this.config.numChannels; channel++) {
              buffer.push(e.inputBuffer.getChannelData(channel));
          }
          this.worker.postMessage({
              command: 'record',
              buffer: buffer
          });
      };

      source.connect(this.node);
      this.node.connect(this.context.destination);
      const workerURL = chrome.extension.getURL("worker.js");
      this.worker = new Worker(workerURL);
      this.worker.postMessage({
          command: 'init',
          config: {
              sampleRate: this.context.sampleRate,
              numChannels: this.config.numChannels
          }
      });

      this.worker.onmessage = (e) => {
          let cb = this.callbacks[e.data.command].pop();
          if (typeof cb == 'function') {
              cb(e.data.data);
          }
      };
  }


  record() {
      this.recording = true;
  }

  stop() {
      this.recording = false;
  }

  clear() {
      this.worker.postMessage({command: 'clear'});
  }

  getBuffer(cb) {
      cb = cb || this.config.callback;
      if (!cb) throw new Error('Callback not set');

      this.callbacks.getBuffer.push(cb);

      this.worker.postMessage({command: 'getBuffer'});
  }

  exportWAV(cb, mimeType) {
      mimeType = mimeType || this.config.mimeType;
      cb = cb || this.config.callback;
      if (!cb) throw new Error('Callback not set');

      this.callbacks.exportWAV.push(cb);

      this.worker.postMessage({
          command: 'exportWAV',
          type: mimeType
      });
  }
}

const audioCapture = () => {
  chrome.tabCapture.capture({audio: true}, (stream) => {
    let startTabId;
    let timeout;
    chrome.tabs.query({active:true, currentWindow: true}, (tabs) => startTabId = tabs[0].id)
    const liveStream = stream;
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    let mediaRecorder = new Recorder(source);

    mediaRecorder.record();
    chrome.commands.onCommand.addListener(function onStop(command) {
      if (command === "stop") {
        stopCapture();
        clearTimeout(timeout);
      }
    });
    chrome.runtime.onMessage.addListener((request) => {
      if(request === "stopCapture") {
        stopCapture();
        clearTimeout(timeout);
      }
    });
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
            chrome.downloads.download({url: audioURL, filename: `${currentDate.replace(/\s/g, "-")} Capture.wav`})
          })
          audioCtx.close();
          liveStream.getAudioTracks()[0].stop();
          mediaRecorder = null;
          sessionStorage.removeItem(endTabId);
          chrome.runtime.sendMessage({captureStopped: endTabId});
        }
      })
    }
    chrome.storage.sync.get({
      maxTime: 1200000
    }, (options) => {
      let time = options.maxTime;
      if(time > 1200000) {
        time = 1200000
      }
      timeout = setTimeout(stopCapture, time);
    });
    chrome.storage.sync.get({
      muteTab: false
    }, (options) => {
      if(!options.muteTab) {
        let audio = new Audio();
        audio.srcObject = liveStream;
        audio.play();
      }
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.currentTab && sessionStorage.getItem(request.currentTab)) {
    sendResponse(sessionStorage.getItem(request.currentTab));
  } else if (request.currentTab){
    sendResponse(false);
  } else if (request === "startCapture") {
    startCapture();
  }
});

const startCapture = function() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if(tabs[0].url.toLowerCase().includes("youtube")) {
      chrome.tabs.create({url: "error.html"});
    } else {
      if(!sessionStorage.getItem(tabs[0].id)) {
        sessionStorage.setItem(tabs[0].id, Date.now());
        audioCapture();
        chrome.runtime.sendMessage({captureStarted: tabs[0].id, startTime: Date.now()});
      }
    }
  });
};


chrome.commands.onCommand.addListener((command) => {
  if (command === "start") {
    startCapture();
  }
});
