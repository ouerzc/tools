import type { Locale } from "@/i18n";

const defaultTimestampLocale: Locale = "zh-CN";

const offsetZoneDefinitions = [
  { offsetHours: -12, cities: { "zh-CN": ["贝克岛", "豪兰岛"], "en-US": ["Baker Island", "Howland Island"] } },
  { offsetHours: -11, cities: { "zh-CN": ["帕果帕果", "纽埃", "中途岛"], "en-US": ["Pago Pago", "Niue", "Midway"] } },
  { offsetHours: -10, cities: { "zh-CN": ["檀香山", "塔希提", "拉罗汤加"], "en-US": ["Honolulu", "Tahiti", "Rarotonga"] } },
  { offsetHours: -9, cities: { "zh-CN": ["安克雷奇", "朱诺", "雅库塔特"], "en-US": ["Anchorage", "Juneau", "Yakutat"] } },
  { offsetHours: -8, cities: { "zh-CN": ["洛杉矶", "温哥华", "蒂华纳"], "en-US": ["Los Angeles", "Vancouver", "Tijuana"] } },
  { offsetHours: -7, cities: { "zh-CN": ["丹佛", "凤凰城", "埃德蒙顿"], "en-US": ["Denver", "Phoenix", "Edmonton"] } },
  { offsetHours: -6, cities: { "zh-CN": ["芝加哥", "墨西哥城", "温尼伯"], "en-US": ["Chicago", "Mexico City", "Winnipeg"] } },
  { offsetHours: -5, cities: { "zh-CN": ["纽约", "多伦多", "利马", "波哥大"], "en-US": ["New York", "Toronto", "Lima", "Bogota"] } },
  { offsetHours: -4, cities: { "zh-CN": ["哈利法克斯", "加拉加斯", "拉巴斯", "圣地亚哥"], "en-US": ["Halifax", "Caracas", "La Paz", "Santiago"] } },
  { offsetHours: -3, cities: { "zh-CN": ["圣保罗", "蒙得维的亚", "布宜诺斯艾利斯"], "en-US": ["Sao Paulo", "Montevideo", "Buenos Aires"] } },
  { offsetHours: -2, cities: { "zh-CN": ["南乔治亚", "费尔南多-迪诺罗尼亚"], "en-US": ["South Georgia", "Fernando de Noronha"] } },
  { offsetHours: -1, cities: { "zh-CN": ["亚速尔", "佛得角", "斯科斯比松"], "en-US": ["Azores", "Cape Verde", "Scoresbysund"] } },
  { offsetHours: 0, cities: { "zh-CN": ["伦敦", "都柏林", "里斯本", "阿克拉"], "en-US": ["London", "Dublin", "Lisbon", "Accra"] } },
  { offsetHours: 1, cities: { "zh-CN": ["柏林", "巴黎", "罗马", "拉各斯"], "en-US": ["Berlin", "Paris", "Rome", "Lagos"] } },
  { offsetHours: 2, cities: { "zh-CN": ["开罗", "雅典", "约翰内斯堡", "赫尔辛基"], "en-US": ["Cairo", "Athens", "Johannesburg", "Helsinki"] } },
  { offsetHours: 3, cities: { "zh-CN": ["莫斯科", "伊斯坦布尔", "利雅得", "内罗毕"], "en-US": ["Moscow", "Istanbul", "Riyadh", "Nairobi"] } },
  { offsetHours: 4, cities: { "zh-CN": ["迪拜", "马斯喀特", "巴库", "第比利斯"], "en-US": ["Dubai", "Muscat", "Baku", "Tbilisi"] } },
  { offsetHours: 5, cities: { "zh-CN": ["卡拉奇", "塔什干", "叶卡捷琳堡", "马尔代夫"], "en-US": ["Karachi", "Tashkent", "Yekaterinburg", "Maldives"] } },
  { offsetHours: 6, cities: { "zh-CN": ["达卡", "阿拉木图", "廷布", "鄂木斯克"], "en-US": ["Dhaka", "Almaty", "Thimphu", "Omsk"] } },
  { offsetHours: 7, cities: { "zh-CN": ["曼谷", "雅加达", "西贡"], "en-US": ["Bangkok", "Jakarta", "Ho Chi Minh City"] } },
  { offsetHours: 8, cities: { "zh-CN": ["上海", "香港", "新加坡", "台北"], "en-US": ["Shanghai", "Hong Kong", "Singapore", "Taipei"] } },
  { offsetHours: 9, cities: { "zh-CN": ["东京", "首尔", "雅库茨克"], "en-US": ["Tokyo", "Seoul", "Yakutsk"] } },
  { offsetHours: 10, cities: { "zh-CN": ["悉尼", "墨尔本", "布里斯班", "关岛"], "en-US": ["Sydney", "Melbourne", "Brisbane", "Guam"] } },
  { offsetHours: 11, cities: { "zh-CN": ["努美阿", "瓜达尔卡纳尔", "马加丹"], "en-US": ["Noumea", "Guadalcanal", "Magadan"] } },
  { offsetHours: 12, cities: { "zh-CN": ["奥克兰", "斐济", "堪察加"], "en-US": ["Auckland", "Fiji", "Kamchatka"] } }
] as const;

function formatOffsetZoneId(offsetHours: number) {
  const sign = offsetHours >= 0 ? "+" : "-";
  return `UTC${sign}${pad2(Math.abs(offsetHours))}:00`;
}

export const zones = offsetZoneDefinitions.map(({ offsetHours, cities }) => [formatOffsetZoneId(offsetHours), cities["zh-CN"]] as const);

const zoneCityMap = new Map(offsetZoneDefinitions.map(({ offsetHours, cities }) => [formatOffsetZoneId(offsetHours), cities]));

function normalizeTimestampLocale(locale: Locale | string = defaultTimestampLocale): Locale {
  return locale === "en-US" ? "en-US" : "zh-CN";
}

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

function parseOffsetMinutes(timeZone: string) {
  if (timeZone === "UTC") return 0;
  const match = String(timeZone).match(/^UTC([+-])(\d{2})(?::?(\d{2}))?$/);
  if (!match) return null;

  const hours = Number(match[2]);
  const minutes = Number(match[3] || 0);
  if (hours > 14 || minutes > 59) return null;

  return (match[1] === "-" ? -1 : 1) * (hours * 60 + minutes);
}

function formatOffsetLabel(minutes: number) {
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  return `UTC${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

function getIntlZonedParts(date: Date, timeZone: string): ZonedParts {
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

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const offsetMinutes = parseOffsetMinutes(timeZone);
  if (offsetMinutes !== null) {
    const shifted = new Date(date.getTime() + offsetMinutes * 60000);
    return {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hour: shifted.getUTCHours(),
      minute: shifted.getUTCMinutes(),
      second: shifted.getUTCSeconds()
    };
  }

  return getIntlZonedParts(date, timeZone);
}

export function formatZonedDateTime(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)} ${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
}

export function getOffsetLabel(date: Date, timeZone: string) {
  const offsetMinutes = parseOffsetMinutes(timeZone);
  if (offsetMinutes !== null) return formatOffsetLabel(offsetMinutes);

  const parts = getIntlZonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const minutes = Math.round((asUtc - date.getTime()) / 60000);
  return formatOffsetLabel(minutes);
}

export function getOffsetTimeZoneId(date: Date, timeZone: string) {
  const offset = getOffsetLabel(date, timeZone);
  return zones.some(([zone]) => zone === offset) ? offset : "UTC+00:00";
}

export function getZoneCity(timeZone: string, locale: Locale | string = defaultTimestampLocale) {
  const resolvedLocale = normalizeTimestampLocale(locale);
  if (timeZone === "UTC") return "UTC";
  const offsetMinutes = parseOffsetMinutes(timeZone);
  if (offsetMinutes !== null) return zoneCityMap.get(formatOffsetLabel(offsetMinutes))?.[resolvedLocale].join(" / ") || formatOffsetLabel(offsetMinutes);
  return zoneCityMap.get(timeZone)?.[resolvedLocale].join(" / ") || timeZone.split("/").pop()?.replaceAll("_", " ") || timeZone;
}

export function formatZoneLabel(timeZone: string, date = new Date(), locale: Locale | string = defaultTimestampLocale) {
  const offset = getOffsetLabel(date, timeZone);
  const city = getZoneCity(timeZone, locale);
  return city === "UTC" ? offset : `${city} ${offset}`;
}

export function formatZoneOption(timeZone: string, date = new Date(), locale: Locale | string = defaultTimestampLocale) {
  return formatZoneLabel(timeZone, date, locale);
}

export function formatInZone(date: Date, timeZone: string, locale: Locale | string = defaultTimestampLocale) {
  return `${formatZonedDateTime(date, timeZone)} ${formatZoneLabel(timeZone, date, locale)}`;
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
  const offsetMinutes = parseOffsetMinutes(timeZone);
  if (offsetMinutes !== null) return new Date(utcGuess - offsetMinutes * 60000);

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

const weekdayNames: Record<Locale, string[]> = {
  "zh-CN": ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
  "en-US": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
};

export function getWeekday(date: Date, timeZone: string, locale: Locale | string = defaultTimestampLocale) {
  const parts = getZonedParts(date, timeZone);
  return weekdayNames[normalizeTimestampLocale(locale)][new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()];
}

const relativeUnits: [key: "year" | "month" | "day" | "hour" | "minute" | "second", seconds: number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1]
];

const chineseRelativeUnits: Record<(typeof relativeUnits)[number][0], string> = {
  year: "年",
  month: "月",
  day: "天",
  hour: "小时",
  minute: "分钟",
  second: "秒"
};

const englishRelativeUnits: Record<(typeof relativeUnits)[number][0], string> = {
  year: "year",
  month: "month",
  day: "day",
  hour: "hour",
  minute: "minute",
  second: "second"
};

export function getRelative(date: Date, now = Date.now(), locale: Locale | string = defaultTimestampLocale) {
  const resolvedLocale = normalizeTimestampLocale(locale);
  const seconds = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  const picked = relativeUnits.find(unit => abs >= unit[1]) || ["second", 1];
  const amount = Math.max(1, Math.round(abs / picked[1]));
  if (abs < 2) return resolvedLocale === "en-US" ? "just now" : "刚刚";

  if (resolvedLocale === "en-US") {
    const baseUnit = englishRelativeUnits[picked[0]];
    const unit = amount === 1 ? baseUnit : `${baseUnit}s`;
    return seconds >= 0 ? `in ${amount} ${unit}` : `${amount} ${unit} ago`;
  }

  const unit = chineseRelativeUnits[picked[0]];
  return seconds >= 0 ? `${amount} ${unit}后` : `${amount} ${unit}前`;
}

export function createResult(date: Date, zone: string, now = Date.now(), locale: Locale | string = defaultTimestampLocale): TimestampResult {
  const resolvedLocale = normalizeTimestampLocale(locale);
  const ms = date.getTime();
  const isoWeek = getIsoWeek(date, zone);
  const dayOfYear = getDayOfYear(date, zone);
  return {
    seconds: String(Math.floor(ms / 1000)),
    milliseconds: String(ms),
    zoned: formatInZone(date, zone, resolvedLocale),
    utc: formatInZone(date, "UTC", resolvedLocale),
    iso: date.toISOString(),
    relative: getRelative(date, now, resolvedLocale),
    weekday: getWeekday(date, zone, resolvedLocale),
    week: resolvedLocale === "en-US" ? `ISO week ${isoWeek}` : `ISO 第 ${isoWeek} 周`,
    dayOfYear: resolvedLocale === "en-US" ? `day ${dayOfYear}` : `第 ${dayOfYear} 天`
  };
}
