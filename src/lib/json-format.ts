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
    return {
      ok: true,
      text: JSON.stringify(value, null, spaces),
      value,
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
