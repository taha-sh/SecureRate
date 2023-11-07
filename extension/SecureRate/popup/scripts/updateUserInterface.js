/**
 * Updates the UI with the provided security information and recommendations.
 * Ensures the display of content is user-friendly and informative.
 * 
 * @param {URL} url - The URL of the website being analyzed.
 * @param {boolean} hasDNSSEC - Indicates the DNSSEC status.
 * @param {boolean} hasCookies - Indicates the cookie usage status.
 * @param {string} grade - The security grade of the website (A, B, C, D, or E).
 * @param {string[]} recommendations - Security improvement recommendations.
 * @param {boolean} isBreached - Indicates any known data breaches.
 * @param {string} supports2FA - The 2FA support status ('enabled', 'disabled', or 'unknown').
 */
function updateUI(url, hasDNSSEC, hasCookies, grade, recommendations, isBreached, supports2FA) {
  // Prepare UI to show loading indicators
  setInitialLoadingState();

  // Wait for 0.5 seconds to simulate a loading effect
  setTimeout(() => {
    // Update the UI elements with the security information
    updateGradeDisplay(grade);
    updateRecommendationsDisplay(recommendations);
    updateSecurityStatusDisplay(url, hasDNSSEC, hasCookies, isBreached, supports2FA);

    // Send the grade to the background process of the browser extension
    chrome.runtime.sendMessage({ grade: grade });

    // Log the 2FA status for debugging purposes
    console.log("2FA status in updateUserInterface.js:", supports2FA);
  }, 500);
}

/**
 * Sets initial content to indicate loading process on the UI elements.
 */
function setInitialLoadingState() {
  document.getElementById("score").textContent = "Loading...";
  document.getElementById("recommendations").textContent = "Loading recommendations...";
  document.getElementById("securityStatus").textContent = "Loading security status...";
}

/**
 * Updates the grade section in the UI with the security grade and appropriate color.
 * @param {string} grade - The security grade.
 */
function updateGradeDisplay(grade) {
  const gradeColor = getGradeColor(grade);
  document.getElementById("score").innerHTML = `<span class="grade" style="color:${gradeColor};">${grade}</span>`;
}

/**
 * Updates the recommendations section in the UI.
 * @param {string[]} recommendations - List of security recommendations.
 */
function updateRecommendationsDisplay(recommendations) {
  const recommendationsHTML = recommendations.map(r => `<li>${r}</li>`).join('');
  document.getElementById("recommendations").innerHTML =
    recommendations.length > 0
      ? `Here is some advice to improve your security: <ul>${recommendationsHTML}</ul>`
      : "Your security looks good!";
}

/**
 * Updates the security status section in the UI with properly formatted list items.
 * @param {URL} url - The analyzed website URL.
 * @param {boolean} hasDNSSEC - The DNSSEC status.
 * @param {boolean} hasCookies - The cookie usage status.
 * @param {boolean} isBreached - The data breach status.
 * @param {string} supports2FA - The 2FA support status.
 */
function updateSecurityStatusDisplay(url, hasDNSSEC, hasCookies, isBreached, supports2FA) {
  const securityStatusList = [
    `Phishing: ${getSecurityStatusHTML(!phishingWebsites.includes(url.hostname), 'Safe', 'Unsafe')}`,
    `Malicious: ${getSecurityStatusHTML(!maliciousWebsites.includes(url.hostname), 'Safe', 'Unsafe')}`,
    `SSL: ${getSecurityStatusHTML(url.protocol === "https:", 'Enabled', 'Disabled')}`,
    `DNSSEC: ${getSecurityStatusHTML(hasDNSSEC, 'Enabled', 'Disabled')}`,
    `Data Breach: ${getSecurityStatusHTML(!isBreached, 'No Issues Found', 'Confirmed')}`,
    `2FA: ${format2FAStatus(supports2FA)}`,
    `Cookies: ${hasCookies ? "Enabled" : "Disabled"}`
  ];
  document.getElementById("securityStatus").innerHTML = `Security Status: <ul>${securityStatusList.map(status => `<li>${status}</li>`).join("")}</ul>`;
}

/**
 * Returns a string with the security status wrapped in HTML with color coding.
 * @param {boolean} isSecure - Indicates if the status is secure.
 * @param {string} positive - The text to display if secure.
 * @param {string} negative - The text to display if not secure.
 * @returns {string} - HTML string representing the status.
 */
function getSecurityStatusHTML(isSecure, positive, negative) {
  const color = isSecure ? "green" : "red";
  const text = isSecure ? positive : negative;
  return `<span style="color:${color};">${text}</span>`;
}

/**
 * Formats the 2FA support status for display in the UI.
 * @param {string} supports2FA - The 2FA support status.
 * @returns {string} - Formatted HTML string with 2FA status and color.
 */
function format2FAStatus(supports2FA) {
  let text, color;
  switch (supports2FA) {
    case 'enabled':
      text = "Available";
      color = "green";
      break;
    case 'disabled':
      text = "Unavailable";
      color = "red";
      break;
    default:
      text = "Unknown";
      color = "grey";
  }
  return `<span style="color:${color};">${text}</span>`;
}

/**
 * Returns the hexadecimal color code based on the security grade.
 * @param {string} grade - The security grade.
 * @returns {string} - The color code for the grade.
 */
function getGradeColor(grade) {
  const colors = {
    'A': '#256720',
    'B': '#68A357',
    'C': '#FF6800',
    'D': '#FFA500',
    'E': '#FF0000',
  };
  return colors[grade] || '#000000'; // Default to black if grade is unrecognized
}
