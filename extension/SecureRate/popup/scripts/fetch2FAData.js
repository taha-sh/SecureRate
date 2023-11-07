// Logs to the console that the script is running
console.log("Script running");

// A cache object to store the 2FA support status of domains to avoid repeated API calls
var twoFACache = {};

// Function to check if a given string is an IP address
function isIPAddress(str) {
  // Regular expression to match the pattern of an IP address
  const regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  return regex.test(str); // Returns true if the string matches the IP address pattern
}

// Asynchronous function to fetch 2FA support status for the current URL
async function fetch2FASupport(currentUrl) {
  // Logs that the function has been called along with the URL
  console.log("fetch2FASupport called with URL:", currentUrl);

  try {
    // Creating a URL object from the current URL string
    const urlObj = new URL(currentUrl);
    // Extracting the domain from the URL and stripping out 'www.' and protocol if present
    let domain = urlObj.hostname.replace(/^www\./, "").replace(/^https?:\/\//, "");
    // Logging the parsed domain
    console.log("Parsed domain:", domain);

    // If the domain is an IP address, it is logged and skipped as IP addresses don't support 2FA
    if (isIPAddress(domain)) {
      console.log("Skipping IP address:", domain);
      return;
    }

    // If the domain's 2FA status is already cached, it logs the cache hit and sends the status to the runtime
    if (twoFACache.hasOwnProperty(domain)) {
      const status = twoFACache[domain];
      console.log("Cache hit for domain:", domain, "2FA Status:", status);
      chrome.runtime.sendMessage({ action: 'set2FASupport', value: status });
      return;
    }

    // URL for the API that provides 2FA support information
    const apiUrl = `https://api.2fa.directory/v3/all.json`;
    // Logging the API URL being fetched
    console.log("Fetching data from API:", apiUrl);

    // Fetches the data from the API
    const response = await fetch(apiUrl);

    // Checks if the API responded with an OK status
    if (response.ok) {
      // Parses the JSON response from the API
      const data = await response.json();
      // Logging the data received from the API
      console.log("API response data:", data);

      // Searches for the current domain within the API data to check for 2FA support
      const domainInfo = data.find(siteArray => siteArray[1].domain === domain);
      // Default status if domain information is not found
      let status = 'unknown';

      // If the domain information is found, it checks the 'tfa' property to determine 2FA support
      if (domainInfo) {
        status = domainInfo[1].hasOwnProperty('tfa') ? 'enabled' : 'disabled';
      }

      // Logging the result of the 2FA support check
      console.log("2FA support check result:", status);

      // Caching the 2FA status for the domain
      twoFACache[domain] = status;
      // Storing the updated cache in local storage for persistence
      localStorage.setItem('twoFACache', JSON.stringify(twoFACache));

      // Sending the 2FA status to the runtime for the current domain
      chrome.runtime.sendMessage({ action: 'set2FASupport', value: status });
    } else {
      // Logs an error message if the API call was unsuccessful
      console.error(`Failed to fetch 2FA support info: ${response.status} ${response.statusText}`);
    }
  } catch (e) {
    // Logs any errors caught during the process
    console.error("Error during 2FA check:", e);
  }
}

// Sends a message to the runtime to get the current tab's URL
chrome.runtime.sendMessage({ action: 'getCurrentTabUrl' }, function(response) {
  // Receives the current tab's URL from the runtime's response
  const currentUrl = response.url;
  // Calls the function to fetch 2FA support for the received URL
  fetch2FASupport(currentUrl);
});
