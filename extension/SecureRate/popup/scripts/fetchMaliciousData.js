// Initialize a global array to hold the list of malicious websites if it doesn't already exist
if (typeof maliciousWebsites === 'undefined') {
  var maliciousWebsites = [];
}

// Immediately fetch malicious URLs upon script execution
fetchMaliciousURLs();
// Set an interval to re-fetch the malicious URLs every 12 hours (43200000 milliseconds)
setInterval(fetchMaliciousURLs, 43200000);

/**
 * Asynchronously fetches a list of malicious URLs from a predefined remote source and stores it in the global array.
 * @returns {Promise<void>} A promise that resolves when the list is successfully fetched and stored.
 */
async function fetchMaliciousURLs() {
  let hasError = false; // Initialize a flag to track if an error has been encountered

  try {
    // Make a request to the remote source to get the list of malicious URLs
    const response = await fetch("https://malware-filter.gitlab.io/malware-filter/urlhaus-filter-online.txt");

    // Check if the request was not successful
    if (!response.ok) {
      // If there's an error, such as the server responding with a status code outside the 200 range
      // Uncomment the line below to log the error to the console
      // console.error(`Failed to fetch malicious URLs: ${response.status} ${response.statusText}`);
      return; // Exit the function early if there's a response error
    }

    // Convert the response text into an array of URLs or IP addresses
    const text = await response.text();
    maliciousWebsites = text
      .split("\n") // Split the text by new lines to create an array
      .filter((entry) => entry.trim() !== "") // Remove any empty lines
      .map((entry) => {
        try {
          // Check if the entry is an IP address using a regular expression
          if (/^(\d{1,3}\.){3}\d{1,3}$/.test(entry)) {
            return entry; // Return the IP address as is
          }
          // Otherwise, parse the entry as a URL and extract the hostname
          return new URL(`http://${entry}`).hostname;
        } catch (e) {
          // If an error occurs during URL parsing, handle it here
          if (!hasError) {
            // Log the error only once instead of for every failure
            hasError = true;
            // Uncomment the line below to log the error to the console
            // console.error(`Error parsing URL entry: ${e.message}`);
          }
          return null; // Return null for entries that couldn't be parsed
        }
      })
      .filter((hostnameOrIP) => hostnameOrIP !== null); // Filter out any null entries resulting from parse errors

    // If you want to see the list of malicious websites and IPs in the console, uncomment the line below
    // console.log("Malicious websites and IPs list:", maliciousWebsites);
  } catch (e) {
    // Catch and handle any errors that occur during the fetch operation
    // Uncomment the line below to log any fetch errors to the console
    // console.error(`Error fetching malicious URLs: ${e}`);
  }
}
