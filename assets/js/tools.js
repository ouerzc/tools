(function (global) {
  "use strict";

  var tools = [
    {
      id: "json-diff",
      title: "JSON Diff",
      description: "比较字段变更。",
      longDescription: "按稳定字段路径输出新增、删除和变更。",
      href: "tools/json-diff.html",
      kind: "compare",
      shortcut: "D",
      tags: ["JSON", "Diff", "Compare"],
      keywords: "JSON Diff 差异 对比 compare object field path"
    },
    {
      id: "json-format",
      title: "JSON 格式化",
      description: "展开或压缩 JSON。",
      longDescription: "把压缩 JSON 格式化为可读缩进，或压缩成单行。",
      href: "tools/json-format.html",
      kind: "format",
      shortcut: "F",
      tags: ["JSON", "Formatter", "Minify"],
      keywords: "JSON 格式化 format minify pretty beautify"
    },
    {
      id: "timestamp",
      title: "时间戳转换",
      description: "秒、毫秒、日期互转。",
      longDescription: "Unix 时间戳、日期时间和常用时区互转。",
      href: "tools/timestamp.html",
      kind: "time",
      shortcut: "T",
      tags: ["Timestamp", "Unix Time", "Timezone"],
      keywords: "时间戳 timestamp unix date time timezone 时区"
    }
  ];

  var api = { tools: tools };

  global.DevKitTools = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports.DevKitTools = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
