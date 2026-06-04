(function (global) {
  "use strict";

  function iconFor(toolId) {
    if (toolId === "json-diff") {
      return '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10M7 12h6M7 17h10M4 4v16M20 4v16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    }
    if (toolId === "timestamp") {
      return '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v5l3 2M4.5 5.5 7 3m12.5 2.5L17 3M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    }
    return '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H6a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function renderTools(tools) {
    var grid = DevKit.byId("tools");
    var shortcuts = DevKit.byId("shortcutList");
    var tagList = DevKit.byId("tagList");
    if (!grid || !shortcuts || !tagList) return;

    grid.innerHTML = tools.map(function (tool) {
      return [
        '<a class="tool-card" href="' + tool.href + '" data-name="' + DevKit.escapeHtml([tool.title, tool.description, tool.kind, tool.keywords, tool.tags.join(" ")].join(" ")) + '">',
        '<div class="tool-top">',
        '<span class="tool-icon">' + iconFor(tool.id) + '</span>',
        '<span class="tool-kind">' + DevKit.escapeHtml(tool.kind) + '</span>',
        '</div>',
        '<div>',
        '<h2>' + DevKit.escapeHtml(tool.title) + '</h2>',
        '<p>' + DevKit.escapeHtml(tool.description) + '</p>',
        '</div>',
        '<span class="tool-action"><span>打开工具</span><span>&rarr;</span></span>',
        '</a>'
      ].join("");
    }).join("");

    shortcuts.innerHTML = tools.map(function (tool) {
      return [
        '<a class="shortcut" href="' + tool.href + '">',
        '<span class="key">' + DevKit.escapeHtml(tool.shortcut) + '</span>',
        '<span><strong>' + DevKit.escapeHtml(tool.title) + '</strong><small>' + DevKit.escapeHtml(tool.longDescription) + '</small></span>',
        '<span class="arrow">&rarr;</span>',
        '</a>'
      ].join("");
    }).join("");

    var tags = [];
    tools.forEach(function (tool) {
      tool.tags.forEach(function (tag) {
        if (tags.indexOf(tag) === -1) tags.push(tag);
      });
    });
    tagList.innerHTML = tags.map(function (tag) {
      return '<span class="tag">' + DevKit.escapeHtml(tag) + '</span>';
    }).join("");
    var tagCount = DevKit.byId("tagCount");
    if (tagCount) tagCount.textContent = String(tags.length);
  }

  function initSearch() {
    var toolSearch = DevKit.byId("toolSearch");
    var emptyState = DevKit.byId("emptyState");
    var toolCount = DevKit.byId("toolCount");
    if (!toolSearch || !emptyState || !toolCount) return;

    function cards() {
      return Array.prototype.slice.call(global.document.querySelectorAll(".tool-card"));
    }

    function filterTools() {
      var q = toolSearch.value.trim().toLowerCase();
      var visible = 0;
      cards().forEach(function (card) {
        var match = card.dataset.name.toLowerCase().indexOf(q) !== -1;
        card.style.display = match ? "" : "none";
        if (match) visible += 1;
      });
      emptyState.classList.toggle("show", visible === 0);
      toolCount.textContent = visible + " tools";
    }

    toolSearch.addEventListener("input", filterTools);
    filterTools();

    global.document.addEventListener("keydown", function (event) {
      var target = event.target;
      var tagName = target && target.tagName;
      var isTyping = tagName === "INPUT" || tagName === "TEXTAREA" || (target && target.isContentEditable);
      var key = event.key.toLowerCase();
      var isSearchShortcut = (event.metaKey || event.ctrlKey) && key === "k";

      if (isSearchShortcut) {
        event.preventDefault();
        toolSearch.focus();
        toolSearch.select();
        return;
      }

      if (isTyping) return;
      DevKitTools.tools.forEach(function (tool) {
        if (key === tool.shortcut.toLowerCase()) {
          global.location.href = tool.href;
        }
      });
    });
  }

  function initCopyHub() {
    var button = DevKit.byId("copyHub");
    if (!button) return;
    button.addEventListener("click", function () {
      var url = new URL("index.html", global.location.href).href;
      DevKit.copyText(url, "已复制入口");
    });
  }

  function init() {
    renderTools(DevKitTools.tools);
    initSearch();
    initCopyHub();
  }

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
