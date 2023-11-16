// This script will set up the listener for the DOMContentLoaded event,
// ensuring the code within only runs after the DOM has fully loaded.
document.addEventListener("DOMContentLoaded", function () {
  // Retrieve the 'overlayEnabled' state from the chrome's local storage.
  chrome.storage.local.get('overlayEnabled', function(data) {
    // Access the toggle element in the DOM.
    const overlayToggleElement = document.getElementById('overlayToggle');
    // Check if the element exists to avoid null references.
    if (overlayToggleElement) {
      // Set the toggle state based on retrieved value, defaulting to false.
      overlayToggleElement.checked = data.overlayEnabled || false;
    } else {
      // If the element does not exist, log an error for debugging.
      console.error("Element with ID 'overlayToggle' not found.");
    }
  });

  // Add an event listener for the change event on the toggle element.
  const overlayToggleElement = document.getElementById('overlayToggle');
  if (overlayToggleElement) {
    overlayToggleElement.addEventListener('change', function(event) {
      // Determine the checked state from the event target.
      const isChecked = event.target.checked;
      // Save the new state back into chrome's local storage.
      chrome.storage.local.set({ overlayEnabled: isChecked });

      // Query for the active tab in the current window to send a message.
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        try {
          // Send a message to the active tab with the new overlay state.
          chrome.tabs.sendMessage(tabs[0].id, { action: "toggleOverlay", overlayEnabled: isChecked }, function(response) {
            console.log("Response received:", response);
          });

          // If the overlay is enabled, instruct the background script to execute injectoverlay.js.
          if (isChecked) {
            chrome.runtime.sendMessage({ action: "executeInjectOverlay" });
          }
        } catch (error) {
          console.error("Error sending message:", error);
        }
      });
    });
  }
});
