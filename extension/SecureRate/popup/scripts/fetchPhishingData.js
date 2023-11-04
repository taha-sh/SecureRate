if (typeof phishingWebsites === 'undefined') {
  var phishingWebsites = [];
}

// Fetch phishing URLs every hour
fetchPhishingURLs();
setInterval(fetchPhishingURLs, 43200000);

/**
 * Fetches phishing URLs from a remote source and parses them into an array of hostnames and IPs.
 * @returns {Promise<void>} A Promise that resolves when the URLs have been fetched and parsed.
 */
async function fetchPhishingURLs() {
  let hasError = false; // Flag to track if an error has been logged
  try {
    const response = await fetch(
      "https://malware-filter.gitlab.io/malware-filter/phishing-filter.txt"
    );
    if (!response.ok) {
      // console.error(
      //  `Failed to fetch phishing URLs: ${response.status} ${response.statusText}`);
      return;
    }
    const text = await response.text();
    phishingWebsites = text
      .split("\n")
      .filter((entry) => entry.trim() !== "")
      .map((entry) => {
        try {
          if (/^(\d{1,3}\.){3}\d{1,3}$/.test(entry)) {
            return entry;
          }
          return new URL(`http://${entry}`).hostname;
        } catch (e) {
          if (!hasError) {
            hasError = true; // Set the flag to true after logging the error once
          }
          return null;
        }
      })
      .filter((hostnameOrIP) => hostnameOrIP !== null);
    // console.log("Phishing websites and IPs list:", phishingWebsites);
  } catch (e) {
    // console.error(`Error fetching phishing URLs: ${e}`);
  }
}