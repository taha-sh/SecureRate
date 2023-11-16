// Add an event listener that triggers when the document's content has been loaded
document.addEventListener("DOMContentLoaded", function () {
  // Retrieve the 'overlayEnabled' state from the local storage
  chrome.storage.local.get('overlayEnabled', function(data) {
    // Set the checkbox checked state based on the retrieved value or default to false
    document.getElementById('overlayToggle').checked = data.overlayEnabled || false;
  });

  // Query for the active tab in the current window
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // Check if the tab exists and it has a URL
    if (tabs[0] && tabs[0].url) {
      try {
        /**
         * Attempt to create a new URL object from the current tab's URL.
         * This can throw an error if the URL is not valid.
         * @param {string} tabs[0].url - The URL of the first tab in the current window.
         * @returns {URL} - A URL object created from the tab's URL.
         */
        const currentUrl = new URL(tabs[0].url);
        // Call a function to perform an analysis on the website based on the URL
        analyzeWebsite(currentUrl);
      } catch (e) {
        // If an error occurs during URL object creation, it is silently caught
      }
    } else {
      // If the tab does not exist or it does not have a URL, display an error message
      document.getElementById('errorMessage').innerText = 'Unable to retrieve the current tab\'s URL.';
    }
  });
});
