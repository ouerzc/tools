import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "vitest";

import { diffJson, formatJsonValue, buildDiffViewModel } from "../src/lib/json-diff";
import { formatJson } from "../src/lib/json-format";
import { createResult, formatInZone, getOffsetLabel, parseTimestamp } from "../src/lib/timestamp";
import { tools } from "../src/lib/tools";

const root = path.resolve(__dirname, "..");

function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("project structure", () => {
  test("Vue application entrypoints exist", () => {
    [
      "index.html",
      "src/main.ts",
      "src/App.vue",
      "src/styles/app.css",
      "src/components/tools/JsonDiffTool.vue",
      "src/components/tools/JsonFormatterTool.vue",
      "src/components/tools/TimestampTool.vue"
    ].forEach(relativePath => {
      assert.ok(fs.existsSync(path.join(root, relativePath)), `${relativePath} should exist`);
    });
  });

  test("tool registry keeps stable legacy ids", () => {
    assert.deepEqual(tools.map(tool => tool.id), ["json-diff", "json-format", "timestamp"]);
  });
});

describe("JSON formatter", () => {
  test("parses, formats, minifies, and reports invalid input", () => {
    assert.equal(formatJson('{"b":2,"a":1}', 2).text, '{\n  "b": 2,\n  "a": 1\n}');
    assert.equal(formatJson('{"b":2,"a":1}', 0).text, '{"b":2,"a":1}');

    const invalid = formatJson("{bad", 2);
    assert.equal(invalid.ok, false);
    assert.match(invalid.error, /JSON|position|property|Unexpected/i);
  });
});

describe("JSON diff", () => {
  test("emits stable field paths for objects, arrays, and primitive roots", () => {
    assert.deepEqual(
      plain(
        diffJson(
          { service: "api", version: 1, flags: { beta: false }, list: [1, 2], removed: true },
          { service: "api", version: 2, flags: { beta: true }, list: [1, 3], added: "x" }
        )
      ),
      [
        { kind: "ADDED", path: "$.added", right: '"x"' },
        { kind: "CHANGED", path: "$.flags.beta", left: "false", right: "true" },
        { kind: "CHANGED", path: "$.list[1]", left: "2", right: "3" },
        { kind: "REMOVED", path: "$.removed", left: "true" },
        { kind: "CHANGED", path: "$.version", left: "1", right: "2" }
      ]
    );

    assert.deepEqual(plain(diffJson("left", "right")), [
      { kind: "CHANGED", path: "$", left: '"left"', right: '"right"' }
    ]);
  });

  test("formats both inputs with stable object key ordering", () => {
    const formatted = formatJsonValue({ z: 1, a: { beta: true, alpha: false }, list: [2, 1] }, 2);

    assert.equal(
      formatted,
      '{\n  "a": {\n    "alpha": false,\n    "beta": true\n  },\n  "list": [\n    2,\n    1\n  ],\n  "z": 1\n}'
    );
  });

  test("view model marks changed, added, and removed formatted lines", () => {
    const model = buildDiffViewModel(
      { service: "api", flags: { beta: false }, list: [1, 2], removed: true },
      { service: "api", flags: { beta: true }, list: [1, 3], added: "x" }
    );

    assert.deepEqual(plain(model.summary), { total: 4, added: 1, removed: 1, changed: 2 });
    assert.equal(model.leftLines.find(line => line.path === "$.flags.beta")?.kind, "changed");
    assert.equal(model.rightLines.find(line => line.path === "$.flags.beta")?.kind, "changed");
    assert.equal(model.leftLines.find(line => line.path === "$.removed")?.kind, "removed");
    assert.equal(model.rightLines.find(line => line.path === "$.added")?.kind, "added");
    assert.equal(model.leftText.includes('"removed": true'), true);
    assert.equal(model.rightText.includes('"added": "x"'), true);
  });
});

describe("timestamp helpers", () => {
  test("parse seconds and milliseconds and format zones", () => {
    const secondsDate = parseTimestamp("1718006400");
    const millisDate = parseTimestamp("1718006400000");

    assert.equal(secondsDate?.toISOString(), "2024-06-10T08:00:00.000Z");
    assert.equal(millisDate?.toISOString(), "2024-06-10T08:00:00.000Z");
    assert.equal(formatInZone(new Date("2024-06-10T08:00:00.000Z"), "Asia/Shanghai"), "2024-06-10 16:00:00 Asia/Shanghai");
    assert.equal(getOffsetLabel(new Date("2024-06-10T08:00:00.000Z"), "Asia/Shanghai"), "UTC+08:00");
  });

  test("create result preserves copied timestamp values", () => {
    const result = createResult(new Date("2024-06-10T08:00:00.000Z"), "Asia/Shanghai", new Date("2024-06-10T08:00:00.000Z").getTime());

    assert.equal(result.seconds, "1718006400");
    assert.equal(result.milliseconds, "1718006400000");
    assert.equal(result.relative, "刚刚");
  });
});
