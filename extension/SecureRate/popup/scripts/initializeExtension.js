document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get('overlayEnabled', function(data) {
    document.getElementById('overlayToggle').checked = data.overlayEnabled || false;
    });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && tabs[0].url) {
        try {
          /**
           * Creates a new URL object using the URL of the first tab in the current window.
           * @param {Array} tabs - An array of tabs in the current window.
           * @returns {URL} - A new URL object.
           */
          const currentUrl = new URL(tabs[0].url);
          analyzeWebsite(currentUrl);
        } catch (e) {
          // console.error("Invalid URL:", e);
        }
      } else {
        // console.error("No active tab or URL found.");
      }
});
});
