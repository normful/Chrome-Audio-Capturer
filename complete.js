document.addEventListener('DOMContentLoaded', () => {
  function save(url, format) {
    const randString = Math.random().toString(36).substring(2);
    const dateString = new Date().toISOString().replace(/[T:.]/g, '-');
    const filename = `cac-${dateString}-${randString}`;

    chrome.downloads.download({
      url: url,
      filename: `${filename}.${format}`,
      saveAs: false
    });
  }

  let format;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "encodingComplete") {
      save(request.audioURL, request.format);
    }
  });
})
