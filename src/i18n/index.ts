import { createI18n } from "vue-i18n";

import { messages } from "@/i18n/messages";

export const supportedLocales = ["zh-CN", "en-US"] as const;
export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "zh-CN";
export const localeStorageKey = "devkit-locale";

export const localeLabels: Record<Locale, string> = {
  "zh-CN": "中文",
  "en-US": "English"
};

function hasBrowserRuntime() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "zh" || normalized === "zh-cn" || normalized.startsWith("zh-hans")) return "zh-CN";
  if (normalized === "en" || normalized === "en-us" || normalized.startsWith("en-")) return "en-US";
  return null;
}

function readStoredLocale(): Locale | null {
  if (!hasBrowserRuntime()) return null;

  try {
    return normalizeLocale(window.localStorage.getItem(localeStorageKey));
  } catch {
    return null;
  }
}

function browserLocales() {
  if (typeof navigator === "undefined") return [];
  const languages = Array.isArray(navigator.languages) ? navigator.languages : [];
  return languages.length ? languages : [navigator.language];
}

export function detectInitialLocale(): Locale {
  const stored = readStoredLocale();
  if (stored) return stored;

  for (const candidate of browserLocales()) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }

  return defaultLocale;
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: false,
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  messages
});

function writeStoredLocale(locale: Locale) {
  if (!hasBrowserRuntime()) return;

  try {
    window.localStorage.setItem(localeStorageKey, locale);
  } catch {
    // Keep the in-memory locale even when storage is unavailable.
  }
}

export function syncDocumentLocale() {
  if (!hasBrowserRuntime()) return;

  const locale = i18n.global.locale.value as Locale;
  document.documentElement.lang = locale;
  document.title = i18n.global.t("app.meta.title");
}

export function setAppLocale(nextLocale: string, persist = true): Locale {
  const locale = normalizeLocale(nextLocale) || defaultLocale;
  i18n.global.locale.value = locale;
  if (persist) writeStoredLocale(locale);
  syncDocumentLocale();
  return locale;
}

export function initializeAppLocale() {
  return setAppLocale(detectInitialLocale(), false);
}
