// Check if breachedWebsites array exists on the window object; if not, initialize it
if (typeof window.breachedWebsites === 'undefined') {
  window.breachedWebsites = [];
}

// Checks if a global cache variable exists; if not, initializes it with the content from local storage or an empty object if none exists
if (typeof breachStatusCache === 'undefined') {
  var breachStatusCache = JSON.parse(localStorage.getItem('breachCache') || '{}');
}

/**
 * Asynchronously fetches and checks whether the domain of the current URL has been involved in a data breach.
 * @param {string} currentUrl - The URL of the current website the user is visiting.
 * @returns {Promise<void>} - A promise that completes when the check is finished.
 */
async function fetchBreachedSites(currentUrl) {
  try {
    // Parse the current URL to get the domain
    const urlObj = new URL(currentUrl);
    let originalDomain = urlObj.hostname;
    // Strip the 'www.' prefix from the domain
    let domain = originalDomain.replace(/^www\./, "");

    // Check if the domain is not an IP address using a regular expression
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
      // If the domain is already in the cache, use the cached breach status
      if (breachStatusCache.hasOwnProperty(domain)) {
        const isBreached = breachStatusCache[domain];
        // Send the breach status to the background script or content script
        chrome.runtime.sendMessage({ action: 'setBreached', value: isBreached });
        return;
      }

      // If the domain is not in the cache, make an API call to check for breaches
      const apiUrl = `https://haveibeenpwned.com/api/v3/breaches?Domain=${domain}`;
      const response = await fetch(apiUrl);

      // If the API call is successful, process the response
      if (response.ok) {
        const data = await response.json();
        // Check if there are any breaches returned for the domain
        const isBreached = data.length > 0;

        // Update the cache with the new breach status
        breachStatusCache[domain] = isBreached;
        // Save the updated cache to local storage for persistence
        localStorage.setItem('breachCache', JSON.stringify(breachStatusCache));

        // Send the breach status to the background script or content script
        chrome.runtime.sendMessage({ action: 'setBreached', value: isBreached });
      } else {
        // If the API call fails, log an error
        console.error(`Failed to fetch breach info: ${response.status} ${response.statusText}`);
      }
    } else {
      // If the domain is an IP address, log that we are skipping it
      console.log("Skipping IP address:", domain);
    }
  } catch (e) {
    // Log any errors that occur during the fetch operation
    console.error("Error during breach check:", e);
  }
}

// Sends a message to the Chrome extension's background script to get the current tab's URL
chrome.runtime.sendMessage({ action: 'getCurrentTabUrl' }, function(response) {
  // When the URL is received, call fetchBreachedSites to check for breaches
  const currentUrl = response.url;
  fetchBreachedSites(currentUrl);
});
