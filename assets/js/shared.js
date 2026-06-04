(function (global) {
  "use strict";

  function byId(id) {
    return global.document ? global.document.getElementById(id) : null;
  }

  function showToast(message) {
    var toast = byId("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    global.clearTimeout(showToast.timer);
    showToast.timer = global.setTimeout(function () {
      toast.classList.remove("show");
    }, 1400);
  }

  function setStatus(element, message, isError) {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("error", Boolean(isError));
  }

  function copyText(text, successMessage) {
    if (!text) return Promise.resolve(false);
    if (!global.navigator || !global.navigator.clipboard) {
      showToast("浏览器限制了复制权限");
      return Promise.resolve(false);
    }
    return global.navigator.clipboard.writeText(text).then(function () {
      showToast(successMessage || "已复制");
      return true;
    }).catch(function () {
      showToast("浏览器限制了复制权限");
      return false;
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  var api = {
    byId: byId,
    showToast: showToast,
    setStatus: setStatus,
    copyText: copyText,
    escapeHtml: escapeHtml
  };

  global.DevKit = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports.DevKit = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
