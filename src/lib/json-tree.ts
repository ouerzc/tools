export type JsonTreeNodeKind = "object" | "array" | "string" | "number" | "boolean" | "null";

export interface JsonTreeNode {
  id: string;
  key: string;
  path: string;
  kind: JsonTreeNodeKind;
  summary: string;
  collapsible: boolean;
  children: JsonTreeNode[];
}

function describeScalar(value: unknown) {
  if (value === null) return "null";
  const json = JSON.stringify(value);
  return typeof json === "undefined" ? String(value) : json;
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function objectPath(prefix: string, key: string) {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
    return `${prefix}.${key}`;
  }

  return `${prefix}[${JSON.stringify(key)}]`;
}

function kindOf(value: unknown): JsonTreeNodeKind {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
}

function containerSummary(kind: "object" | "array", count: number) {
  if (kind === "object") {
    return count === 0 ? "{} 0 keys" : `{...} ${count} ${pluralize(count, "key", "keys")}`;
  }

  return count === 0 ? "[] 0 items" : `[...] ${count} ${pluralize(count, "item", "items")}`;
}

function buildNode(value: unknown, key: string, path: string): JsonTreeNode {
  const kind = kindOf(value);

  if (kind === "array") {
    const children = (value as unknown[]).map((child, index) => buildNode(child, String(index), `${path}[${index}]`));
    return {
      id: path,
      key,
      path,
      kind,
      summary: containerSummary(kind, children.length),
      collapsible: children.length > 0,
      children
    };
  }

  if (kind === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    const children = entries.map(([childKey, child]) => buildNode(child, childKey, objectPath(path, childKey)));
    return {
      id: path,
      key,
      path,
      kind,
      summary: containerSummary(kind, children.length),
      collapsible: children.length > 0,
      children
    };
  }

  return {
    id: path,
    key,
    path,
    kind,
    summary: describeScalar(value),
    collapsible: false,
    children: []
  };
}

export function buildJsonTree(value: unknown): JsonTreeNode {
  return buildNode(value, "$", "$");
}
