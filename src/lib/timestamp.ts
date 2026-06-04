export const zones = [
  ["Asia/Shanghai", "Asia/Shanghai，上海"],
  ["UTC", "UTC"],
  ["America/Los_Angeles", "America/Los_Angeles，洛杉矶"],
  ["America/New_York", "America/New_York，纽约"],
  ["Europe/London", "Europe/London，伦敦"],
  ["Europe/Berlin", "Europe/Berlin，柏林"],
  ["Asia/Tokyo", "Asia/Tokyo，东京"],
  ["Asia/Singapore", "Asia/Singapore，新加坡"],
  ["Australia/Sydney", "Australia/Sydney，悉尼"]
] as const;

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface TimestampResult {
  seconds: string;
  milliseconds: string;
  zoned: string;
  utc: string;
  iso: string;
  relative: string;
  weekday: string;
  week: string;
  dayOfYear: string;
}

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, number>> = {};
  formatter.formatToParts(date).forEach(part => {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  });

  return {
    year: parts.year || 0,
    month: parts.month || 0,
    day: parts.day || 0,
    hour: parts.hour || 0,
    minute: parts.minute || 0,
    second: parts.second || 0
  };
}

export function formatInZone(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)} ${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)} ${timeZone}`;
}

export function getOffsetLabel(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const minutes = Math.round((asUtc - date.getTime()) / 60000);
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  return `UTC${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

export function makeDateInZone(dateTimeValue: string, timeZone: string) {
  const match = String(dateTimeValue).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const wanted = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] || 0)
  };
  const utcGuess = Date.UTC(wanted.year, wanted.month - 1, wanted.day, wanted.hour, wanted.minute, wanted.second);
  const zoned = getZonedParts(new Date(utcGuess), timeZone);
  const wantedAsUtc = Date.UTC(wanted.year, wanted.month - 1, wanted.day, wanted.hour, wanted.minute, wanted.second);
  const zonedAsUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
  return new Date(utcGuess + (wantedAsUtc - zonedAsUtc));
}

export function parseTimestamp(raw: string) {
  if (!/^-?\d+$/.test(String(raw).trim())) return null;
  const num = Number(String(raw).trim());
  if (!Number.isSafeInteger(num)) return null;
  return new Date(Math.abs(num) < 100000000000 ? num * 1000 : num);
}

export function getIsoWeek(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getDayOfYear(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  const start = Date.UTC(parts.year, 0, 1);
  const today = Date.UTC(parts.year, parts.month - 1, parts.day);
  return Math.floor((today - start) / 86400000) + 1;
}

export function getRelative(date: Date, now = Date.now()) {
  const seconds = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  const units: [string, number][] = [
    ["年", 31536000],
    ["月", 2592000],
    ["天", 86400],
    ["小时", 3600],
    ["分钟", 60],
    ["秒", 1]
  ];
  const picked = units.find(unit => abs >= unit[1]) || ["秒", 1];
  const amount = Math.max(1, Math.round(abs / picked[1]));
  if (abs < 2) return "刚刚";
  return seconds >= 0 ? `${amount} ${picked[0]}后` : `${amount} ${picked[0]}前`;
}

export function createResult(date: Date, zone: string, now = Date.now()): TimestampResult {
  const ms = date.getTime();
  return {
    seconds: String(Math.floor(ms / 1000)),
    milliseconds: String(ms),
    zoned: `${formatInZone(date, zone)} ${getOffsetLabel(date, zone)}`,
    utc: formatInZone(date, "UTC"),
    iso: date.toISOString(),
    relative: getRelative(date, now),
    weekday: new Intl.DateTimeFormat("zh-CN", { timeZone: zone, weekday: "long" }).format(date),
    week: `ISO 第 ${getIsoWeek(date, zone)} 周`,
    dayOfYear: `第 ${getDayOfYear(date, zone)} 天`
  };
}
