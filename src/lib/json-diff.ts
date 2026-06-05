export type DiffKind = "ADDED" | "REMOVED" | "CHANGED";

export type DiffItem =
  | { kind: "ADDED"; path: string; right: string }
  | { kind: "REMOVED"; path: string; left: string }
  | { kind: "CHANGED"; path: string; left: string; right: string };

export interface ParseJsonResult {
  ok: boolean;
  value: unknown;
  error: string;
}

export interface DiffSummary {
  total: number;
  added: number;
  removed: number;
  changed: number;
}

export interface JsonLine {
  number: number;
  text: string;
  path: string;
  kind: "" | "added" | "removed" | "changed";
}

export interface DiffViewModel {
  changes: DiffItem[];
  summary: DiffSummary;
  leftText: string;
  rightText: string;
  leftLines: JsonLine[];
  rightLines: JsonLine[];
}

function fallbackParseError(locale: string) {
  return locale === "en-US" ? "JSON parse failed" : "JSON 解析失败";
}

function describeValue(value: unknown) {
  const json = JSON.stringify(value);
  return typeof json === "undefined" ? String(value) : json;
}

function normalizeIndent(indent: unknown) {
  return Number(indent) === 4 ? 4 : 2;
}

function normalizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeJsonValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalizeJsonValue((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
}

export function formatJsonValue(value: unknown, indent: unknown) {
  return JSON.stringify(normalizeJsonValue(value), null, normalizeIndent(indent));
}

function appendObjectPath(prefix: string, key: string) {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
    return `${prefix}.${key}`;
  }

  return `${prefix}[${JSON.stringify(key)}]`;
}

export function flattenJson(value: unknown, prefix = "$", output: Record<string, string> = {}) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      output[prefix] = describeValue(value);
      return output;
    }

    value.forEach((child, index) => {
      flattenJson(child, `${prefix}[${index}]`, output);
    });
    return output;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    if (keys.length === 0) {
      output[prefix] = describeValue(value);
      return output;
    }

    keys.forEach(key => {
      flattenJson((value as Record<string, unknown>)[key], appendObjectPath(prefix, key), output);
    });
    return output;
  }

  output[prefix] = describeValue(value);
  return output;
}

export function diffJson(leftValue: unknown, rightValue: unknown) {
  const left = flattenJson(leftValue);
  const right = flattenJson(rightValue);
  const keys = Object.keys(left).concat(Object.keys(right)).sort();
  const seen = new Set<string>();
  const result: DiffItem[] = [];

  keys.forEach(key => {
    if (seen.has(key)) return;
    seen.add(key);

    if (!(key in left)) {
      result.push({ kind: "ADDED", path: key, right: right[key] });
    } else if (!(key in right)) {
      result.push({ kind: "REMOVED", path: key, left: left[key] });
    } else if (left[key] !== right[key]) {
      result.push({ kind: "CHANGED", path: key, left: left[key], right: right[key] });
    }
  });

  return result;
}

export function parseJson(raw: string, locale = "zh-CN"): ParseJsonResult {
  try {
    return { ok: true, value: JSON.parse(raw) as unknown, error: "" };
  } catch (error) {
    return { ok: false, value: undefined, error: error instanceof Error ? error.message : fallbackParseError(locale) };
  }
}

export function formatParsedJson(raw: string, indent: unknown, locale = "zh-CN") {
  const parsed = parseJson(raw, locale);
  if (!parsed.ok) return { ...parsed, text: "" };
  return {
    ok: true,
    value: parsed.value,
    error: "",
    text: formatJsonValue(parsed.value, indent)
  };
}

export function formatDiffLine(item: DiffItem) {
  if (item.kind === "ADDED") return `${item.path}: ${item.right}`;
  if (item.kind === "REMOVED") return `${item.path}: ${item.left}`;
  return `${item.path}: ${item.left} -> ${item.right}`;
}

function summarizeDiff(changes: DiffItem[]) {
  return changes.reduce<DiffSummary>(
    (summary, item) => {
      summary.total += 1;
      if (item.kind === "ADDED") summary.added += 1;
      if (item.kind === "REMOVED") summary.removed += 1;
      if (item.kind === "CHANGED") summary.changed += 1;
      return summary;
    },
    { total: 0, added: 0, removed: 0, changed: 0 }
  );
}

function pushFormattedLine(lines: Omit<JsonLine, "kind">[], text: string, path: string) {
  lines.push({
    number: lines.length + 1,
    text,
    path
  });
}

function appendFormattedValue(
  lines: Omit<JsonLine, "kind">[],
  value: unknown,
  path: string,
  level: number,
  key: string | null,
  isLast: boolean
) {
  const indent = " ".repeat(level * 2);
  const prefix = indent + (key === null ? "" : `${JSON.stringify(key)}: `);
  const suffix = isLast ? "" : ",";

  if (Array.isArray(value)) {
    if (value.length === 0) {
      pushFormattedLine(lines, `${prefix}[]${suffix}`, path);
      return;
    }

    pushFormattedLine(lines, `${prefix}[`, path);
    value.forEach((child, index) => {
      appendFormattedValue(lines, child, `${path}[${index}]`, level + 1, null, index === value.length - 1);
    });
    pushFormattedLine(lines, `${indent}]${suffix}`, path);
    return;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    if (keys.length === 0) {
      pushFormattedLine(lines, `${prefix}{}${suffix}`, path);
      return;
    }

    pushFormattedLine(lines, `${prefix}{`, path);
    keys.forEach((childKey, index) => {
      appendFormattedValue(
        lines,
        (value as Record<string, unknown>)[childKey],
        appendObjectPath(path, childKey),
        level + 1,
        childKey,
        index === keys.length - 1
      );
    });
    pushFormattedLine(lines, `${indent}}${suffix}`, path);
    return;
  }

  pushFormattedLine(lines, `${prefix}${describeValue(value)}${suffix}`, path);
}

function formatJsonLines(value: unknown) {
  const lines: Omit<JsonLine, "kind">[] = [];
  appendFormattedValue(lines, normalizeJsonValue(value), "$", 0, null, true);
  return lines;
}

function buildPathKinds(changes: DiffItem[]) {
  return changes.reduce(
    (maps, item) => {
      if (item.kind === "ADDED") {
        maps.right[item.path] = "added";
      } else if (item.kind === "REMOVED") {
        maps.left[item.path] = "removed";
      } else {
        maps.left[item.path] = "changed";
        maps.right[item.path] = "changed";
      }
      return maps;
    },
    { left: {} as Record<string, JsonLine["kind"]>, right: {} as Record<string, JsonLine["kind"]> }
  );
}

function markLines(lines: Omit<JsonLine, "kind">[], kinds: Record<string, JsonLine["kind"]>) {
  return lines.map<JsonLine>(line => ({
    ...line,
    kind: kinds[line.path] || ""
  }));
}

export function buildDiffViewModel(leftValue: unknown, rightValue: unknown): DiffViewModel {
  const changes = diffJson(leftValue, rightValue);
  const pathKinds = buildPathKinds(changes);

  return {
    changes,
    summary: summarizeDiff(changes),
    leftText: formatJsonValue(leftValue, 2),
    rightText: formatJsonValue(rightValue, 2),
    leftLines: markLines(formatJsonLines(leftValue), pathKinds.left),
    rightLines: markLines(formatJsonLines(rightValue), pathKinds.right)
  };
}
