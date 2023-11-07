// Function to execute an array of scripts on a given tab
function executeScripts(tabId, scriptsToExecute) {
  return Promise.all(
    scriptsToExecute.map(script => chrome.scripting.executeScript({
      target: { tabId },
      files: [script],
    }))
  );
}

// Variables to store site security information
let isBreached = false;
let supports2FA = null;

// Function to check if the URL is injectable
function isInjectable(url) {
  const nonInjectablePatterns = [
    'chrome://', // Chrome's internal pages
    'chrome-extension://', // Chrome extensions pages
    'https://chrome.google.com/webstore/', // Chrome Web Store
    'chrome-error://', // Chrome error pages
    'edge://', // Edge's internal pages
    'about:', // Universal internal pages
    'brave://', // Brave's internal pages
    'opera://', // Opera's internal pages
    'vivaldi://', // Vivaldi's internal pages
    'moz-extension://' // Firefox's extension pages
  ];
  return !nonInjectablePatterns.some(pattern => url.startsWith(pattern));
}

function urlMatchesContentScriptPattern(url) {
  // This is a generic pattern, update it to match the patterns you are using
  const patterns = [
    'https://*/*',
    'http://*/*',
  ];

  return patterns.some(pattern => new RegExp(pattern.replace(/\*/g, '.*')).test(url));
}

// Listener for tab updates to check site security and inject scripts as necessary
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Check if the tab has finished loading and has a valid URL
  if (changeInfo.status === 'complete' && tab.status === 'complete' && tab.url && isInjectable(tab.url)) {
      // Retrieve the overlay enabled setting from local storage
      chrome.storage.local.get('overlayEnabled', async function(data) {
        if (data.overlayEnabled && urlMatchesContentScriptPattern(tab.url)) {
          // Define the scripts to execute on the page
          const scriptsToExecute = [
            'popup/scripts/initializeExtension.js',
            'popup/scripts/fetchBreachedSitesData.js',
            'popup/scripts/fetchPhishingData.js',
            'popup/scripts/fetchMaliciousData.js',
            'popup/scripts/fetch2FAData.js',
            'popup/scripts/websiteSecurityAnalysis.js',
            'popup/scripts/updateUserInterface.js',
            'popup/scripts/injectOverlay.js',
            'popup/scripts/toggleOverlay.js',
          ];

          // Execute the array of scripts
          await executeScripts(tabId, scriptsToExecute);

          // Inject the overlay script after the above scripts are executed
          chrome.scripting.executeScript({
            target: { tabId },
            files: ['popup/scripts/injectoverlay.js']
          }).catch(error => console.error('Error injecting overlay script:', error));
        }
      });
    }
  });



// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Ensure that request.action is defined
  try {
    // Ensure that request.action is defined
    if (typeof request.action === 'undefined') {
      console.log('Received undefined action');
      sendResponse({ error: 'Action is undefined' });
      return false; // No asynchronous response to be sent.
    }


  switch (request.action) {
    case 'setBreached':
      // Update the breached status
      isBreached = !!request.value;
      sendResponse({ status: 'Breached status updated' });
      break;

    case 'getBreached':
      // Send the breached status in response to a request
      sendResponse({ value: isBreached });
      break;

    case 'getCurrentTabUrl':
      // Retrieve the current tab URL and send it back
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length === 0) {
          sendResponse({ error: 'No active tab found' });
        } else {
          sendResponse({ url: tabs[0].url });
        }
      });
      return true; // Indicate that we want to send a response asynchronously

    case 'setGrade':
      // Set the security grade of the current website
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'setGrade', value: request.value });
      });
      break;

    case 'set2FASupport':
      // Log and update the 2FA support status
      console.log("Setting 2FA support to:", request.value);
      supports2FA = request.value;
      console.log("Updated supports2FA to:", supports2FA);
      break;

    case 'get2FASupport':
      // Respond with the 2FA support status
      sendResponse({ value: supports2FA });
      break;


      case 'executeInjectOverlay':
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs.length === 0) {
            sendResponse({ error: 'No active tab found for injection' });
          } else if (urlMatchesContentScriptPattern(tabs[0].url)) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ['popup/scripts/injectoverlay.js']
            }, () => {
              // Check for any error thrown by the executeScript method
              if (chrome.runtime.lastError) {
                sendResponse({ error: 'Error injecting script' });
                return;
              }
              // Ping the content script to see if it is ready
              chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, response => {
                if (chrome.runtime.lastError || response !== 'pong') {
                  sendResponse({ error: 'Content script not ready' });
                } else {
                  sendResponse({ status: 'Overlay injected and content script ready' });
                }
              });
            });
          } else {
            sendResponse({ error: 'URL does not match content script pattern' });
          }
        });
        return true; // Indicate that we want to send an asynchronous response

        default:
          console.log('Unrecognized action:', request.action);
          sendResponse({ error: 'Unrecognized action' });
          break;
      }
    } catch (error) {
      console.log('Error occurred in message listener:', error);
      sendResponse({ error: error.message || 'An error occurred' });
      return false;
    }
  });
