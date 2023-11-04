console.log("Script running");

var twoFACache = {};

function isIPAddress(str) {
  const regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  return regex.test(str);
}

async function fetch2FASupport(currentUrl) {
  console.log("fetch2FASupport called with URL:", currentUrl);

  try {
    const urlObj = new URL(currentUrl);
    let domain = urlObj.hostname;
    domain = domain.replace(/^www\./, "").replace(/^https?:\/\//, "");
    console.log("Parsed domain:", domain);

    if (isIPAddress(domain)) {
      console.log("Skipping IP address:", domain);
      return;
    }

    if (twoFACache.hasOwnProperty(domain)) {
      const status = twoFACache[domain];
      console.log("Cache hit for domain:", domain, "2FA Status:", status);
      chrome.runtime.sendMessage({ action: 'set2FASupport', value: status });
      return;
    }

    const apiUrl = `https://api.2fa.directory/v3/all.json`;
    console.log("Fetching data from API:", apiUrl);

    const response = await fetch(apiUrl);

    if (response.ok) {
      const data = await response.json();
      console.log("API response data:", data);

      const domainInfo = data.find(siteArray => siteArray[1].domain === domain);
      let status = 'unknown';

      if (domainInfo) {
        status = domainInfo[1].hasOwnProperty('tfa') ? 'enabled' : 'disabled';
      }

      console.log("2FA support check result:", status);

      twoFACache[domain] = status;
      localStorage.setItem('twoFACache', JSON.stringify(twoFACache));

      chrome.runtime.sendMessage({ action: 'set2FASupport', value: status });
    } else {
      console.error(`Failed to fetch 2FA support info: ${response.status} ${response.statusText}`);
    }
  } catch (e) {
    console.error("Error during 2FA check:", e);
  }
}

chrome.runtime.sendMessage({ action: 'getCurrentTabUrl' }, function(response) {
  const currentUrl = response.url;
  fetch2FASupport(currentUrl);
});
