export type JsonIndent = 0 | 2 | 4;

export interface JsonFormatResult {
  ok: boolean;
  text: string;
  value: unknown;
  indent: JsonIndent;
  error: string;
}

function fallbackParseError(locale: string) {
  return locale === "en-US" ? "JSON parse failed" : "JSON 解析失败";
}

function isPlainJsonContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return typeof value === "object" && value !== null;
}

function isEmbeddedJsonContainer(raw: string) {
  const trimmed = raw.trim();
  return (trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"));
}

function expandEmbeddedJson(value: unknown): unknown {
  if (typeof value === "string") {
    if (!isEmbeddedJsonContainer(value)) {
      return value;
    }

    try {
      const parsed = JSON.parse(value) as unknown;
      return isPlainJsonContainer(parsed) ? expandEmbeddedJson(parsed) : value;
    } catch {
      return value;
    }
  }

  if (Array.isArray(value)) {
    return value.map(item => expandEmbeddedJson(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, expandEmbeddedJson(item)]));
  }

  return value;
}

export function normalizeIndent(indent: unknown): JsonIndent {
  const value = Number(indent);
  if (value === 4) return 4;
  if (value === 0) return 0;
  return 2;
}

export function formatJson(raw: string, indent: unknown, locale = "zh-CN"): JsonFormatResult {
  const spaces = normalizeIndent(indent);

  try {
    const value = JSON.parse(raw) as unknown;
    const expandedValue = expandEmbeddedJson(value);
    return {
      ok: true,
      text: JSON.stringify(expandedValue, null, spaces),
      value: expandedValue,
      indent: spaces,
      error: ""
    };
  } catch (error) {
    return {
      ok: false,
      text: "",
      value: undefined,
      indent: spaces,
      error: error instanceof Error ? error.message : fallbackParseError(locale)
    };
  }
}
