/**
 * Analyzes a website and provides a grade and recommendations based on security criteria.
 * @async
 * @param {string} inputUrl - The URL of the website to analyze.
 * @returns {void}
 */
async function analyzeWebsite(inputUrl) {
  // Parse the URL from the input to access different parts of it easily
  const url = new URL(inputUrl);
  // List of restricted protocols and resource identifiers
  const restrictedPatterns = [
    'chrome://',
    'chrome-extension://',
    'https://chrome.google.com/webstore/',
    'chrome-error://',
    'edge://',
    'about:',
    'brave://',
    'opera://',
    'vivaldi://',
    'moz-extension://'
  ];
  // Check if the URL is in the restricted patterns list
  if (restrictedPatterns.some(pattern => url.href.startsWith(pattern))) {
    console.log('analyzeWebsite: URL is restricted and will not be analyzed:', url.href);
    return; // Return early since the URL is restricted
  }

  
  // Initialize variables to keep track of website status and recommendations
  let isPhishingWebsite = false;
  let isMaliciousWebsite = false;
  let gradePoints = 0;
  let maxGradePoints = 5;
  let positiveRecommendations = [];
  let negativeRecommendations = [];

  // Check if the website has been breached before
  let isBreached = await new Promise((resolve) => {
      // Repeatedly send messages to check breach status every 500ms
      const checkBreachedStatus = setInterval(() => {
          chrome.runtime.sendMessage({ action: 'getBreached' }, function(response) {
              // Once a response is received, clear the interval and resolve the promise
              if (response.value !== null) {
                  clearInterval(checkBreachedStatus);
                  resolve(response.value);
              }
          });
      }, 500);
  });

  // Based on breach status, update grade points and recommendations
  if (isBreached) {
      gradePoints--;
      negativeRecommendations.push(
          '<span style="color:orange; font-weight:bold;">This site has been breached in the past and sensitive information was stolen. Be cautious while entering any personal information.</span>'
      );
  } else {
      positiveRecommendations.push("Be suspicious of anything that looks out of place on this site.");
  }
  
  // Check if the website uses HTTPS and update grade points and recommendations accordingly
  if (url.protocol === "https:") {
      gradePoints++;
      positiveRecommendations.push("Always check for the lock icon in the address bar to ensure that the site is secure.");
  } else {
      gradePoints--;
      negativeRecommendations.push("This site is not secure. Do not put sensitive information on this site.");
  }
  
  // Check if the website has DNSSEC enabled
  const hasDNSSEC = await checkDNSSEC(url.hostname);
  if (hasDNSSEC) {
      gradePoints++;
      positiveRecommendations.push(
          "This site has DNSSEC enabled, which adds an extra layer of trust. Be aware that this does not mean the site is secure."
      );
  } else {
      negativeRecommendations.push(
          "Be aware of phishing sites that may look like this site."
      );
  }
  
  // Check if the website has cookies
  const hasCookies = await new Promise((resolve, reject) => {
      try {
          // Get all cookies on the given URL
          chrome.cookies.getAll({ url: inputUrl }, function(cookies) {
            chrome.runtime.sendMessage({ action: "checkCookies", url: window.location.href }, function(response) {
                console.log("Cookies response:", response);
              });
              
              // Check for errors and reject the promise if found
              if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
              } else {
                  // If there are cookies, resolve the promise as true
                  resolve(cookies.length > 0);
              }
          });
      } catch (error) {
          // If there's an exception during the process, log the error and reject the promise
          reject(error);
      }
  }).catch(error => {
      // Handle the rejected promise from the cookies check
      console.error("An error occurred while checking for cookies:", error);
  });

  if (hasCookies) {
      positiveRecommendations.push("Make sure to use different passwords on different websites.");
  } else {
      negativeRecommendations.push("Use different passwords on this website.");
  }
  
  // Check if the website is on a list of known phishing websites
  if (phishingWebsites.includes(url.hostname) || phishingWebsites.includes(url.host)) {
      negativeRecommendations.push("This site is a phishing site. Do not enter any information on this site.");
      isPhishingWebsite = true;
  } else {
      gradePoints++;
  }
  
  // Check if the website is on a list of known malicious websites
  if (maliciousWebsites.includes(url.hostname) || maliciousWebsites.includes(url.host)) {
      negativeRecommendations.push("This site is a malicious site. Be cautious and do not enter any sensitive information.");
      isMaliciousWebsite = true;
  } else {
      gradePoints++;
  }

  // Check if the website supports 2-Factor Authentication (2FA)
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
  
  // Update grade points based on 2FA support
  if (supports2FA === 'enabled') {
      gradePoints++;
      positiveRecommendations.push("This site supports 2FA, which adds an extra layer of security.");
  } else if (supports2FA === 'disabled') {
      gradePoints--;
      negativeRecommendations.push("This site does not support 2FA. Be cautious while entering any personal information.");
  }
  
  // Determine the final grade of the website
  let grade;
  if (isPhishingWebsite) {
      grade = "E";
      negativeRecommendations = [
          '<span style="color:red; font-weight:bold;">Be cautious! This website is on a list of known phishing sites. Do not enter any information here and leave immediately.</span>',
      ];
  } else if (isMaliciousWebsite) {
      grade = "D";
      negativeRecommendations = [
          '<span style="color:orange; font-weight:bold;">Warning! This website is on a list of potentially malicious sites. Be careful and avoid entering sensitive information.</span>',
      ];
  } else {
      // Calculate the grade percentage based on points
      const gradePercent = (gradePoints / maxGradePoints) * 100;
      // Assign a grade based on the calculated percentage
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

  // Combine and limit the number of recommendations
  const combinedRecommendations = negativeRecommendations.concat(positiveRecommendations);
  const limitedRecommendations = combinedRecommendations.slice(0, 3);

  // Update the UI with the results and store the grade
  updateUI(url, hasDNSSEC, hasCookies, grade, limitedRecommendations, isBreached, supports2FA);
  chrome.runtime.sendMessage({ action: 'setGrade', value: grade });
  chrome.storage.local.set({ websiteGrade: grade }, function() {
      console.log('Grade saved to storage:', grade);
  });
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
