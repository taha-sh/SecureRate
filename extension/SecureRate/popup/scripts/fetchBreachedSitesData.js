window.breachedWebsites;


if (typeof window.breachedWebsites === 'undefined') {
  window.breachedWebsites = [];
}

/**
 * Checks if the current URL's domain has been breached using the Have I Been Pwned API.
 * @param {string} currentUrl - The current URL the user is at.
 * @returns {Promise<void>} - A Promise that resolves when the check is complete.
 */
// Initialize cache from local storage
if (typeof breachStatusCache === 'undefined') {
  var breachStatusCache = JSON.parse(localStorage.getItem('breachCache') || '{}');
}

async function fetchBreachedSites(currentUrl) {
  try {
    const urlObj = new URL(currentUrl);
    let originalDomain = urlObj.hostname;
    let domain = originalDomain.replace(/^www\./, "");

    // Ensure it's not an IP address
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
      // Check the cache first
      if (breachStatusCache.hasOwnProperty(domain)) {
        const isBreached = breachStatusCache[domain];
        // Handle the cached result
        chrome.runtime.sendMessage({ action: 'setBreached', value: isBreached });
        return;
      }

      // If not in cache, proceed with API call
      const apiUrl = `https://haveibeenpwned.com/api/v3/breaches?Domain=${domain}`;
      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();
        const isBreached = data.length > 0;

        // Update the cache
        breachStatusCache[domain] = isBreached;

        // Persist cache to local storage
        localStorage.setItem('breachCache', JSON.stringify(breachStatusCache));

        // Handle the new result
        chrome.runtime.sendMessage({ action: 'setBreached', value: isBreached });
      } else {
        console.error(`Failed to fetch breach info: ${response.status} ${response.statusText}`);
      }
    } else {
      console.log("Skipping IP address:", domain);
    }
  } catch (e) {
    console.error("Error during breach check:", e);
  }
}


// Fetch the current URL and call fetchBreachedSites
chrome.runtime.sendMessage({ action: 'getCurrentTabUrl' }, function(response) {
  const currentUrl = response.url;
  fetchBreachedSites(currentUrl);
});
