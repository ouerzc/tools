(function (global) {
  "use strict";

  function normalizeIndent(indent) {
    var value = Number(indent);
    return value === 4 ? 4 : value === 0 ? 0 : 2;
  }

  function formatJson(raw, indent) {
    try {
      var value = JSON.parse(raw);
      var spaces = normalizeIndent(indent);
      return {
        ok: true,
        text: JSON.stringify(value, null, spaces),
        value: value,
        indent: spaces
      };
    } catch (error) {
      return {
        ok: false,
        error: error && error.message ? error.message : "JSON 解析失败"
      };
    }
  }

  function initPage() {
    var input = global.document.getElementById("jsonInput");
    var status = global.document.getElementById("status");
    var indent = global.document.getElementById("indent");
    if (!input || !status || !indent) return;

    function setStatus(message, isError) {
      if (global.DevKit) {
        global.DevKit.setStatus(status, message, isError);
      } else {
        status.textContent = message;
        status.classList.toggle("error", Boolean(isError));
      }
    }

    function parseOnly() {
      if (!input.value.trim()) {
        setStatus("等待输入", false);
        return null;
      }
      var result = formatJson(input.value, indent.value);
      if (result.ok) {
        setStatus("JSON 有效", false);
        return result.value;
      }
      setStatus(result.error, true);
      return null;
    }

    function formatWith(spaces) {
      if (!input.value.trim()) {
        setStatus("等待输入", false);
        return;
      }
      var result = formatJson(input.value, spaces);
      if (!result.ok) {
        setStatus(result.error, true);
        return;
      }
      input.value = result.text;
      setStatus(result.indent === 0 ? "已压缩成单行" : "已格式化为 " + result.indent + " 空格缩进", false);
    }

    global.document.getElementById("format").addEventListener("click", function () {
      formatWith(indent.value);
    });
    global.document.getElementById("minify").addEventListener("click", function () {
      formatWith(0);
    });
    global.document.getElementById("sample").addEventListener("click", function () {
      input.value = '{"name":"DevKit Hub","tools":[{"id":"json-diff","ready":true},{"id":"json-format","ready":true},{"id":"timestamp","ready":true}],"theme":{"mode":"light","accent":"green"}}';
      formatWith(2);
    });
    global.document.getElementById("copy").addEventListener("click", function () {
      if (global.DevKit) {
        global.DevKit.copyText(input.value, "已复制结果");
      }
    });
    input.addEventListener("input", parseOnly);
  }

  var api = {
    formatJson: formatJson,
    normalizeIndent: normalizeIndent
  };

  global.DevKitJsonFormat = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports.DevKitJsonFormat = api;
  }

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", initPage);
    } else {
      initPage();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
