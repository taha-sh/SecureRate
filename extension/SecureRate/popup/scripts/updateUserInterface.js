/**
 * Updates the UI with security information and recommendations.
 * @param {URL} url - The URL of the website being analyzed.
 * @param {boolean} hasDNSSEC - Indicates whether the website has DNSSEC enabled.
 * @param {boolean} hasCookies - Indicates whether the website uses cookies.
 * @param {string} grade - The security grade of the website (A, B, C, D, or E).
 * @param {string[]} recommendations - An array of recommendations to improve the website's security.
 * @param {boolean} isBreached - Indicates whether the website has been breached.
 */
function updateUI(url, hasDNSSEC, hasCookies, grade, recommendations, isBreached, supports2FA) {
  // Initially display "Loading..."
  console.log("2FA status in updateUserInterface.js:", supports2FA);
  document.getElementById("score").innerHTML = "Loading..";
  document.getElementById("recommendations").innerHTML = "Loading recommendations...";
  document.getElementById("securityStatus").innerHTML = "Loading security status...";

  // Introduce a delay using setTimeout
  setTimeout(() => {
    let gradeColor = "";
    switch (grade) {
      case "A":
        gradeColor = "#256720";
        break;
      case "B":
        gradeColor = "#256720";
        break;
      case "C":
        gradeColor = "#FF6800";
        break;
      case "D":
        gradeColor = "#FFA500";
        break;
      case "E":
        gradeColor = "#FF0000";
        break;
    }

  
    document.getElementById("score").innerHTML = `<span class="grade" style="color:${gradeColor};">${grade}</span>`;  
    chrome.runtime.sendMessage({ action: 'updateIcon', grade: grade });

    const recommendationsElement = document.getElementById("recommendations");
    const recommendationsList = recommendations.map((recommendation) => `<li>${recommendation}</li>`).join("");
    recommendationsElement.innerHTML = recommendationsList ? `Here is some advice to improve your security: <ul>${recommendationsList}</ul>` : "Your security looks good!";

    const securityStatusElement = document.getElementById("securityStatus");
    let securityStatusList = [
      `Phishing: ${!phishingWebsites.includes(url.hostname) ? '<span style="color:green;">Safe</span>' : '<span style="color:red;">Unsafe</span>'}`,
      `Malicious: ${!maliciousWebsites.includes(url.hostname) ? '<span style="color:green;">Safe</span>' : '<span style="color:red;">Unsafe</span>'}`,
      `SSL: <span style="color:${url.protocol === "https:" ? "green" : "red"}">${url.protocol === "https:" ? "Enabled" : "Disabled"}</span>`,
      `DNSSEC: <span style="color:${hasDNSSEC ? "green" : "red"}">${hasDNSSEC ? "Enabled" : "Disabled"}</span>`,
      `Data Breach: <span style="color:${isBreached ? "red" : "green"}">${isBreached ? "True" : "Untrue"}</span>`,
      `2FA: <span style="color:${supports2FA === null ? "grey" : (supports2FA === 'enabled' ? "green" : "red") }">${supports2FA === null ? "Unknown" : (supports2FA === 'enabled' ? "Available" : "Unavailable")}</span>`,
      `Cookies: ${hasCookies ? "Enabled" : "Disabled"}`
      
    ];
    console.log("Updating UI with 2FA support:", supports2FA);
    securityStatusElement.innerHTML = `Security Status: <ul>${securityStatusList.map((status) => `<li>${status}</li>`).join("")}</ul>`;
  }, 500);  // Wait for 0.5 seconds before updating UI
}

