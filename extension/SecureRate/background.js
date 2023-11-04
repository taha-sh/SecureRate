// Function to execute an array of scripts on a given tab
function executeScripts(tabId, scriptsToExecute) {
  return Promise.all(
    scriptsToExecute.map((script) => {
      return chrome.scripting.executeScript({
        target: { tabId },
        files: [script],
      });
    })
  );
}

// Variable to store if a site is breached
let isBreached = false;

// Listener for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Check if the tab is completely loaded and has a URL
  if (
    changeInfo.status === "complete" &&
    tab.status === "complete" &&
    tab.url
  ) {
    const url = new URL(tab.url);
    // Filter out unwanted URLs
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !tab.url.startsWith("https://chrome.google.com/webstore/") &&
      !tab.url.startsWith("chrome-error://")
    ) {
      // Check if overlay is enabled in local storage
      chrome.storage.local.get('overlayEnabled', async function(data) {
        if (data.overlayEnabled) {
          // Scripts to be executed
          const scriptsToExecute = [
            "popup/scripts/initializeExtension.js",
            "popup/scripts/fetchBreachedSitesData.js",
            "popup/scripts/fetchPhishingData.js",
            "popup/scripts/fetchMaliciousData.js",
            "popup/scripts/fetch2FAData.js",
            "popup/scripts/websiteSecurityAnalysis.js",
            "popup/scripts/updateUserInterface.js",
            "popup/scripts/toggleOverlay.js",
          ];

          // Execute the scripts
          await executeScripts(tabId, scriptsToExecute);

          // Inject overlay script
          chrome.scripting.executeScript({
            target: { tabId },  // Inject into the current tab
            files: ['popup/scripts/injectoverlay.js']
          });
        }
      });
    }
  }
});


// Variable to store if a site supports 2FA
let supports2FA = null;  // Initialize to null

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle different actions
  if (request.action === 'setBreached') {
    isBreached = !!request.value;
  } else if (request.action === 'getBreached') {
    sendResponse({ value: isBreached });
  } else if (request.action === 'getCurrentTabUrl') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      sendResponse({ url: tabs[0].url });
    });
    return true;  // Required for asynchronous response
  } else if (request.action === 'setGrade') {
    const grade = request.value;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'setGrade', value: grade }, function(response) {
        if (chrome.runtime.lastError) {
          // Handle error silently
        }
      });
    });
    } else if (request.action === 'set2FASupport') {
        console.log("Setting 2FA support to:", request.value);
        supports2FA = request.value;  // Update the value based on the message received
        console.log("Updated supports2FA to:", supports2FA);
      } else if (request.action === 'get2FASupport') {
        console.log("Getting 2FA support:", supports2FA);
        sendResponse({ value: supports2FA });  // Send the current value back as a response
      }
});

// Another listener for executing overlay injection
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "executeInjectOverlay") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const tabId = tabs[0].id;
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['popup/scripts/injectoverlay.js']
      }).then(() => {
        // Script executed successfully
      }).catch((error) => {
        console.error(error);
      });
    });
  }
});
