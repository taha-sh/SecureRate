document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0] && tabs[0].url) {
      try {
        const currentUrl = new URL(tabs[0].url);
        analyzeWebsite(currentUrl);
      } catch (e) {
        console.error("Invalid URL:", e);
      }
    } else {
      console.error("No active tab or URL found.");
    }
  });

  // Fetch phishing URLs every hour
  fetchPhishingURLs();
  setInterval(fetchPhishingURLs, 43200000);
});

let phishingWebsites = [];

async function fetchPhishingURLs() {
  let hasError = false; // Flag to track if an error has been logged
  try {
    const response = await fetch(
      "https://malware-filter.gitlab.io/malware-filter/phishing-filter.txt"
    );
    if (!response.ok) {
      console.error(
        `Failed to fetch phishing URLs: ${response.status} ${response.statusText}`
      );
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
            console.error(`One or more invalid entries skipped.`);
            hasError = true; // Set the flag to true after logging the error once
          }
          return null;
        }
      })
      .filter((hostnameOrIP) => hostnameOrIP !== null);
    console.log("Phishing websites and IPs list:", phishingWebsites);
  } catch (e) {
    console.error(`Error fetching phishing URLs: ${e}`);
  }
}

// Fetch malicious URLs every hour
fetchMaliciousURLs();
setInterval(fetchMaliciousURLs, 43200000);

let maliciousWebsites = [];

async function fetchMaliciousURLs() {
  let hasError = false; // Flag to track if an error has been logged
  try {
    const response = await fetch(
      "https://malware-filter.gitlab.io/malware-filter/urlhaus-filter-online.txt"
    );
    if (!response.ok) {
      console.error(
        `Failed to fetch malicious URLs: ${response.status} ${response.statusText}`
      );
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
            console.error(`One or more invalid entries skipped.`);
            hasError = true; // Set the flag to true after logging the error once
          }
          return null;
        }
      })
      .filter((hostnameOrIP) => hostnameOrIP !== null);
    console.log("Malicious websites and IPs list:", maliciousWebsites);
  } catch (e) {
    console.error(`Error fetching malicious URLs: ${e}`);
  }
}

fetchBreachedSites();
setInterval(fetchBreachedSites, 43200000);

let breachedWebsites = [];

async function fetchBreachedSites() {
  let hasError = false; // Flag to track if an error has been logged
  try {
    const response = await fetch("https://haveibeenpwned.com/api/v3/breaches"); // Replace with the actual API endpoint if different
    if (!response.ok) {
      console.error(
        `Failed to fetch breached sites: ${response.status} ${response.statusText}`
      );
      return;
    }
    const data = await response.json();
    console.log("Received data from breached API:", data); // Debugging line
    breachedWebsites = data
      .map((entry) => {
        try {
          return entry.Domain; // Extracting the 'Domain' field from the JSON response
        } catch (e) {
          if (!hasError) {
            console.error(`One or more invalid entries skipped.`);
            hasError = true; // Set the flag to true after logging the error once
          }
          return null;
        }
      })
      .filter((domain) => domain !== null);
    console.log("Breached websites list:", breachedWebsites);
  } catch (e) {
    console.error(`Error fetching breached sites: ${e}`);
  }
}

/**
 * Analyzes a website and provides a grade and recommendations based on security criteria.
 * @async
 * @param {string} inputUrl - The URL of the website to analyze.
 * @returns {void}
 */
/**
 * Analyzes a website's security and provides a grade and recommendations.
 * @async
 * @param {string} inputUrl - The URL of the website to analyze.
 * @returns {void}
 */
async function analyzeWebsite(inputUrl) {
  const url = inputUrl;
  let isPhishingWebsite = false;
  let isMaliciousWebsite = false;
  let gradePoints = 0;
  let maxGradePoints = 4;
  let recommendations = [];

  if (url.protocol === "https:") {
    gradePoints++;
    recommendations.push(
      "Always check for the lock icon in the address bar to ensure that the site is secure."
    );
  } else {
    gradePoints--;
    recommendations.push(
      "This site is not secure. Do not put sensitive information on this site."
    );
  }

  const hasDNSSEC = await checkDNSSEC(url.hostname);
  if (hasDNSSEC) {
    gradePoints++;
    recommendations.push(
      "Make sure to use different passwords on different websites."
    );
  } else {
    gradePoints--;
    recommendations.push(
      "Be aware of phishing sites that may look like this site."
    );
  }

  const hasCookies = document.cookie ? true : false;
  if (hasCookies) {
    recommendations.push(
      "Make sure to use different passwords on different websites.."
    );
  } else {
    recommendations.push("Use different passwords on this website.");
  }

  if (
    phishingWebsites.includes(url.hostname) ||
    phishingWebsites.includes(url.host)
  ) {
    recommendations.push(
      "This site is a phishing site. Do not enter any information on this site."
    );
    isPhishingWebsite = true;
  } else {
    gradePoints++;
  }

  if (
    maliciousWebsites.includes(url.hostname) ||
    maliciousWebsites.includes(url.host)
  ) {
    recommendations.push("This site is a malicious site. Be cautious.");
    isMaliciousWebsite = true;
  } else {
    gradePoints++;
  }

  if (
    breachedWebsites.includes(url.hostname) ||
    breachedWebsites.includes(url.host)
  ) {
    //    gradePoints--;
    recommendations.push(
      "This site has been breached in the past. Be cautious while entering any personal information."
    );
  } else {
    recommendations.push(
      "Be suspicious of anything that looks out of place on this site."
    );
    //    gradePoints++;
  }

  let grade;
  if (isPhishingWebsite) {
    grade = "E";
    recommendations = [
      '<span style="color:red; font-weight:bold;">Be cautious! This website is on a list of known phishing sites. Do not enter any information here and leave immediately.</span>',
    ];
  } else if (isMaliciousWebsite) {
    grade = "D";
    recommendations = [
      '<span style="color:orange; font-weight:bold;">Warning! This website is on a list of potentially malicious sites. Be careful and avoid entering sensitive information.</span>',
    ];
  } else {
    const gradePercent = (gradePoints / maxGradePoints) * 100;
    if (gradePercent >= 75) {
      grade = "A";
    } else if (gradePercent >= 50) {
      grade = "B";
    } else if (gradePercent >= 25) {
      grade = "C";
    } else {
      grade = "D";
    }
  }

  updateUI(url, hasDNSSEC, hasCookies, grade, recommendations);
}

async function checkDNSSEC(domain) {
  const dnsQueryUrl = `https://mozilla.cloudflare-dns.com/dns-query?name=${domain}&type=A`;
  const response = await fetch(dnsQueryUrl, {
    headers: {
      Accept: "application/dns-json",
    },
  });
  const data = await response.json();
  return data.AD;
}

/**
 * Updates the UI with security information and recommendations.
 * @param {URL} url - The URL of the website being analyzed.
 * @param {boolean} hasDNSSEC - Indicates whether the website has DNSSEC enabled.
 * @param {boolean} hasCookies - Indicates whether the website uses cookies.
 * @param {string} grade - The security grade of the website (A, B, C, D, or E).
 * @param {string[]} recommendations - An array of recommendations to improve the website's security.
 */
function updateUI(url, hasDNSSEC, hasCookies, grade, recommendations) {
  let gradeColor = "";
  switch (grade) {
    case "A":
      gradeColor = "#256720";
      iconPath = "icons/icon-a.png"; //
      break;
    case "B":
      gradeColor = "#34DA29";
      iconPath = "icons/icon-b.png"; //
      break;
    case "C":
      gradeColor = "#EBC804";
      iconPath = "icons/icon-c.png"; //
      break;
    case "D":
      gradeColor = "#FFA500";
      iconPath = "icons/icon-d.png"; //
      break;
    case "E":
      gradeColor = "#FF0000";
      iconPath = "icons/icon-e.png"; //
      break;
  }

  // Set the extension icon

  document.getElementById(
    "score"
  ).innerHTML = `<span class="grade" style="color:${gradeColor};">${grade}</span>`;

  const recommendationsElement = document.getElementById("recommendations");
  const recommendationsList = recommendations
    .map((recommendation) => `<li>${recommendation}</li>`)
    .join("");
  recommendationsElement.innerHTML = recommendationsList
    ? `Here is some advice to improve your security: <ul>${recommendationsList}</ul>`
    : "Your security looks good!";

  const securityStatusElement = document.getElementById("securityStatus");
  let securityStatusList = [];
  securityStatusList.push(
    `Phishing: ${
      !phishingWebsites.includes(url.hostname)
        ? '<span style="color:green;">Safe</span>'
        : '<span style="color:red;">Unsafe</span>'
    }`
  );
  securityStatusList.push(
    `Malicious: ${
      !maliciousWebsites.includes(url.hostname)
        ? '<span style="color:green;">Safe</span>'
        : '<span style="color:red;">Unsafe</span>'
    }`
  );
  securityStatusList.push(
    `SSL: <span style="color:${url.protocol === "https:" ? "green" : "red"}">${
      url.protocol === "https:" ? "Enabled" : "Disabled"
    }</span>`
  );
  securityStatusList.push(
    `DNSSEC: <span style="color:${hasDNSSEC ? "green" : "red"}">${
      hasDNSSEC ? "Enabled" : "Disabled"
    }</span>`
  );
  securityStatusList.push(
    `Breached: ${
      !breachedWebsites.includes(url.hostname)
        ? '<span style="color:green;">Untrue</span>'
        : '<span style="color:red;">True</span>'
    }`
  );
  securityStatusList.push(`Cookies: ${hasCookies ? "Enabled" : "Disabled"}`);
  securityStatusElement.innerHTML = `Security Status: <ul>${securityStatusList
    .map((status) => `<li>${status}</li>`)
    .join("")}</ul>`;
}
