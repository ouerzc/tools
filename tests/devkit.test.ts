// @vitest-environment jsdom

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createApp, nextTick, type App as VueApp } from "vue";
import { afterEach, beforeEach, describe, test, vi } from "vitest";

import App from "../src/App.vue";
import { i18n, initializeAppLocale } from "../src/i18n";
import { diffJson, formatJsonValue, buildDiffViewModel } from "../src/lib/json-diff";
import { formatJson } from "../src/lib/json-format";
import { createResult, formatInZone, formatZoneLabel, formatZoneOption, getOffsetLabel, getOffsetTimeZoneId, makeDateInZone, parseTimestamp, zones } from "../src/lib/timestamp";
import { tools } from "../src/lib/tools";

const root = path.resolve(__dirname, "..");

function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function cssBlock(selector: string) {
  const css = fs.readFileSync(path.join(root, "src/styles/app.css"), "utf8");
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `${selector} should have a style block`);
  return match[1];
}

let mountedApp: VueApp<Element> | null = null;

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    }
  };
}

function mountApplication() {
  const target = document.createElement("div");
  document.body.append(target);
  mountedApp = createApp(App);
  initializeAppLocale();
  mountedApp.use(i18n);
  mountedApp.mount(target);
  return target;
}

function setBrowserLanguages(languages: readonly string[]) {
  Object.defineProperty(window.navigator, "languages", {
    configurable: true,
    value: languages
  });
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: languages[0] || "zh-CN"
  });
}

function setClipboardWriter(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: { writeText }
  });
}

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: createMemoryStorage()
  });
  document.documentElement.lang = "";
  document.title = "";
  setBrowserLanguages(["zh-CN"]);
});

afterEach(() => {
  mountedApp?.unmount();
  mountedApp = null;
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-theme");
  window.location.hash = "";
  window.localStorage.clear();
  vi.restoreAllMocks();
});

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

describe("i18n", () => {
  test("uses stored locale before browser language and updates document metadata", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    setBrowserLanguages(["zh-CN"]);
    window.localStorage.setItem("devkit-locale", "en-US");

    mountApplication();
    await nextTick();

    assert.equal(document.documentElement.lang, "en-US");
    assert.equal(document.title, "DevKit Hub | Online Developer Toolkit");
    assert.match(document.body.textContent || "", /Developer Tools/);
    assert.doesNotMatch(document.body.textContent || "", /开发工具/);
  });

  test("uses browser English locale when no stored locale exists", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    setBrowserLanguages(["en-US", "zh-CN"]);

    mountApplication();
    await nextTick();

    assert.equal(document.documentElement.lang, "en-US");
    assert.match(document.body.textContent || "", /Developer Tools/);
  });

  test("language switch updates visible copy, storage, document lang, and toast text", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    setClipboardWriter(vi.fn(async () => undefined));

    mountApplication();
    await nextTick();

    assert.equal(document.documentElement.lang, "zh-CN");
    assert.match(document.body.textContent || "", /开发工具/);

    const languageSelect = document.querySelector<HTMLSelectElement>(".locale-select");
    assert.ok(languageSelect, "language selector should be available");

    languageSelect.value = "en-US";
    languageSelect.dispatchEvent(new Event("change"));
    await nextTick();

    assert.equal(window.localStorage.getItem("devkit-locale"), "en-US");
    assert.equal(document.documentElement.lang, "en-US");
    assert.match(document.body.textContent || "", /Developer Tools/);

    const copyButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(button => button.textContent?.includes("Copy entry"));
    assert.ok(copyButton, "copy button should use English copy");

    copyButton.click();
    await new Promise(resolve => window.setTimeout(resolve, 0));
    await nextTick();

    assert.match(document.body.textContent || "", /Entry copied/);
  });

  test("English search matches localized tool metadata", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    setBrowserLanguages(["en-US"]);

    mountApplication();
    await nextTick();

    const search = document.querySelector<HTMLInputElement>('input[type="search"]');
    assert.ok(search, "search input should be available");

    search.value = "readable indentation";
    search.dispatchEvent(new Event("input"));
    await nextTick();

    const toolsGrid = document.querySelector<HTMLElement>(".tools-grid");
    assert.ok(toolsGrid, "tools grid should be available");
    assert.match(toolsGrid.textContent || "", /JSON Formatter/);
    assert.doesNotMatch(toolsGrid.textContent || "", /Timestamp Converter/);
  });
});

describe("theme switcher", () => {
  test("top-right icon toggles black and white themes", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    mountApplication();
    await nextTick();

    const darkButton = document.querySelector<HTMLButtonElement>('[aria-label="切换到黑色主题"]');
    assert.ok(darkButton, "theme icon button should be available in the topbar");

    darkButton.click();
    await nextTick();

    assert.equal(document.documentElement.dataset.theme, "dark");
    assert.equal(window.localStorage.getItem("devkit-theme"), "dark");

    const lightButton = document.querySelector<HTMLButtonElement>('[aria-label="切换到白色主题"]');
    assert.ok(lightButton, "theme icon button should update its label after switching to black theme");

    lightButton.click();
    await nextTick();

    assert.equal(document.documentElement.dataset.theme, "light");
    assert.equal(window.localStorage.getItem("devkit-theme"), "light");
  });
});

describe("sidebar", () => {
  test("does not render the tag panel", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    mountApplication();
    await nextTick();

    assert.equal(document.querySelector('[aria-label="侧边栏标签"]'), null);
    assert.equal(document.querySelector('[aria-label="标签"]'), null);
  });

  test("toggles between expanded and collapsed states", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    const target = mountApplication();
    await nextTick();

    const layout = target.querySelector(".app-layout");
    const collapseButton = document.querySelector<HTMLButtonElement>('[aria-label="收起侧边栏"]');
    assert.ok(layout, "app layout should be mounted");
    assert.ok(collapseButton, "sidebar collapse button should be available");
    assert.equal(layout.classList.contains("app-layout--sidebar-collapsed"), false);

    collapseButton.click();
    await nextTick();

    assert.equal(layout.classList.contains("app-layout--sidebar-collapsed"), true);
    assert.equal(window.localStorage.getItem("devkit-sidebar-collapsed"), "true");

    const expandButton = document.querySelector<HTMLButtonElement>('[aria-label="展开侧边栏"]');
    assert.ok(expandButton, "sidebar expand button should replace the collapse button");
    expandButton.click();
    await nextTick();

    assert.equal(layout.classList.contains("app-layout--sidebar-collapsed"), false);
    assert.equal(window.localStorage.getItem("devkit-sidebar-collapsed"), "false");
  });

  test("collapsed logo uses the same center column as navigation icons", () => {
    const collapsedBrand = cssBlock(".topbar--collapsed .brand");

    assert.match(collapsedBrand, /width:\s*42px;/);
    assert.match(collapsedBrand, /height:\s*42px;/);
    assert.match(collapsedBrand, /gap:\s*0;/);
  });

  test("language selector and theme toggle share one aligned action row", () => {
    const sidebarActions = cssBlock(".sidebar-actions");
    const localeSwitcher = cssBlock(".locale-switcher");
    const themeToggle = cssBlock(".theme-toggle");

    assert.match(sidebarActions, /display:\s*flex;/);
    assert.match(sidebarActions, /align-items:\s*center;/);
    assert.match(sidebarActions, /gap:\s*10px;/);
    assert.match(localeSwitcher, /flex:\s*1 1 auto;/);
    assert.match(themeToggle, /flex:\s*0 0 42px;/);
  });
});

describe("timestamp tool UI", () => {
  test("timezone selects render the full timezone option list", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    window.location.hash = "#timestamp";

    mountApplication();
    await nextTick();

    const selects = Array.from(document.querySelectorAll<HTMLSelectElement>(".timestamp-grid select"));
    assert.equal(selects.length, 2);

    selects.forEach(select => {
      const optionIds = new Set(Array.from(select.options).map(option => option.value));
      assert.equal(select.options.length, zones.length);
      assert.equal(optionIds.has("UTC-12:00"), true);
      assert.equal(optionIds.has("UTC+00:00"), true);
      assert.equal(optionIds.has("UTC+12:00"), true);
    });
  });

  test("shows the five most recent conversion history records instead of timezone compare rows", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    window.location.hash = "#timestamp";

    mountApplication();
    await nextTick();

    assert.match(document.body.textContent || "", /转换历史/);
    assert.doesNotMatch(document.body.textContent || "", /时区对照/);
    assert.equal(document.querySelectorAll(".history-row").length, 0);

    const timestampInput = document.querySelector<HTMLInputElement>('input[placeholder="1718006400 或 1718006400000"]');
    const convertButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(button => button.textContent?.includes("转换"));
    assert.ok(timestampInput, "timestamp input should be available");
    assert.ok(convertButton, "convert button should be available");

    for (let index = 0; index < 6; index += 1) {
      timestampInput.value = String(1718006400 + index);
      timestampInput.dispatchEvent(new Event("input"));
      await nextTick();

      convertButton.click();
      await nextTick();
    }

    const rows = Array.from(document.querySelectorAll<HTMLElement>(".history-row"));
    assert.equal(rows.length, 5);
    assert.match(rows[0].textContent || "", /1718006405/);
    assert.match(rows[4].textContent || "", /1718006401/);
    assert.doesNotMatch(document.body.textContent || "", /1718006400/);
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
  test("timezone options cover UTC-12 through UTC+12 fixed offsets", () => {
    const optionIds = zones.map(([zone]) => zone);
    const expected = Array.from({ length: 25 }, (_, index) => {
      const offset = index - 12;
      const sign = offset >= 0 ? "+" : "-";
      return `UTC${sign}${String(Math.abs(offset)).padStart(2, "0")}:00`;
    });

    assert.deepEqual(optionIds, expected);
    assert.equal(new Set(optionIds).size, zones.length, "timezone options should not contain duplicate ids");
    zones.forEach(([zone, cities]) => {
      assert.equal(cities.length >= 2, true, `${zone} should show multiple representative cities`);
    });
  });

  test("parse seconds and milliseconds and format zones", () => {
    const secondsDate = parseTimestamp("1718006400");
    const millisDate = parseTimestamp("1718006400000");

    assert.equal(secondsDate?.toISOString(), "2024-06-10T08:00:00.000Z");
    assert.equal(millisDate?.toISOString(), "2024-06-10T08:00:00.000Z");
    assert.equal(formatInZone(new Date("2024-06-10T08:00:00.000Z"), "UTC+08:00"), "2024-06-10 16:00:00 上海 / 香港 / 新加坡 / 台北 UTC+08:00");
    assert.equal(getOffsetLabel(new Date("2024-06-10T08:00:00.000Z"), "UTC+08:00"), "UTC+08:00");
    assert.equal(formatZoneLabel("UTC-08:00", new Date("2024-06-10T08:00:00.000Z")), "洛杉矶 / 温哥华 / 蒂华纳 UTC-08:00");
    assert.equal(formatZoneOption("UTC+00:00", new Date("2024-06-10T08:00:00.000Z")), "伦敦 / 都柏林 / 里斯本 / 阿克拉 UTC+00:00");
    assert.equal(getOffsetTimeZoneId(new Date("2024-06-10T08:00:00.000Z"), "Asia/Shanghai"), "UTC+08:00");
    assert.equal(makeDateInZone("2024-06-10T16:00:00", "UTC+08:00")?.toISOString(), "2024-06-10T08:00:00.000Z");
  });

  test("formats timestamp display helpers in English", () => {
    const date = new Date("2024-06-10T08:00:00.000Z");

    assert.equal(formatInZone(date, "UTC+08:00", "en-US"), "2024-06-10 16:00:00 Shanghai / Hong Kong / Singapore / Taipei UTC+08:00");
    assert.equal(formatZoneLabel("UTC-08:00", date, "en-US"), "Los Angeles / Vancouver / Tijuana UTC-08:00");

    const result = createResult(date, "UTC+08:00", date.getTime(), "en-US");
    assert.equal(result.zoned, "2024-06-10 16:00:00 Shanghai / Hong Kong / Singapore / Taipei UTC+08:00");
    assert.equal(result.relative, "just now");
    assert.equal(result.weekday, "Monday");
    assert.equal(result.week, "ISO week 24");
    assert.equal(result.dayOfYear, "day 162");
  });

  test("create result preserves copied timestamp values", () => {
    const result = createResult(new Date("2024-06-10T08:00:00.000Z"), "UTC+08:00", new Date("2024-06-10T08:00:00.000Z").getTime());

    assert.equal(result.seconds, "1718006400");
    assert.equal(result.milliseconds, "1718006400000");
    assert.equal(result.zoned, "2024-06-10 16:00:00 上海 / 香港 / 新加坡 / 台北 UTC+08:00");
    assert.equal(result.utc, "2024-06-10 08:00:00 UTC+00:00");
    assert.equal(result.relative, "刚刚");
  });
});
