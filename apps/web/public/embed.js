(function () {
  "use strict";

  if (window.__NzoAIWidgetInitialized) return;
  window.__NzoAIWidgetInitialized = true;

  // Determine script origin as default baseUrl
  var currentScript = document.currentScript;
  var scriptSrc = currentScript ? currentScript.src : "";
  var defaultBaseUrl = "";
  if (scriptSrc) {
    try {
      var urlObj = new URL(scriptSrc);
      defaultBaseUrl = urlObj.origin;
    } catch (e) {}
  }
  if (!defaultBaseUrl) {
    defaultBaseUrl = window.location.origin;
  }

  // Parse config from data attributes or global window.NzoAIWidget.config
  var dataElem = document.querySelector("[data-nzoai-embed-token]");
  var config = (window.NzoAIWidget && window.NzoAIWidget.config) || {};

  if (dataElem) {
    config.embedToken = config.embedToken || dataElem.getAttribute("data-nzoai-embed-token");
    config.baseUrl = config.baseUrl || dataElem.getAttribute("data-nzoai-base-url");
    config.mode = config.mode || dataElem.getAttribute("data-nzoai-mode");
    config.position = config.position || dataElem.getAttribute("data-nzoai-position");
    config.bubbleSize = config.bubbleSize || dataElem.getAttribute("data-nzoai-bubble-size");
    config.autoOpen = config.autoOpen || dataElem.getAttribute("data-nzoai-auto-open") === "true";
  }

  config.baseUrl = config.baseUrl || defaultBaseUrl;
  config.mode = config.mode || "bubble"; // 'bubble' or 'iframe'
  config.position = config.position || "bottom-right";
  config.bubbleSize = config.bubbleSize || "medium";

  if (!config.embedToken) {
    console.warn("[NzoAI] No embedToken specified for widget initialization.");
    return;
  }

  var isOpen = false;
  var container = null;
  var bubbleButton = null;
  var iframe = null;

  function getDimensions() {
    switch (config.bubbleSize) {
      case "small":
        return 50;
      case "large":
        return 70;
      case "medium":
      default:
        return 60;
    }
  }

  function createBubbleWidget() {
    var size = getDimensions();
    var isRight = config.position.includes("right");
    var isBottom = config.position.includes("bottom");

    // Container
    container = document.createElement("div");
    container.id = "nzoai-widget-container";
    container.style.position = "fixed";
    container.style.zIndex = "999999";
    container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    container.style[isBottom ? "bottom" : "top"] = "20px";
    container.style[isRight ? "right" : "left"] = "20px";

    // Launcher button
    bubbleButton = document.createElement("button");
    bubbleButton.id = "nzoai-launcher-btn";
    bubbleButton.setAttribute("aria-label", "Open Chat Support");
    bubbleButton.style.width = size + "px";
    bubbleButton.style.height = size + "px";
    bubbleButton.style.borderRadius = "50%";
    bubbleButton.style.backgroundColor = "#800020";
    bubbleButton.style.border = "none";
    bubbleButton.style.boxShadow = "0 4px 14px rgba(0, 0, 0, 0.25)";
    bubbleButton.style.cursor = "pointer";
    bubbleButton.style.display = "flex";
    bubbleButton.style.alignItems = "center";
    bubbleButton.style.justifyContent = "center";
    bubbleButton.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
    bubbleButton.style.padding = "0";

    bubbleButton.innerHTML =
      '<svg id="nzoai-icon-chat" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>' +
      "</svg>" +
      '<svg id="nzoai-icon-close" style="display:none;" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<line x1="18" y1="6" x2="6" y2="18"></line>' +
      '<line x1="6" y1="6" x2="18" y2="18"></line>' +
      "</svg>";

    bubbleButton.addEventListener("mouseenter", function () {
      bubbleButton.style.transform = "scale(1.06)";
    });
    bubbleButton.addEventListener("mouseleave", function () {
      bubbleButton.style.transform = "scale(1)";
    });

    // Iframe container
    var iframeWrapper = document.createElement("div");
    iframeWrapper.id = "nzoai-iframe-wrapper";
    iframeWrapper.style.position = "fixed";
    iframeWrapper.style[isBottom ? "bottom" : "top"] = size + 35 + "px";
    iframeWrapper.style[isRight ? "right" : "left"] = "20px";
    iframeWrapper.style.width = "400px";
    iframeWrapper.style.maxWidth = "calc(100vw - 40px)";
    iframeWrapper.style.height = "640px";
    iframeWrapper.style.maxHeight = "calc(100vh - 120px)";
    iframeWrapper.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.2)";
    iframeWrapper.style.borderRadius = "16px";
    iframeWrapper.style.overflow = "hidden";
    iframeWrapper.style.display = "none";
    iframeWrapper.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    iframeWrapper.style.zIndex = "999998";

    // Iframe
    iframe = document.createElement("iframe");
    var parentHost = encodeURIComponent(window.location.origin);
    iframe.src = config.baseUrl + "/bubble/" + config.embedToken + "?origin=" + parentHost;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.setAttribute("allow", "microphone; camera");

    iframeWrapper.appendChild(iframe);
    container.appendChild(bubbleButton);
    document.body.appendChild(container);
    document.body.appendChild(iframeWrapper);

    function toggleChat() {
      isOpen = !isOpen;
      var chatIcon = document.getElementById("nzoai-icon-chat");
      var closeIcon = document.getElementById("nzoai-icon-close");

      if (isOpen) {
        iframeWrapper.style.display = "block";
        if (chatIcon) chatIcon.style.display = "none";
        if (closeIcon) closeIcon.style.display = "block";
        iframe.contentWindow.postMessage({ type: "nzoai:opened" }, "*");
      } else {
        iframeWrapper.style.display = "none";
        if (chatIcon) chatIcon.style.display = "block";
        if (closeIcon) closeIcon.style.display = "none";
        iframe.contentWindow.postMessage({ type: "nzoai:closed" }, "*");
      }
    }

    bubbleButton.addEventListener("click", toggleChat);

    // Listen for postMessage from widget iframe
    window.addEventListener("message", function (e) {
      if (!e.data) return;
      if (e.data.type === "nzoai-widget-toggle" || e.data.type === "nzoai:toggle") {
        toggleChat();
      } else if (e.data.type === "nzoai:set-color" && e.data.color) {
        bubbleButton.style.backgroundColor = e.data.color;
      }
    });

    if (config.autoOpen) {
      setTimeout(function () {
        if (!isOpen) toggleChat();
      }, config.openDelay || 2500);
    }
  }

  function createInlineWidget() {
    var target = document.getElementById(config.containerId || "nzoai-widget");
    if (!target) {
      console.warn("[NzoAI] Target container not found for inline mode.");
      return;
    }
    var parentHost = encodeURIComponent(window.location.origin);
    iframe = document.createElement("iframe");
    iframe.src = config.baseUrl + "/talk/" + config.embedToken + "?origin=" + parentHost;
    iframe.style.width = "100%";
    iframe.style.height = "700px";
    iframe.style.border = "1px solid #e4e4e7";
    iframe.style.borderRadius = "12px";
    target.appendChild(iframe);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      config.mode === "bubble" ? createBubbleWidget() : createInlineWidget();
    });
  } else {
    config.mode === "bubble" ? createBubbleWidget() : createInlineWidget();
  }

  window.NzoAIWidget = window.NzoAIWidget || {};
  window.NzoAIWidget.open = function () {
    if (!isOpen && bubbleButton) bubbleButton.click();
  };
  window.NzoAIWidget.close = function () {
    if (isOpen && bubbleButton) bubbleButton.click();
  };
  window.NzoAIWidget.init = function (newConfig) {
    Object.assign(config, newConfig);
  };
})();
