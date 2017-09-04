document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "encodingComplete") {
      save(request.audioURL, request.format, request.startTabId);
    }
  });

  function save(url, format, startTabId) {
    const randString = Math.random().toString(36).substring(2);
    const dateString = new Date().toISOString().replace(/[T:.]/g, '-');
    const filename = `cac-${dateString}-${randString}`;

    chrome.downloads.download({
      url: url,
      filename: `${filename}.${format}`,
      saveAs: false
    }, onDownloadComplete.bind(startTabId));
  }

  function onDownloadComplete(startTabId) {
    // TODO: Figure out why there is no tab with the id of `startTabId`
    // at this point and thus why it cannot be switched back to with:
    // chrome.tabs.update(startTabId, {active: true});
    //
    // A workaround is to use this extension with the
    // start tab as the last tab of the current window so that
    // closing this `completeTab` results in the startTab being
    // reactivated by default.

    chrome.tabs.query({active: true, currentWindow: true}, function(matchingTabs) {
      const completeTabId = matchingTabs[0].id;
      chrome.tabs.remove(completeTabId);
    });
  }
})
