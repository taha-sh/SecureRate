document.addEventListener("DOMContentLoaded", function() {
  const contentHeight = document.getElementById('popup-content').scrollHeight;
  document.body.style.height = contentHeight + "px";
});

// Sample data for demonstration purposes
const sampleScore = "85/100";
const sampleRecommendations = [
  "Enable two-factor authentication if available.",
  "Use a password manager or a strong password.",
  "Use a VPN when connecting to public Wi-Fi.",
];
const sampleAdditionalInfo = "Last checked: 30 minutes ago.";
// Function to update the security score
function updateScore() {
  const scoreElement = document.getElementById("score");
  scoreElement.innerHTML = `Your current security score is: <strong>${sampleScore}</strong>`;
}

// Function to update the recommendations
/**
 * Updates the recommendations element with a list of sample recommendations to improve security.
 * @function
 * @returns {void}
 */
function updateRecommendations() {
  const recommendationsElement = document.getElementById("recommendations");
  let recommendationsList = "<ul>";
  sampleRecommendations.forEach((recommendation) => {
    recommendationsList += `<li>${recommendation}</li>`;
  });
  recommendationsList += "</ul>";
  recommendationsElement.innerHTML = `Here are some recommendations to improve your security: ${recommendationsList}`;
}


// Function to update additional information
function updateAdditionalInfo() {
  const additionalInfoElement = document.getElementById("additional-info");
  additionalInfoElement.innerHTML = sampleAdditionalInfo;
}

// Function to initialize the page
function init() {
  updateScore();
  updateRecommendations();
  updateAdditionalInfo();
}

// Initialize the page when the document is ready
document.addEventListener("DOMContentLoaded", init);

const unirest = require("unirest");
const cheerio = require("cheerio");

const getOrganicData = () => {
  return unirest
    .get("https://www.google.com/search?q=javascript&gl=us&hl=en")
    .headers({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36",
    })
    .then((response) => {
      let $ = cheerio.load(response.body);

      let titles = [];
      let links = [];
      let snippets = [];
      let displayedLinks = [];

      $(".yuRUbf > a > h3").each((i, el) => {
        titles[i] = $(el).text();
      });
      $(".yuRUbf > a").each((i, el) => {
        links[i] = $(el).attr("href");
      });
      $(".g .VwiC3b ").each((i, el) => {
        snippets[i] = $(el).text();
      });
      $(".g .yuRUbf .NJjxre .tjvcx").each((i, el) => {
        displayedLinks[i] = $(el).text();
      });

      const organicResults = [];

      for (let i = 0; i < titles.length; i++) {
        organicResults[i] = {
          title: titles[i],
          links: links[i],
          snippet: snippets[i],
          displayedLink: displayedLinks[i],
        };
      }
      console.log(organicResults)
    });
};

getOrganicData();
