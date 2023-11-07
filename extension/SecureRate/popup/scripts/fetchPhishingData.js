// Check if the phishingWebsites array has been defined globally; if not, define it
if (typeof phishingWebsites === 'undefined') {
  var phishingWebsites = [];
}

// Immediately invoke the fetchPhishingURLs function upon script execution
fetchPhishingURLs();
// Set an interval to call fetchPhishingURLs every 12 hours (43200000 milliseconds)
setInterval(fetchPhishingURLs, 43200000);

/**
 * Fetches and processes a list of phishing URLs from a remote source, updating the global phishingWebsites array.
 * @returns {Promise<void>} A Promise that resolves once the URLs have been fetched and processed.
 */
async function fetchPhishingURLs() {
  let hasError = false; // Initialize a flag to indicate if an error occurs during execution

  try {
    // Perform a fetch request to retrieve the phishing URLs from a remote source
    const response = await fetch("https://malware-filter.gitlab.io/malware-filter/phishing-filter.txt");

    // Check if the fetch request did not succeed
    if (!response.ok) {
      // Uncomment to log an error with the response status and text if the request fails
      // console.error(`Failed to fetch phishing URLs: ${response.status} ${response.statusText}`);
      return; // Exit the function early in case of a failed request
    }

    // Convert the text response into a list by splitting the string at every new line
    const text = await response.text();
    phishingWebsites = text
      .split("\n") // Split the text content into an array, one entry per line
      .filter((entry) => entry.trim() !== "") // Remove any empty lines after trimming whitespace
      .map((entry) => {
        try {
          // Check if the entry is an IP address using a regular expression
          if (/^(\d{1,3}\.){3}\d{1,3}$/.test(entry)) {
            return entry; // If it's an IP address, return it as is
          }
          // If it's not an IP address, try to parse it as a URL to extract the hostname
          return new URL(`http://${entry}`).hostname;
        } catch (e) {
          // If an error occurs during parsing, check if an error has been logged already
          if (!hasError) {
            hasError = true; // Set the flag to true to avoid logging subsequent errors
            // Uncomment to log an error with the response status and text if the request fails
            // console.error(`Error parsing phishing URL entry: ${e.message}`);
          }
          return null; // Return null to indicate a failed parsing attempt
        }
      })
      .filter((hostnameOrIP) => hostnameOrIP !== null); // Remove any null entries resulting from failed parsing attempts

    // Log the updated list of phishing websites and IPs to the console
    console.log("Phishing websites and IPs list:", phishingWebsites);
  } catch (e) {
    // Catch any errors that occur during the fetch process and log them
    console.error(`Error fetching phishing URLs: ${e}`);
  }
}
