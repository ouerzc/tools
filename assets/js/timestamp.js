(function (global) {
  "use strict";

  var zones = [
    ["Asia/Shanghai", "Asia/Shanghai，上海"],
    ["UTC", "UTC"],
    ["America/Los_Angeles", "America/Los_Angeles，洛杉矶"],
    ["America/New_York", "America/New_York，纽约"],
    ["Europe/London", "Europe/London，伦敦"],
    ["Europe/Berlin", "Europe/Berlin，柏林"],
    ["Asia/Tokyo", "Asia/Tokyo，东京"],
    ["Asia/Singapore", "Asia/Singapore，新加坡"],
    ["Australia/Sydney", "Australia/Sydney，悉尼"]
  ];

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function getZonedParts(date, timeZone) {
    var formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });
    var parts = {};
    formatter.formatToParts(date).forEach(function (part) {
      if (part.type !== "literal") parts[part.type] = Number(part.value);
    });
    return {
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: parts.hour,
      minute: parts.minute,
      second: parts.second
    };
  }

  function formatInZone(date, timeZone) {
    var parts = getZonedParts(date, timeZone);
    return parts.year + "-" + pad2(parts.month) + "-" + pad2(parts.day) + " " +
      pad2(parts.hour) + ":" + pad2(parts.minute) + ":" + pad2(parts.second) + " " + timeZone;
  }

  function getOffsetLabel(date, timeZone) {
    var parts = getZonedParts(date, timeZone);
    var asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    var minutes = Math.round((asUtc - date.getTime()) / 60000);
    var sign = minutes >= 0 ? "+" : "-";
    var abs = Math.abs(minutes);
    return "UTC" + sign + pad2(Math.floor(abs / 60)) + ":" + pad2(abs % 60);
  }

  function makeDateInZone(dateTimeValue, timeZone) {
    var match = String(dateTimeValue).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return null;
    var wanted = {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: Number(match[4]),
      minute: Number(match[5]),
      second: Number(match[6] || 0)
    };
    var utcGuess = Date.UTC(wanted.year, wanted.month - 1, wanted.day, wanted.hour, wanted.minute, wanted.second);
    var zoned = getZonedParts(new Date(utcGuess), timeZone);
    var wantedAsUtc = Date.UTC(wanted.year, wanted.month - 1, wanted.day, wanted.hour, wanted.minute, wanted.second);
    var zonedAsUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
    return new Date(utcGuess + (wantedAsUtc - zonedAsUtc));
  }

  function parseTimestamp(raw) {
    if (!/^-?\d+$/.test(String(raw).trim())) return null;
    var num = Number(String(raw).trim());
    if (!Number.isSafeInteger(num)) return null;
    return new Date(Math.abs(num) < 100000000000 ? num * 1000 : num);
  }

  function getIsoWeek(date, timeZone) {
    var parts = getZonedParts(date, timeZone);
    var utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
    var day = utc.getUTCDay() || 7;
    utc.setUTCDate(utc.getUTCDate() + 4 - day);
    var yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
    return Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  }

  function getDayOfYear(date, timeZone) {
    var parts = getZonedParts(date, timeZone);
    var start = Date.UTC(parts.year, 0, 1);
    var today = Date.UTC(parts.year, parts.month - 1, parts.day);
    return Math.floor((today - start) / 86400000) + 1;
  }

  function getRelative(date, now) {
    var base = typeof now === "number" ? now : Date.now();
    var seconds = Math.round((date.getTime() - base) / 1000);
    var abs = Math.abs(seconds);
    var units = [
      ["年", 31536000],
      ["月", 2592000],
      ["天", 86400],
      ["小时", 3600],
      ["分钟", 60],
      ["秒", 1]
    ];
    var picked = units.find(function (unit) {
      return abs >= unit[1];
    }) || ["秒", 1];
    var amount = Math.max(1, Math.round(abs / picked[1]));
    if (abs < 2) return "刚刚";
    return seconds >= 0 ? amount + " " + picked[0] + "后" : amount + " " + picked[0] + "前";
  }

  function createResult(date, zone) {
    var ms = date.getTime();
    return {
      seconds: String(Math.floor(ms / 1000)),
      milliseconds: String(ms),
      zoned: formatInZone(date, zone) + " " + getOffsetLabel(date, zone),
      utc: formatInZone(date, "UTC"),
      iso: date.toISOString(),
      relative: getRelative(date),
      weekday: new Intl.DateTimeFormat("zh-CN", { timeZone: zone, weekday: "long" }).format(date),
      week: "ISO 第 " + getIsoWeek(date, zone) + " 周",
      dayOfYear: "第 " + getDayOfYear(date, zone) + " 天"
    };
  }

  function initPage() {
    var stamp = global.document.getElementById("stamp");
    var dateInput = global.document.getElementById("dateInput");
    var inputZone = global.document.getElementById("inputZone");
    var displayZone = global.document.getElementById("displayZone");
    var status = global.document.getElementById("status");
    var zoneStatus = global.document.getElementById("zoneStatus");
    if (!stamp || !dateInput || !inputZone || !displayZone || !status || !zoneStatus) return;

    var values = {};
    Array.prototype.slice.call(global.document.querySelectorAll(".value")).forEach(function (element) {
      values[element.dataset.key] = element;
    });
    var currentDate = null;

    function setStatus(message, isError) {
      if (global.DevKit) {
        global.DevKit.setStatus(status, message, isError);
      } else {
        status.textContent = message;
        status.classList.toggle("error", Boolean(isError));
      }
    }

    function populateZones() {
      var local = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai";
      zones.forEach(function (zone) {
        var inputOption = global.document.createElement("option");
        var displayOption = global.document.createElement("option");
        inputOption.value = zone[0];
        inputOption.textContent = zone[1];
        displayOption.value = zone[0];
        displayOption.textContent = zone[1];
        inputZone.append(inputOption);
        displayZone.append(displayOption);
      });
      inputZone.value = zones.some(function (zone) { return zone[0] === local; }) ? local : "Asia/Shanghai";
      displayZone.value = "Asia/Shanghai";
      global.document.getElementById("localZone").textContent = local;
    }

    function renderTimezoneCompare(date) {
      Array.prototype.slice.call(global.document.querySelectorAll(".tz-row")).forEach(function (row) {
        var zone = row.dataset.city;
        row.querySelector(".tz-time").textContent = formatInZone(date, zone) + " " + getOffsetLabel(date, zone);
      });
    }

    function paint(date) {
      var zone = displayZone.value;
      var data = createResult(date, zone);
      Object.keys(data).forEach(function (key) {
        if (values[key]) values[key].textContent = data[key];
      });
      zoneStatus.textContent = zone + " " + getOffsetLabel(date, zone);
      global.document.getElementById("zoneOffset").textContent = getOffsetLabel(date, zone);
      renderTimezoneCompare(date);
      currentDate = date;
      setStatus("已转换", false);
    }

    function convert() {
      var raw = stamp.value.trim();
      var date = null;
      if (raw) {
        date = parseTimestamp(raw);
        if (!date) {
          setStatus("时间戳格式无效", true);
          return;
        }
      } else if (dateInput.value) {
        date = makeDateInZone(dateInput.value, inputZone.value);
      }
      if (!date || Number.isNaN(date.getTime())) {
        setStatus("请输入有效时间", true);
        return;
      }
      paint(date);
    }

    function fillDateInput(date, zone) {
      var parts = getZonedParts(date, zone || inputZone.value);
      dateInput.value = parts.year + "-" + pad2(parts.month) + "-" + pad2(parts.day) + "T" +
        pad2(parts.hour) + ":" + pad2(parts.minute) + ":" + pad2(parts.second);
    }

    function setQuickDate(kind) {
      var now = new Date();
      var date = now;
      if (kind === "today" || kind === "tomorrow") {
        var baseParts = getZonedParts(now, inputZone.value);
        var dayShift = kind === "tomorrow" ? 1 : 0;
        var base = new Date(Date.UTC(baseParts.year, baseParts.month - 1, baseParts.day + dayShift, 0, 0, 0));
        date = makeDateInZone(base.getUTCFullYear() + "-" + pad2(base.getUTCMonth() + 1) + "-" +
          pad2(base.getUTCDate()) + "T00:00:00", inputZone.value);
      } else if (kind === "week") {
        date = new Date(now.getTime() + 7 * 86400000);
      }
      stamp.value = "";
      fillDateInput(date);
      paint(date);
    }

    function resetResults() {
      Object.keys(values).forEach(function (key) {
        values[key].textContent = "未转换";
      });
      Array.prototype.slice.call(global.document.querySelectorAll(".tz-time")).forEach(function (element) {
        element.textContent = "未转换";
      });
      stamp.value = "";
      dateInput.value = "";
      currentDate = null;
      setStatus("等待输入", false);
    }

    function tickLive() {
      var now = Date.now();
      global.document.getElementById("liveSeconds").textContent = String(Math.floor(now / 1000));
      global.document.getElementById("liveMilliseconds").textContent = String(now);
    }

    populateZones();
    tickLive();
    global.setInterval(tickLive, 1000);
    paint(new Date());

    global.document.getElementById("convert").addEventListener("click", convert);
    global.document.getElementById("clear").addEventListener("click", resetResults);
    global.document.getElementById("quickNow").addEventListener("click", function () { setQuickDate("now"); });
    global.document.getElementById("quickToday").addEventListener("click", function () { setQuickDate("today"); });
    global.document.getElementById("quickTomorrow").addEventListener("click", function () { setQuickDate("tomorrow"); });
    global.document.getElementById("quickWeek").addEventListener("click", function () { setQuickDate("week"); });
    displayZone.addEventListener("change", function () {
      if (currentDate) paint(currentDate);
    });
    inputZone.addEventListener("change", function () {
      if (dateInput.value) convert();
    });
    dateInput.addEventListener("input", function () {
      if (dateInput.value) stamp.value = "";
    });
    stamp.addEventListener("input", function () {
      if (stamp.value) dateInput.value = "";
    });
    Array.prototype.slice.call(global.document.querySelectorAll(".copy-small")).forEach(function (button) {
      button.addEventListener("click", function () {
        var text = values[button.dataset.copy].textContent;
        if (text === "未转换") return;
        if (global.DevKit) {
          global.DevKit.copyText(text, "已复制");
        }
      });
    });
  }

  var api = {
    zones: zones,
    pad2: pad2,
    getZonedParts: getZonedParts,
    formatInZone: formatInZone,
    getOffsetLabel: getOffsetLabel,
    makeDateInZone: makeDateInZone,
    parseTimestamp: parseTimestamp,
    getIsoWeek: getIsoWeek,
    getDayOfYear: getDayOfYear,
    getRelative: getRelative,
    createResult: createResult
  };

  global.DevKitTimestamp = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports.DevKitTimestamp = api;
  }

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", initPage);
    } else {
      initPage();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
