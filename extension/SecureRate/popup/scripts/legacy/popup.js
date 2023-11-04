// Sample data for demonstration purposes
const sampleScore = "85/100";
const sampleRecommendations = [
  "This site is fairly secure!",
  "You can still improve your security by using a password manager or a strong password.",
];

// Create a div element to hold the score
const scoreDiv = document.createElement("div");
scoreDiv.style.position = "fixed";
scoreDiv.style.bottom = "10px";
scoreDiv.style.left = "50%";
scoreDiv.style.marginLeft = "-25px"; // Half of the width to center the div
scoreDiv.style.zIndex = "9999";
scoreDiv.style.backgroundColor = "#f1f1f1";
scoreDiv.style.border = "1px solid #d4d4d4";
scoreDiv.style.borderRadius = "4px";
scoreDiv.style.padding = "8px";
scoreDiv.style.width = "50px";
scoreDiv.style.textAlign = "center";

// Set the score text
scoreDiv.innerHTML = sampleScore;

// Create a tooltip for advice
const tooltip = document.createElement("span");
tooltip.style.visibility = "hidden";
tooltip.style.width = "200px";
tooltip.style.backgroundColor = "#2E8B57"; // SeaGreen color for background
tooltip.style.color = "#FFFFFF"; // White text
tooltip.style.textAlign = "center";
tooltip.style.borderRadius = "10px"; // Rounded corners
tooltip.style.padding = "10px"; // Padding around text
tooltip.style.position = "absolute";
tooltip.style.zIndex = "1";
tooltip.style.bottom = "125%";
tooltip.style.left = "50%";
tooltip.style.marginLeft = "-100px"; // Center the tooltip
tooltip.style.opacity = "0";
tooltip.style.transition = "opacity 0.3s";
tooltip.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.2)"; // Shadow for depth
tooltip.innerHTML = sampleRecommendations.join("<br>"); // Recommendations as inner HTML

// Show tooltip on hover
scoreDiv.onmouseover = function () {
  tooltip.style.visibility = "visible";
  tooltip.style.opacity = "1";
};

// Hide tooltip when not hovering
scoreDiv.onmouseout = function () {
  tooltip.style.visibility = "hidden";
  tooltip.style.opacity = "0";
};

// Append tooltip and score to the div
scoreDiv.appendChild(tooltip);

// Append the div to the body
document.body.appendChild(scoreDiv);
