const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

function loadScript(relativePath) {
  const filename = path.join(root, relativePath);
  const code = fs.readFileSync(filename, "utf8");
  const sandbox = {
    console,
    module: { exports: {} },
    exports: {},
    window: {},
    document: undefined,
    navigator: undefined,
    location: { href: "file:///index.html" },
    setTimeout,
    clearTimeout
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename });
  return Object.keys(sandbox.module.exports).length ? sandbox.module.exports : sandbox.window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("required static entrypoints exist", () => {
  [
    "index.html",
    "tools/json-diff.html",
    "tools/json-format.html",
    "tools/timestamp.html",
    "assets/css/app.css",
    "assets/js/shared.js",
    "assets/js/tools.js",
    "assets/js/json-diff.js",
    "assets/js/json-format.js",
    "assets/js/timestamp.js"
  ].forEach(relativePath => {
    assert.ok(fs.existsSync(path.join(root, relativePath)), `${relativePath} should exist`);
  });
});

test("JSON formatter parses, formats, minifies, and reports invalid input", () => {
  const formatter = loadScript("assets/js/json-format.js").DevKitJsonFormat;

  assert.equal(formatter.formatJson('{"b":2,"a":1}', 2).text, '{\n  "b": 2,\n  "a": 1\n}');
  assert.equal(formatter.formatJson('{"b":2,"a":1}', 0).text, '{"b":2,"a":1}');

  const invalid = formatter.formatJson("{bad", 2);
  assert.equal(invalid.ok, false);
  assert.match(invalid.error, /JSON|position|property|Unexpected/i);
});

test("JSON diff emits stable field paths for objects, arrays, and primitive roots", () => {
  const diff = loadScript("assets/js/json-diff.js").DevKitJsonDiff;

  assert.deepEqual(
    plain(diff.diffJson(
      { service: "api", version: 1, flags: { beta: false }, list: [1, 2], removed: true },
      { service: "api", version: 2, flags: { beta: true }, list: [1, 3], added: "x" }
    )),
    [
      { kind: "ADDED", path: "$.added", right: '"x"' },
      { kind: "CHANGED", path: "$.flags.beta", left: "false", right: "true" },
      { kind: "CHANGED", path: "$.list[1]", left: "2", right: "3" },
      { kind: "REMOVED", path: "$.removed", left: "true" },
      { kind: "CHANGED", path: "$.version", left: "1", right: "2" }
    ]
  );

  assert.deepEqual(plain(diff.diffJson("left", "right")), [
    { kind: "CHANGED", path: "$", left: '"left"', right: '"right"' }
  ]);
});

test("timestamp helpers parse seconds and milliseconds and format zones", () => {
  const timestamp = loadScript("assets/js/timestamp.js").DevKitTimestamp;
  const secondsDate = timestamp.parseTimestamp("1718006400");
  const millisDate = timestamp.parseTimestamp("1718006400000");

  assert.equal(secondsDate.toISOString(), "2024-06-10T08:00:00.000Z");
  assert.equal(millisDate.toISOString(), "2024-06-10T08:00:00.000Z");
  assert.equal(
    timestamp.formatInZone(new Date("2024-06-10T08:00:00.000Z"), "Asia/Shanghai"),
    "2024-06-10 16:00:00 Asia/Shanghai"
  );
  assert.equal(timestamp.getOffsetLabel(new Date("2024-06-10T08:00:00.000Z"), "Asia/Shanghai"), "UTC+08:00");
});
