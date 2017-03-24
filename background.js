var extend = function() {
  var target = arguments[0],
      sources = [].slice.call(arguments, 1);
  for (var i = 0; i < sources.length; ++i) {
    var src = sources[i];
    for (key in src) {
      var val = src[key];
      target[key] = typeof val === "object"
        ? extend(typeof target[key] === "object" ? target[key] : {}, val)
        : val;
    }
  }
  return target;
};

class Recorder {

  constructor(source, configs) {
    extend(this, CONFIGS, configs || {});
    this.context = sourceNode.context;
    if (this.context.createScriptProcessor == null)
      this.context.createScriptProcessor = this.context.createJavaScriptNode;
    this.input = this.context.createGain();
    sourceNode.connect(this.input);
    this.buffer = [];
    this.initWorker();
  }

  isRecording() {
    return this.processor != null;
  }

  setEncoding(encoding) {
    if(!this.isRecording() && this.encoding !== encoding) {
        this.encoding = encoding;
        this.initWorker();
    }
  }

  setOptions(options) {
    if (!this.isRecording()) {
      extend(this.options, options);
      this.worker.postMessage({ command: "options", options: this.options});
    }
  }

  startRecording() {
    if(!this.isRecording()) {
      let numChannels = this.numChannels;
          buffer = this.buffer;
          worker = this.worker;
      this.processor = this.context.createScriptProcessor(
        this.options.bufferSize,
        this.numChannels, this.numChannels);
      this.input.connect(this.processor);
      this.processor.connect(this.context.destination);
      this.processor.onaudioprocess = function(event) {
        for (var ch = 0; ch < numChannels; ++ch)
          buffer[ch] = event.inputBuffer.getChannelData(ch);
        worker.postMessage({ command: "record", buffer: buffer });
      };
      this.worker.postMessage({
        command: "start",
        bufferSize: this.processor.bufferSize
      });
      this.startTime = Date.now();
    }
  }

  cancelRecording() {
    if(this.isRecording()) {
      this.input.disconnect();
      this.processor.disconnect();
      delete this.processor;
      this.worker.postMessage({ command: "cancel" });
    }
  }

  finishRecording: function() {
    if (this.isRecording()) {
      this.input.disconnect();
      this.processor.disconnect();
      delete this.processor;
      this.worker.postMessage({ command: "finish" });
    }
  }

  cancelEncoding: function() {
    if (this.options.encodeAfterRecord)
      if (!this.isRecording())
        this.onEncodingCanceled(this);
        this.initWorker();
      }
  }

  initWorker() {
    if (this.worker != null)
      this.worker.terminate();
    this.onEncoderLoading(this, this.encoding);
    this.worker = new Worker(this.workerDir + WORKER_FILE[this.encoding]);
    let _this = this;
    this.worker.onmessage = function(event) {
      let data = event.data;
      switch (data.command) {
        case "loaded":
          _this.onEncoderLoaded(_this, _this.encoding);
          break;
        case "timeout":
          _this.onTimeout(_this);
          break;
        case "progress":
          _this.onEncodingProgress(_this, data.progress);
          break;
        case "complete":
          _this.onComplete(_this, data.blob);
          break;
        case "error":
          _this.error(data.message);
      }
    };
    this.worker.postMessage({
      command: "init",
      config: {
        sampleRate: this.context.sampleRate,
        numChannels: this.numChannels
      },
      options: this.options
    });
  }

  onEncoderLoading(recorder, encoding) {}
  onEncoderLoaded(recorder, encoding) {}
  onTimeout(recorder) { recorder.finishRecording(); }
  onEncodingProgress(recorder, progress) {}
  onEncodingCanceled(recorder) {}
  onComplete(recorder, blob) {}

  // record() {
  //     this.recording = true;
  // }
  //
  // stop() {
  //     this.recording = false;
  // }
  //
  // clear() {
  //     this.worker.postMessage({command: 'clear'});
  // }
  //
  // getBuffer(cb) {
  //     cb = cb || this.config.callback;
  //     if (!cb) throw new Error('Callback not set');
  //
  //     this.callbacks.getBuffer.push(cb);
  //
  //     this.worker.postMessage({command: 'getBuffer'});
  // }
  //
  // exportWAV(cb, mimeType) {
  //     mimeType = mimeType || this.config.mimeType;
  //     cb = cb || this.config.callback;
  //     if (!cb) throw new Error('Callback not set');
  //
  //     this.callbacks.exportWAV.push(cb);
  //
  //     this.worker.postMessage({
  //         command: 'exportWAV',
  //         type: mimeType
  //     });
  // }
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
