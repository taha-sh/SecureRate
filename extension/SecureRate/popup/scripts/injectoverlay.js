chrome.storage.local.get("overlayEnabled", function (data) {
  if (data.overlayEnabled) {
      document.addEventListener("DOMContentLoaded", function () {
          console.log("DOMContentLoaded event fired in injectoverlay.js");

          // Initialize overlay
          let overlay = document.getElementById("my-extension-overlay");
          if (!overlay) {
              overlay = document.createElement("div");
              overlay.id = "my-extension-overlay";
              overlay.style.position = "fixed";
              overlay.style.top = "0";
              overlay.style.right = "0";
              overlay.style.zIndex = "9999";
              overlay.style.backgroundColor = "#fff";
              overlay.style.color = "#000";
              overlay.style.padding = "10px";
              overlay.style.border = "1px solid #ccc";
              overlay.style.borderRadius = "5px";
              document.body.appendChild(overlay);
          }

          overlay.innerHTML = "Loading...";

          // Analyze the website
          const currentUrl = window.location.href;
          setTimeout(async () => {
              const grade = await analyzeWebsite(currentUrl);
              updateOverlay(grade, getColorForGrade(grade));
          }, 250);
      });

      // Listen for messages from popup to toggle overlay
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if (request.action === "toggleOverlay") {
              const overlay = document.getElementById("my-extension-overlay");
              if (overlay) {
                  overlay.style.display = request.overlayEnabled ? "block" : "none";
              }
          }
      });
  }
});

async function analyzeWebsite(inputUrl) {
    console.log("Starting website analysis...");
  
    const url = new URL(inputUrl);
    let isPhishingWebsite = false;
    let isMaliciousWebsite = false;
    let gradePoints = 0;
    let maxGradePoints = 5;
  
    let isBreached = await new Promise((resolve) => {
      const checkBreachedStatus = setInterval(() => {
        chrome.runtime.sendMessage({ action: 'getBreached' }, function(response) {
          if (response.value !== null) {
            clearInterval(checkBreachedStatus);
            resolve(response.value);
          }
        });
      }, 500); // Check every 500 milliseconds
    });
  
    if (isBreached) {
      console.log("The website has been breached before.");
      gradePoints--;
    }
  
    if (url.protocol === "https:") {
      console.log("Website uses HTTPS.");
      gradePoints++;
    } else {
      console.log("Website does not use HTTPS.");
      gradePoints--;
    }
  
    const supports2FA = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'get2FASupport' }, function(response) {
        if (response && typeof response.value !== 'undefined') {
          resolve(response.value);
        } else {
          console.log("No or incomplete response received for 2FA support.");
          resolve(null);
        }
      });
    });
    
    if (supports2FA === 'enabled') {
      gradePoints++;
    } else if (supports2FA === 'disabled') {
      gradePoints--;
    }

    const hasDNSSEC = await checkDNSSEC(url.hostname);
    if (hasDNSSEC) {
      console.log("Website has DNSSEC.");
      gradePoints++;
    }
  
    if (
      window.phishingWebsites && 
      (window.phishingWebsites.includes(url.hostname) ||
      window.phishingWebsites.includes(url.host))
    ) {
      console.log("Website is a phishing website.");
      isPhishingWebsite = true;
    } else {
      gradePoints++;
    }
    
    if (
      window.maliciousWebsites &&
      (window.maliciousWebsites.includes(url.hostname) ||
      window.maliciousWebsites.includes(url.host))
    ) {
      console.log("Website is a malicious website.");
      isMaliciousWebsite = true;
    } else {
      gradePoints++;
    }
  
    let grade;
    if (isPhishingWebsite) {
      grade = "E";
    } else if (isMaliciousWebsite) {
      grade = "D";
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
  
    console.log(`Final grade for the website is: ${grade}`);
    return grade;
  }
  

function getColorForGrade(grade) {
  switch (grade) {
      case "A":
          return "#256720";
      case "B":
          return "#256720";
      case "C":
          return "#FF6800";
      case "D":
          return "#FFA500";
      case "E":
      default:
          return "#FF0000";
  }
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

function updateOverlay(grade, color) {
  const gradeSpan = document.createElement("span");
  gradeSpan.style.color = color;
  gradeSpan.innerText = grade;

  const overlay = document.getElementById("my-extension-overlay");
  overlay.innerHTML = "Security Grade: ";
  overlay.appendChild(gradeSpan);

  overlay.onclick = function () {
      overlay.style.opacity = overlay.style.opacity !== "0.5" ? "0.5" : "1";
  };

  overlay.ondblclick = function () {
      overlay.style.display =
          overlay.style.display !== "none" ? "none" : "block";
  };
}
