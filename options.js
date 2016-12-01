document.addEventListener('DOMContentLoaded', () => {
  const mute = document.getElementById('mute');
  chrome.storage.sync.get({
    muteTab: false
  }, (options) => {
    mute.checked = options.muteTab;
  });
  mute.onchange = () => {
    chrome.storage.sync.set({
      muteTab: mute.checked
    });
  }
});
