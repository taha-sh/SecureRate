document.addEventListener("DOMContentLoaded", function () {
  // Initialize the toggle state from storage
  chrome.storage.local.get('overlayEnabled', function(data) {
    const element = document.getElementById('overlayToggle');
    if (element) {
      element.checked = data.overlayEnabled || false;
    }
  });

  const element = document.getElementById('overlayToggle');
  if (element) {
    element.addEventListener('change', function(event) {
      const isChecked = event.target.checked;
      chrome.storage.local.set({ overlayEnabled: isChecked });
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleOverlay", overlayEnabled: isChecked });

        // Send a message to the background script to execute injectoverlay.js
        if (isChecked) {
          chrome.runtime.sendMessage({ action: "executeInjectOverlay" });
        }
      });
    });
  } else {
    console.error("Element with ID 'overlayToggle' not found.");
  }
});
