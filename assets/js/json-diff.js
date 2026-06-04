(function (global) {
  "use strict";

  function describeValue(value) {
    var json = JSON.stringify(value);
    return typeof json === "undefined" ? String(value) : json;
  }

  function appendObjectPath(prefix, key) {
    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
      return prefix + "." + key;
    }
    return prefix + "[" + JSON.stringify(key) + "]";
  }

  function flattenJson(value, prefix, output) {
    var path = prefix || "$";
    var acc = output || {};

    if (Array.isArray(value)) {
      if (value.length === 0) {
        acc[path] = describeValue(value);
        return acc;
      }
      value.forEach(function (child, index) {
        flattenJson(child, path + "[" + index + "]", acc);
      });
      return acc;
    }

    if (value && typeof value === "object") {
      var keys = Object.keys(value).sort();
      if (keys.length === 0) {
        acc[path] = describeValue(value);
        return acc;
      }
      keys.forEach(function (key) {
        flattenJson(value[key], appendObjectPath(path, key), acc);
      });
      return acc;
    }

    acc[path] = describeValue(value);
    return acc;
  }

  function diffJson(leftValue, rightValue) {
    var left = flattenJson(leftValue);
    var right = flattenJson(rightValue);
    var keys = Object.keys(left).concat(Object.keys(right)).sort();
    var seen = {};
    var result = [];

    keys.forEach(function (key) {
      if (seen[key]) return;
      seen[key] = true;

      if (!(key in left)) {
        result.push({ kind: "ADDED", path: key, right: right[key] });
      } else if (!(key in right)) {
        result.push({ kind: "REMOVED", path: key, left: left[key] });
      } else if (left[key] !== right[key]) {
        result.push({ kind: "CHANGED", path: key, left: left[key], right: right[key] });
      }
    });

    return result;
  }

  function parseJson(raw) {
    try {
      return { ok: true, value: JSON.parse(raw) };
    } catch (error) {
      return { ok: false, error: error && error.message ? error.message : "JSON 解析失败" };
    }
  }

  function formatDiffLine(item) {
    if (item.kind === "ADDED") return item.path + ": " + item.right;
    if (item.kind === "REMOVED") return item.path + ": " + item.left;
    return item.path + ": " + item.left + " -> " + item.right;
  }

  function initPage() {
    var leftInput = global.document.getElementById("leftJson");
    var rightInput = global.document.getElementById("rightJson");
    var result = global.document.getElementById("result");
    var leftStatus = global.document.getElementById("leftStatus");
    var rightStatus = global.document.getElementById("rightStatus");
    if (!leftInput || !rightInput || !result || !leftStatus || !rightStatus) return;

    function setStatus(element, message, isError) {
      if (global.DevKit) {
        global.DevKit.setStatus(element, message, isError);
      } else {
        element.textContent = message;
        element.classList.toggle("error", Boolean(isError));
      }
    }

    function parseInput(input, status) {
      if (!input.value.trim()) {
        setStatus(status, "等待输入", false);
        return { ok: false, empty: true };
      }
      var parsed = parseJson(input.value);
      setStatus(status, parsed.ok ? "JSON 有效" : parsed.error, !parsed.ok);
      return parsed;
    }

    function addLine(item) {
      var row = global.document.createElement("span");
      row.className = "diff-line " + item.kind.toLowerCase();
      var label = global.document.createElement("span");
      var body = global.document.createElement("span");
      label.textContent = item.kind;
      body.textContent = formatDiffLine(item);
      row.append(label, body);
      result.append(row);
    }

    function compare() {
      var left = parseInput(leftInput, leftStatus);
      var right = parseInput(rightInput, rightStatus);
      if (!left.ok || !right.ok) {
        result.textContent = "请先修正输入中的 JSON 错误。";
        return;
      }

      var changes = diffJson(left.value, right.value);
      result.textContent = "";
      if (changes.length === 0) {
        result.textContent = "两个 JSON 没有字段级差异。";
        return;
      }
      changes.forEach(addLine);
    }

    global.document.getElementById("compare").addEventListener("click", compare);
    global.document.getElementById("sample").addEventListener("click", function () {
      leftInput.value = JSON.stringify({ service: "api", version: 1, flags: { beta: false }, timeout: 1200, list: [1, 2] }, null, 2);
      rightInput.value = JSON.stringify({ service: "api", version: 2, flags: { beta: true }, retries: 3, list: [1, 3] }, null, 2);
      compare();
    });
    global.document.getElementById("copy").addEventListener("click", function () {
      if (global.DevKit) {
        global.DevKit.copyText(result.textContent.trim(), "已复制差异");
      }
    });
    leftInput.addEventListener("input", function () {
      parseInput(leftInput, leftStatus);
    });
    rightInput.addEventListener("input", function () {
      parseInput(rightInput, rightStatus);
    });
  }

  var api = {
    describeValue: describeValue,
    flattenJson: flattenJson,
    diffJson: diffJson,
    parseJson: parseJson,
    formatDiffLine: formatDiffLine
  };

  global.DevKitJsonDiff = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports.DevKitJsonDiff = api;
  }

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", initPage);
    } else {
      initPage();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
