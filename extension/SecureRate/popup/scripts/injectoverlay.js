// Check if the overlay feature is enabled and then perform the corresponding actions
chrome.storage.local.get("overlayEnabled", function (data) {
  if (data.overlayEnabled) {
    document.addEventListener("DOMContentLoaded", function () {
      console.log("DOMContentLoaded event fired in injectoverlay.js");

      // Attempt to get the overlay if it already exists in the document
      let overlay = document.getElementById("my-extension-overlay");
      
      // If it doesn't exist, create it and set its styles and attributes
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "my-extension-overlay";
        // Set a multitude of styles to ensure the overlay appears consistently
        Object.assign(overlay.style, {
          position: "fixed",
          top: "0",
          right: "0",
          zIndex: "9999",
          backgroundColor: "#fff",
          color: "#000",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "5px"
        });
        document.body.appendChild(overlay); // Append the newly created overlay to the body
      }

      // Set the overlay's content while data is being processed
      overlay.innerHTML = "Loading...";

      // Perform the website analysis after a slight delay to ensure it doesn't block the UI
      const currentUrl = window.location.href;
      setTimeout(async () => {
        const grade = await analyzeWebsite(currentUrl); // Analyze the current website
        updateOverlay(grade, getColorForGrade(grade));  // Update the overlay with the results
      }, 250);
    });

      // Listen for messages from the popup or other parts of the extension
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Respond to 'ping' messages to confirm the script is active
        if (request.action === 'ping') {
          sendResponse('pong');
        }

        // Respond to 'toggleOverlay' messages to toggle the overlay
        if (request.action === 'toggleOverlay') {
          const overlay = document.getElementById("my-extension-overlay");
          if (overlay) {
            // If the overlay exists, set its display style to 'none' to hide it
            overlay.style.display = request.overlayEnabled ? "block" : "none";
          }
        }
      }
    );
  }
});

// Function that analyzes the given URL to determine website security status
async function analyzeWebsite(inputUrl) {
  // Parse the URL and initialize analysis variables
  const url = new URL(inputUrl);
  let isPhishingWebsite = false;
  let isMaliciousWebsite = false;
  let gradePoints = 0;
  const maxGradePoints = 5;

  // Check if the website has been previously breached
  let isBreached = await new Promise((resolve) => {
    const checkBreachedStatus = setInterval(() => {
      chrome.runtime.sendMessage({ action: 'getBreached' }, function(response) {
        if (response.value !== null) {
          clearInterval(checkBreachedStatus); // Stop checking once a response is received
          resolve(response.value); // Resolve the promise with the response value
        }
      });
    }, 500); // Repeat check every 500ms
  });

  // Assign points and log results based on breach status
  if (isBreached) {
    gradePoints--;
    console.log("The website has been breached before.");
  } else {
    console.log("The website has not been breached before.");
  }

  // Check for secure (HTTPS) protocol usage and assign points accordingly
  if (url.protocol === "https:") {
    gradePoints++;
    console.log("Website uses HTTPS.");
  } else {
    gradePoints--;
    console.log("Website does not use HTTPS.");
  }

  // Check for DNSSEC status and assign points
  const hasDNSSEC = await checkDNSSEC(url.hostname);
  if (hasDNSSEC) {
    gradePoints++;
    console.log("Website has DNSSEC enabled.");
  } else {
    console.log("Website does not have DNSSEC enabled.");
  }

  // Check for phishing status and assign points
  if (window.phishingWebsites && (window.phishingWebsites.includes(url.hostname) || window.phishingWebsites.includes(url.host))) {
    isPhishingWebsite = true;
    console.log("Website is a phishing website.");
  } else {
    gradePoints++;
  }

  // Check for malicious website status and assign points
  if (window.maliciousWebsites && (window.maliciousWebsites.includes(url.hostname) || window.maliciousWebsites.includes(url.host))) {
    isMaliciousWebsite = true;
    console.log("Website is a malicious website.");
  } else {
    gradePoints++;
  }

  // Check if the website supports Two-Factor Authentication (2FA)
  const supports2FA = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'get2FASupport' }, function(response) {
      if (response && typeof response.value !== 'undefined') {
        resolve(response.value); // Resolve with the 2FA support status
      } else {
        console.log("No or incomplete response received for 2FA support.");
        resolve(null);
      }
    });
  });

  // Assign points based on 2FA support
  if (supports2FA === 'enabled') {
    gradePoints++;
  } else if (supports2FA === 'disabled') {
    gradePoints--;
  }

  // Determine the final grade based on analysis results
  let grade;
  if (isPhishingWebsite) {
    grade = "E";
  } else if (isMaliciousWebsite) {
    grade = "D";
  } else {
    const gradePercent = (gradePoints / maxGradePoints) * 100;
    // Assign a letter grade based on the percentage of max points achieved
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

  console.log(`Final grade for the website is: ${grade}`);
  return grade;
}

// Function to determine color associated with a security grade
function getColorForGrade(grade) {
  switch (grade) {
    case "A":
      return "#256720"; // Green for good security
    case "B":
      return "#256720"; // Green, but a lower grade than A
    case "C":
      return "#FF6800"; // Orange for average security
    case "D":
      return "#FFA500"; // Darker orange for poor security
    case "E":
    default:
      return "#FF0000"; // Red for high risk or failed security
  }
}

// Function to update the overlay with the security grade and corresponding color
function updateOverlay(grade, color) {
  // Create a new span element to hold the grade
  const gradeSpan = document.createElement("span");
  gradeSpan.style.color = color; // Set the text color based on the grade
  gradeSpan.textContent = `Website Grade: ${grade}`; // Text content showing the grade

  const overlay = document.getElementById("my-extension-overlay");
  if (overlay) {
    overlay.innerHTML = ""; // Clear any previous content
    overlay.appendChild(gradeSpan); // Add the new grade information

    // Add a click event listener to make the overlay transparent
    overlay.onclick = function() {
      if (this.style.opacity === "0.5") {
        this.style.opacity = "1"; // If it's already transparent, clicking makes it opaque
      } else {
        this.style.opacity = "0.5"; // If it's opaque, clicking makes it transparent
      }
    };

    // Add a double-click event listener to remove the overlay
    overlay.ondblclick = function() {
      this.style.display = "none"; // Hide the overlay
    };
  }
}

/**
* Check if the provided domain has DNSSEC enabled.
* @param {string} domain - The domain to check.
* @returns {Promise<boolean>} - True if DNSSEC is enabled, false otherwise.
*/
async function checkDNSSEC(domain) {
  // Construct the URL to query DNS over HTTPS from Cloudflare
  const dnsQueryUrl = `https://mozilla.cloudflare-dns.com/dns-query?name=${domain}&type=A`;
  // Fetch the DNS response
  const response = await fetch(dnsQueryUrl, {
      headers: {
          Accept: "application/dns-json",
      },
  });
  // Parse the response as JSON
  const data = await response.json();
  // Return the 'AD' flag which indicates if DNSSEC is enabled
  return data.AD;
}