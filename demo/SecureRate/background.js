/**
 * Listens to tab updates and executes a script when the tab is fully loaded.
 * @param {number} tabId - The ID of the updated tab.
 * @param {Object} changeInfo - An object containing information about the updated tab.
 * @param {string} changeInfo.status - The status of the updated tab.
 * @param {Object} tab - An object containing information about the updated tab.
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" && tab.url.includes("example.com")) {
    chrome.tabs.executeScript(tabId, { file: "popup/script.js" });
  }
});
