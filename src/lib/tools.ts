export type ToolId = "json-diff" | "json-format" | "timestamp";

export interface ToolDefinition {
  id: ToolId;
  titleKey: string;
  descriptionKey: string;
  longDescriptionKey: string;
  kindKey: string;
  keywordsKey: string;
  shortcut: string;
  tags: string[];
}

export interface ToolMeta {
  id: ToolId;
  title: string;
  description: string;
  longDescription: string;
  kind: string;
  shortcut: string;
  tags: string[];
  keywords: string;
}

export type Translate = (key: string, values?: Record<string, string | number>) => string;

export const tools: ToolDefinition[] = [
  {
    id: "json-diff",
    titleKey: "toolMeta.jsonDiff.title",
    descriptionKey: "toolMeta.jsonDiff.description",
    longDescriptionKey: "toolMeta.jsonDiff.longDescription",
    kindKey: "toolMeta.jsonDiff.kind",
    keywordsKey: "toolMeta.jsonDiff.keywords",
    shortcut: "D",
    tags: ["JSON", "Diff", "Compare"]
  },
  {
    id: "json-format",
    titleKey: "toolMeta.jsonFormat.title",
    descriptionKey: "toolMeta.jsonFormat.description",
    longDescriptionKey: "toolMeta.jsonFormat.longDescription",
    kindKey: "toolMeta.jsonFormat.kind",
    keywordsKey: "toolMeta.jsonFormat.keywords",
    shortcut: "F",
    tags: ["JSON", "Formatter", "Minify"]
  },
  {
    id: "timestamp",
    titleKey: "toolMeta.timestamp.title",
    descriptionKey: "toolMeta.timestamp.description",
    longDescriptionKey: "toolMeta.timestamp.longDescription",
    kindKey: "toolMeta.timestamp.kind",
    keywordsKey: "toolMeta.timestamp.keywords",
    shortcut: "T",
    tags: ["Timestamp", "Unix Time", "Timezone"]
  }
];

export function getLocalizedTools(t: Translate): ToolMeta[] {
  return tools.map(tool => ({
    id: tool.id,
    title: t(tool.titleKey),
    description: t(tool.descriptionKey),
    longDescription: t(tool.longDescriptionKey),
    kind: t(tool.kindKey),
    shortcut: tool.shortcut,
    tags: tool.tags,
    keywords: t(tool.keywordsKey)
  }));
}

export function isToolId(value: string): value is ToolId {
  return tools.some(tool => tool.id === value);
}

export function getLocalizedToolById(id: ToolId, t: Translate) {
  return getLocalizedTools(t).find(tool => tool.id === id);
}
