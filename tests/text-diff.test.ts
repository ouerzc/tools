// @vitest-environment jsdom
import assert from "node:assert/strict";
import { createApp, nextTick } from "vue";
import { describe, test } from "vitest";
import TextDiffTool from "../src/components/tools/TextDiffTool.vue";
import { i18n } from "../src/i18n";
import { collapseTextRows, diffText } from "../src/lib/text-diff";

describe("text diff", () => {
  test("aligns insertions, deletions, replacements, and repeated lines without losing original text", () => {
    const left = 'message Request {\n  string http_code = 8; // 状态码\n  string action = 9;\n}\n';
    const right = 'message Request {\n  optional uint32 http_code = 8; // 不传表示全部\n  string action = 9;\n  uint32 limit = 10;\n}\n';
    const rows = diffText(left, right);
    assert.deepEqual(rows.map(row => row.kind), ["equal", "changed", "equal", "added", "equal", "equal"]);
    assert.equal(rows.flatMap(row => row.left ? [row.left.text] : []).join('\n'), left);
    assert.equal(rows.flatMap(row => row.right ? [row.right.text] : []).join('\n'), right);
    assert.equal(rows[1]!.left!.segments.filter(segment => segment.changed).map(segment => segment.text).join(''), 'string状态码');
    assert.ok(rows[1]!.right!.segments.some(segment => segment.changed && segment.text === 'uint32'));
    assert.deepEqual(rows.filter(row => row.group !== undefined).map(row => row.group), [0, 1]);
    const repeated = diffText('a\nb\na', 'a\na');
    assert.deepEqual(repeated.map(row => row.kind), ['equal', 'removed', 'equal']);
    assert.deepEqual(repeated.map(row => row.right?.number), [1, undefined, 2]);
  });

  test("handles empty inputs, line endings, Unicode whitespace, and trailing newlines", () => {
    assert.deepEqual(diffText('', ''), []);
    assert.equal(diffText('', 'a')[0]!.kind, 'added');
    assert.equal(diffText('a', '')[0]!.kind, 'removed');
    assert.ok(diffText('a\r\nb\r', 'a\nb\n').every(row => row.kind === 'equal'));
    assert.equal(diffText('a', 'a\n')[1]!.kind, 'added');
    const a = '\u00a0 int32   site_id = 4;  ';
    const b = '\tint32 site_id = 4;';
    assert.equal(diffText(a, b)[0]!.kind, 'changed');
    const ignored = diffText(a, b, true)[0]!;
    assert.equal(ignored.kind, 'equal');
    assert.equal(ignored.left!.text, a);
    assert.equal(ignored.right!.text, b);
    assert.equal(diffText(a, '\tuint32 site_id = 4;', true)[0]!.kind, 'changed');
    assert.equal(diffText('a\n\nb', 'a\nb', true)[1]!.kind, 'removed');
  });

  test("bounds large input and preserves long lines when highlighting", () => {
    assert.throws(() => diffText('x'.repeat(200_001), ''), /tooLarge/);
    assert.throws(() => diffText('a\n'.repeat(2_000), ''), /tooLarge/);
    const left = 'a '.repeat(300) + 'old';
    const right = 'a '.repeat(300) + 'new';
    const row = diffText(left, right)[0]!;
    assert.equal(row.left!.segments.map(segment => segment.text).join(''), left);
    assert.equal(row.right!.segments.map(segment => segment.text).join(''), right);
    assert.equal(row.left!.segments.find(segment => segment.changed)!.text, 'old');
  });

  test("collapses equal runs while keeping context and all changes", () => {
    const lines = Array.from({ length: 30 }, (_, i) => String(i));
    const rows = diffText(lines.join('\n'), lines.map((line, i) => i === 15 ? 'changed' : line).join('\n'));
    const visible = collapseTextRows(rows, true);
    assert.deepEqual(visible.filter(entry => entry.hidden).map(entry => entry.hidden), [12, 11]);
    assert.equal(visible.filter(entry => entry.row).length, 7);
    assert.equal(collapseTextRows(rows, false).length, rows.length);
  });

  test("compares, navigates, folds, synchronizes scrolling, and invalidates stale results", async () => {
    i18n.global.locale.value = 'zh-CN';
    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(TextDiffTool).use(i18n);
    app.mount(root);
    const click = async (text: string) => {
      const button = Array.from(root.querySelectorAll('button')).find(element => element.textContent?.trim() === text);
      assert.ok(button, text);
      button.click();
      await nextTick();
    };
    const input = async (selector: string, text: string) => {
      const element = root.querySelector<HTMLTextAreaElement>(selector)!;
      element.value = text;
      element.dispatchEvent(new Event('input'));
      await nextTick();
    };
    try {
      await click('填入示例');
      assert.equal(root.querySelector('[role="status"]')!.textContent, '共 2 处差异：新增 1 行，删除 0 行，修改 1 行。');
      assert.ok(root.querySelector('.text-diff-mark'));
      await click('下一处');
      assert.equal(root.querySelector('.text-diff-position')!.textContent, '1 / 2');
      assert.equal(root.querySelectorAll('.text-diff-active').length, 2);
      await click('上一处');
      assert.equal(root.querySelector('.text-diff-position')!.textContent, '2 / 2');
      const panes = root.querySelectorAll<HTMLElement>('.text-diff-pane');
      panes[0]!.scrollTop = 44;
      panes[0]!.dispatchEvent(new Event('scroll'));
      assert.equal(panes[1]!.scrollTop, 44);
      await input('#text-diff-left', '  a  ');
      assert.equal(root.querySelector('[role="status"]'), null);
      await input('#text-diff-right', '\u00a0a');
      const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
      checkbox.click();
      await nextTick();
      await click('比较');
      assert.equal(root.querySelector('[role="status"]')!.textContent, '在当前比较设置下没有差异。');
      const fold = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[1]!;
      fold.click();
      await nextTick();
      assert.equal(root.querySelectorAll('.text-diff-fold').length, 2);
      await click('展开 1 行未变化内容');
      assert.equal(root.querySelectorAll('.text-diff-fold').length, 0);
      await input('#text-diff-left', 'x'.repeat(200_001));
      await click('比较');
      assert.ok(root.querySelector('[role="alert"]')!.textContent?.includes('200,000'));
    } finally {
      app.unmount();
      root.remove();
    }
  });
});
