/**
 * Analyzes a website and provides a grade and recommendations based on security criteria.
 * @async
 * @param {string} inputUrl - The URL of the website to analyze.
 * @returns {void}
 */

async function analyzeWebsite(inputUrl) {
    const url = new URL(inputUrl);
    let isPhishingWebsite = false;
    let isMaliciousWebsite = false;
    let gradePoints = 0;
    let maxGradePoints = 5;
    let positiveRecommendations = [];
    let negativeRecommendations = [];

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
      gradePoints--;
      negativeRecommendations.push(
        console.log("The website has been breached before."),
        '<span style="color:orange; font-weight:bold;">This site has been breached in the past and sensitive information was stolen. Be cautious while entering any personal information.</span>'
      );
    } else {
      console.log("The website has not been breached before.");
      positiveRecommendations.push("Be suspicious of anything that looks out of place on this site.");
    }
  
    if (url.protocol === "https:") {
      gradePoints++;
      console.log("Website uses HTTPS.");
      positiveRecommendations.push("Always check for the lock icon in the address bar to ensure that the site is secure.");
    } else {
      gradePoints--;
      console.log("Website does not use HTTPS.");
      negativeRecommendations.push("This site is not secure. Do not put sensitive information on this site.");
    }
  
  
    const hasDNSSEC = await checkDNSSEC(url.hostname);
    if (hasDNSSEC) {
      gradePoints++;
      console.log("Website has DNSSEC enabled.");
      positiveRecommendations.push(
        "This site has DNSSEC enabled, which adds an extra layer of trust. Be aware that this does not mean the site is secure."
      );
    } else {
      console.log("Website does not have DNSSEC enabled.");
      negativeRecommendations.push(
        "Be aware of phishing sites that may look like this site."
      );
    }
  
    const hasCookies = await new Promise((resolve, reject) => {
      try {
        chrome.cookies.getAll({ url: inputUrl.url }, function(cookies) {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            resolve(cookies.length > 0);
          }
        });
      } catch (error) {
        console.error(error);
        reject(error);
      }
    }).catch(error => {
      console.error("An error occurred while checking for cookies:", error);
    });

    if (hasCookies) {
      console.log("Website has cookies.");
      positiveRecommendations.push(
          "Make sure to use different passwords on different websites."
      );
    } else {
      negativeRecommendations.push("Use different passwords on this website.");
    }
    
  
    if (
      phishingWebsites.includes(url.hostname) ||
      phishingWebsites.includes(url.host)
    ) {
      console.log("Website is a phishing website.");
      negativeRecommendations.push(
        "This site is a phishing site. Do not enter any information on this site."
      );
      isPhishingWebsite = true;
    } else {
      console.log("Website is not a phishing website.");
      gradePoints++;
    }
  
    if (
      maliciousWebsites.includes(url.hostname) ||
      maliciousWebsites.includes(url.host)
    ) {
      console.log("Website is a malicious website.");
      negativeRecommendations.push("This site is a malicious site. Be cautious and do not enter any sensitive information.");
      isMaliciousWebsite = true;
    } else {
      gradePoints++;
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
      positiveRecommendations.push("This site supports 2FA, which adds an extra layer of security.");
    } else if (supports2FA === 'disabled') {
      gradePoints--;
      negativeRecommendations.push("This site does not support 2FA. Be cautious while entering any personal information.");
    }
  
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

        
       

    // Combine and limit the recommendations
    const combinedRecommendations = negativeRecommendations.concat(positiveRecommendations);
    const limitedRecommendations = combinedRecommendations.slice(0, 3);

    updateUI(url, hasDNSSEC, hasCookies, grade, limitedRecommendations, isBreached, supports2FA);
    chrome.runtime.sendMessage({ action: 'setGrade', value: grade });
    chrome.storage.local.set({ websiteGrade: grade }, function() {
      console.log('Grade saved to storage:', grade);
    });
    
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


