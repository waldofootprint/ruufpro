// RuufPro Embed Script
// Roofers paste this on their website:
// <script src="https://ruufpro.com/widget.js" data-contractor="abc123"></script>
//
// It creates an iframe that loads the estimate widget for their specific contractor.

(function () {
  // Find the script tag to read the contractor ID
  var scripts = document.getElementsByTagName("script");
  var currentScript = scripts[scripts.length - 1];
  var contractorId = currentScript.getAttribute("data-contractor");

  if (!contractorId) {
    console.error("RuufPro: Missing data-contractor attribute on script tag.");
    return;
  }

  // Determine the base URL (production or dev)
  var src = currentScript.getAttribute("src") || "";
  var baseUrl = src.includes("localhost")
    ? "http://localhost:3000"
    : "https://ruufpro.com";

  // Create the container
  var container = document.createElement("div");
  container.id = "ruufpro-widget";
  container.style.cssText = "width:100%;max-width:540px;margin:0 auto;";

  // Create the iframe
  var iframe = document.createElement("iframe");
  iframe.src = baseUrl + "/widget/" + contractorId;
  iframe.style.cssText =
    "width:100%;border:none;overflow:hidden;min-height:600px;border-radius:24px;";
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("title", "RuufPro Estimate Widget");

  // Auto-resize iframe to fit content
  window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "ruufpro-resize") {
      iframe.style.height = event.data.height + "px";
    }
  });

  container.appendChild(iframe);
  currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
})();
