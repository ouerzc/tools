export interface TextSegment {
  text: string;
  changed: boolean;
}

export interface TextDiffLine {
  number: number;
  text: string;
  segments: TextSegment[];
}

export interface TextDiffRow {
  kind: "equal" | "added" | "removed" | "changed";
  left?: TextDiffLine;
  right?: TextDiffLine;
  group?: number;
}

// ponytail: bounded LCS handles pasted snippets; use a worker/Myers for larger documents.
function align(left: string[], right: string[], normalize = (value: string) => value) {
  const a = left.map(normalize);
  const b = right.map(normalize);
  const width = b.length + 1;
  const lengths = new Uint32Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lengths[i * width + j] = a[i] === b[j]
        ? 1 + lengths[(i + 1) * width + j + 1]!
        : Math.max(lengths[(i + 1) * width + j]!, lengths[i * width + j + 1]!);
    }
  }
  const steps: { kind: "equal" | "removed" | "added"; left?: number; right?: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      steps.push({ kind: "equal", left: i++, right: j++ });
    } else if (i < a.length && (j === b.length || lengths[(i + 1) * width + j]! >= lengths[i * width + j + 1]!)) {
      steps.push({ kind: "removed", left: i++ });
    } else {
      steps.push({ kind: "added", right: j++ });
    }
  }
  return steps;
}

function inlineDiff(left: string, right: string, ignoreWhitespace: boolean) {
  const tokenize = (text: string) => text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) || [];
  const a = tokenize(left);
  const b = tokenize(right);
  // Avoid quadratic work on unusually long individual lines.
  if ((a.length + 1) * (b.length + 1) > 40_000) {
    let start = 0;
    let end = 0;
    while (start < left.length && start < right.length && left[start] === right[start]) start++;
    while (end < left.length - start && end < right.length - start && left[left.length - end - 1] === right[right.length - end - 1]) end++;
    return [left, right].map(text => [
      { text: text.slice(0, start), changed: false },
      { text: text.slice(start, text.length - end), changed: true },
      { text: text.slice(text.length - end), changed: false }
    ]);
  }
  const result: TextSegment[][] = [[], []];
  for (const step of align(a, b)) {
    if (step.left !== undefined) result[0]!.push({ text: a[step.left]!, changed: step.kind !== "equal" && !(ignoreWhitespace && /^\s+$/.test(a[step.left]!)) });
    if (step.right !== undefined) result[1]!.push({ text: b[step.right]!, changed: step.kind !== "equal" && !(ignoreWhitespace && /^\s+$/.test(b[step.right]!)) });
  }
  return result;
}

export function diffText(leftText: string, rightText: string, ignoreWhitespace = false): TextDiffRow[] {
  const split = (text: string) => text === "" ? [] : text.replace(/\r\n?/g, "\n").split("\n");
  const left = split(leftText);
  const right = split(rightText);
  if (leftText.length > 200_000 || rightText.length > 200_000 || left.length > 2_000 || right.length > 2_000) {
    throw new Error("textDiff.tooLarge");
  }
  const normalize = (text: string) => ignoreWhitespace ? text.replace(/\s+/g, "") : text;
  const steps = align(left, right, normalize);
  const rows: TextDiffRow[] = [];
  let group = 0;
  const line = (text: string, index: number): TextDiffLine => ({ number: index + 1, text, segments: [{ text, changed: false }] });
  for (let index = 0; index < steps.length;) {
    const step = steps[index]!;
    if (step.kind === "equal") {
      rows.push({ kind: "equal", left: line(left[step.left!]!, step.left!), right: line(right[step.right!]!, step.right!) });
      index++;
      continue;
    }
    const removed: number[] = [];
    const added: number[] = [];
    while (index < steps.length && steps[index]!.kind !== "equal") {
      const next = steps[index++]!;
      if (next.left !== undefined) removed.push(next.left);
      if (next.right !== undefined) added.push(next.right);
    }
    for (let offset = 0; offset < Math.max(removed.length, added.length); offset++) {
      const l = removed[offset];
      const r = added[offset];
      const row: TextDiffRow = { kind: l !== undefined && r !== undefined ? "changed" : l !== undefined ? "removed" : "added", group };
      if (l !== undefined) row.left = line(left[l]!, l);
      if (r !== undefined) row.right = line(right[r]!, r);
      if (row.left && row.right) {
        const segments = inlineDiff(row.left.text, row.right.text, ignoreWhitespace);
        row.left.segments = segments[0]!;
        row.right.segments = segments[1]!;
      }
      rows.push(row);
    }
    group++;
  }
  return rows;
}

export function collapseTextRows(rows: TextDiffRow[], collapse: boolean) {
  const visible: { key: number; row?: TextDiffRow; hidden?: number }[] = [];
  for (let index = 0; index < rows.length;) {
    if (!collapse || rows[index]!.kind !== "equal") {
      visible.push({ key: index, row: rows[index++]! });
      continue;
    }
    let end = index;
    while (end < rows.length && rows[end]!.kind === "equal") end++;
    const head = index === 0 ? 0 : Math.min(3, end - index);
    const tail = end === rows.length ? 0 : Math.min(3, end - index - head);
    for (let i = index; i < index + head; i++) visible.push({ key: i, row: rows[i]! });
    if (end - index > head + tail) visible.push({ key: index + head, hidden: end - index - head - tail });
    for (let i = end - tail; i < end; i++) visible.push({ key: i, row: rows[i]! });
    index = end;
  }
  return visible;
}
