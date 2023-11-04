if (typeof maliciousWebsites === 'undefined') {
  var maliciousWebsites = [];
}

fetchMaliciousURLs();
setInterval(fetchMaliciousURLs, 43200000);


/**
 * Fetches a list of malicious URLs from a remote source and parses them into an array of hostnames and IP addresses.
 * @returns {Promise<void>} A Promise that resolves when the list has been fetched and parsed.
 */
async function fetchMaliciousURLs() {
  let hasError = false; // Flag to track if an error has been logged
  try {
    const response = await fetch(
      "https://malware-filter.gitlab.io/malware-filter/urlhaus-filter-online.txt"
    );
    if (!response.ok) {
      // console.error(
      //  `Failed to fetch malicious URLs: ${response.status} ${response.statusText}`
      // );
      return;
    }
    const text = await response.text();
    maliciousWebsites = text
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
    // console.log("Malicious websites and IPs list:", maliciousWebsites);
  } catch (e) {
    // console.error(`Error fetching malicious URLs: ${e}`);
  }
}