export type ToolId = "json-diff" | "json-format" | "timestamp";

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

export const tools: ToolMeta[] = [
  {
    id: "json-diff",
    title: "JSON Diff",
    description: "比较字段变更。",
    longDescription: "按稳定字段路径输出新增、删除和变更，并提供左右两侧语义高亮。",
    kind: "compare",
    shortcut: "D",
    tags: ["JSON", "Diff", "Compare"],
    keywords: "JSON Diff 差异 对比 compare object field path"
  },
  {
    id: "json-format",
    title: "JSON 格式化",
    description: "展开或压缩 JSON。",
    longDescription: "把压缩 JSON 格式化为可读缩进，或压缩成适合接口传输的单行。",
    kind: "format",
    shortcut: "F",
    tags: ["JSON", "Formatter", "Minify"],
    keywords: "JSON 格式化 format minify pretty beautify"
  },
  {
    id: "timestamp",
    title: "时间戳转换",
    description: "秒、毫秒、日期互转。",
    longDescription: "Unix 时间戳、日期时间和常用时区互转，并提供开发常用复制值。",
    kind: "time",
    shortcut: "T",
    tags: ["Timestamp", "Unix Time", "Timezone"],
    keywords: "时间戳 timestamp unix date time timezone 时区"
  }
];

export function isToolId(value: string): value is ToolId {
  return tools.some(tool => tool.id === value);
}

export function getToolById(id: ToolId) {
  return tools.find(tool => tool.id === id);
}
