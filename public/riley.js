// Riley AI Chatbot — embed script for external websites.
// Usage: <script src="https://ruufpro.com/riley.js" data-contractor-id="YOUR_ID"></script>
// Optional: data-accent-color="#D4880F" to match your brand color.
// Creates a floating chat bubble in the bottom-right corner.

(function () {
  var script = document.currentScript;
  var contractorId = script && script.getAttribute("data-contractor-id");
  if (!contractorId) {
    console.warn("Riley: missing data-contractor-id attribute");
    return;
  }

  var rawColor = script.getAttribute("data-accent-color") || "#6366f1";
  var accentColor = /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : "#6366f1";
  var host = script.src.replace(/\/riley\.js.*$/, "");
  var isOpen = false;

  // Create bubble
  var bubble = document.createElement("div");
  bubble.id = "riley-bubble";
  bubble.setAttribute("aria-label", "Chat with Riley");
  bubble.innerHTML = "💬";
  bubble.style.cssText =
    "position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;" +
    "background:" + accentColor + ";color:#fff;display:flex;align-items:center;justify-content:center;" +
    "font-size:24px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:99999;" +
    "transition:transform 0.2s;";
  bubble.onmouseenter = function () { bubble.style.transform = "scale(1.1)"; };
  bubble.onmouseleave = function () { bubble.style.transform = "scale(1)"; };

  // Create iframe container
  var container = document.createElement("div");
  container.id = "riley-container";
  container.style.cssText =
    "position:fixed;bottom:88px;right:20px;width:380px;height:520px;" +
    "border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.12);" +
    "z-index:99998;display:none;border:1px solid #e5e7eb;";

  var iframe = document.createElement("iframe");
  iframe.src = host + "/chat/" + contractorId;
  iframe.style.cssText = "width:100%;height:100%;border:none;";
  iframe.allow = "clipboard-write";
  container.appendChild(iframe);

  // Toggle
  bubble.onclick = function () {
    isOpen = !isOpen;
    container.style.display = isOpen ? "block" : "none";
    bubble.innerHTML = isOpen ? "✕" : "💬";
    bubble.style.fontSize = isOpen ? "20px" : "24px";
  };

  document.body.appendChild(container);
  document.body.appendChild(bubble);
})();
