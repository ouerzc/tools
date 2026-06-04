<script setup lang="ts">
import { computed, ref, type Ref } from "vue";
import { Clipboard, GitCompareArrows, WandSparkles } from "@lucide/vue";

import AppButton from "@/components/ui/AppButton.vue";
import Badge from "@/components/ui/Badge.vue";
import SurfaceCard from "@/components/ui/SurfaceCard.vue";
import { useToast } from "@/composables/useToast";
import {
  buildDiffViewModel,
  formatDiffLine,
  formatJsonValue,
  formatParsedJson,
  parseJson,
  type DiffItem,
  type DiffViewModel
} from "@/lib/json-diff";
import { copyText } from "@/lib/utils";

interface InputStatus {
  message: string;
  error: boolean;
}

const leftInput = ref("");
const rightInput = ref("");
const leftStatus = ref<InputStatus>({ message: "等待输入", error: false });
const rightStatus = ref<InputStatus>({ message: "等待输入", error: false });
const model = ref<DiffViewModel | null>(null);
const resultMessage = ref("粘贴两段 JSON 后点击比较。");
const showToast = useToast();

const resultText = computed(() => {
  if (!model.value) return resultMessage.value;
  if (model.value.changes.length === 0) return "两个 JSON 没有字段级差异。";
  return model.value.changes.map(formatDiffLine).join("\n");
});

function setStatus(target: Ref<InputStatus>, message: string, error = false) {
  target.value = { message, error };
}

function parseInput(raw: string, status: Ref<InputStatus>) {
  if (!raw.trim()) {
    setStatus(status, "等待输入");
    return { ok: false, value: undefined, error: "", empty: true };
  }

  const parsed = parseJson(raw);
  setStatus(status, parsed.ok ? "JSON 有效" : parsed.error, !parsed.ok);
  return { ...parsed, empty: false };
}

function parseLeft() {
  parseInput(leftInput.value, leftStatus);
}

function parseRight() {
  parseInput(rightInput.value, rightStatus);
}

function formatSide(side: "left" | "right") {
  const source = side === "left" ? leftInput : rightInput;
  const status = side === "left" ? leftStatus : rightStatus;

  if (!source.value.trim()) {
    setStatus(status, "等待输入");
    return;
  }

  const formatted = formatParsedJson(source.value, 2);
  if (!formatted.ok) {
    setStatus(status, formatted.error, true);
    return;
  }

  source.value = formatted.text;
  setStatus(status, "已格式化显示");
}

function compare() {
  const left = parseInput(leftInput.value, leftStatus);
  const right = parseInput(rightInput.value, rightStatus);
  if (!left.ok || !right.ok) {
    model.value = null;
    resultMessage.value = "请先修正输入中的 JSON 错误。";
    return;
  }

  leftInput.value = formatJsonValue(left.value, 2);
  rightInput.value = formatJsonValue(right.value, 2);
  setStatus(leftStatus, "已格式化显示");
  setStatus(rightStatus, "已格式化显示");

  model.value = buildDiffViewModel(left.value, right.value);
  resultMessage.value = model.value.changes.length === 0 ? "两个 JSON 没有字段级差异。" : "";
}

function fillSample() {
  leftInput.value = JSON.stringify({ service: "api", version: 1, flags: { beta: false }, timeout: 1200, list: [1, 2] }, null, 2);
  rightInput.value = JSON.stringify({ service: "api", version: 2, flags: { beta: true }, retries: 3, list: [1, 3] }, null, 2);
  compare();
}

function detailValue(item: DiffItem) {
  if (item.kind === "ADDED") return item.right;
  if (item.kind === "REMOVED") return item.left;
  return `${item.left} -> ${item.right}`;
}

async function copyResult() {
  const ok = await copyText(resultText.value.trim());
  showToast(ok ? "已复制差异" : "浏览器限制了复制权限");
}
</script>

<template>
  <div class="tool-workspace">
    <section class="tool-heading">
      <div>
        <Badge tone="muted">Semantic Diff</Badge>
        <h1>JSON Diff</h1>
        <p>比较两个 JSON 值，按字段路径输出新增、删除和变更。</p>
      </div>
      <div class="tool-heading-actions">
        <AppButton variant="outline" @click="fillSample">
          <WandSparkles :size="16" aria-hidden="true" />
          填入示例
        </AppButton>
        <AppButton @click="compare">
          <GitCompareArrows :size="16" aria-hidden="true" />
          比较
        </AppButton>
      </div>
    </section>

    <section class="diff-input-grid" aria-label="JSON 输入">
      <SurfaceCard class="editor-card">
        <div class="panel-head">
          <label class="panel-title" for="leftJson">左侧 JSON</label>
          <span class="panel-actions">
            <span class="status-text" :class="{ error: leftStatus.error }">{{ leftStatus.message }}</span>
            <button class="inline-action" type="button" @click="formatSide('left')">格式化</button>
          </span>
        </div>
        <textarea
          id="leftJson"
          v-model="leftInput"
          class="code-textarea"
          spellcheck="false"
          placeholder='{"name":"devkit","version":1}'
          @input="parseLeft"
        />
      </SurfaceCard>

      <SurfaceCard class="editor-card">
        <div class="panel-head">
          <label class="panel-title" for="rightJson">右侧 JSON</label>
          <span class="panel-actions">
            <span class="status-text" :class="{ error: rightStatus.error }">{{ rightStatus.message }}</span>
            <button class="inline-action" type="button" @click="formatSide('right')">格式化</button>
          </span>
        </div>
        <textarea
          id="rightJson"
          v-model="rightInput"
          class="code-textarea"
          spellcheck="false"
          placeholder='{"name":"devkit","version":2}'
          @input="parseRight"
        />
      </SurfaceCard>
    </section>

    <SurfaceCard tone="code" class="result-panel" aria-live="polite">
      <div class="result-head">
        <div>
          <strong>差异结果</strong>
          <p v-if="model">总差异 {{ model.summary.total }}，新增 {{ model.summary.added }}，删除 {{ model.summary.removed }}，变更 {{ model.summary.changed }}</p>
        </div>
        <AppButton variant="soft" size="sm" @click="copyResult">
          <Clipboard :size="15" aria-hidden="true" />
          复制结果
        </AppButton>
      </div>

      <p v-if="!model || model.changes.length === 0" class="result-empty">{{ resultMessage }}</p>

      <div v-else class="semantic-diff">
        <div class="diff-summary">
          <span class="diff-stat">总差异 {{ model.summary.total }}</span>
          <span class="diff-stat added">新增 {{ model.summary.added }}</span>
          <span class="diff-stat removed">删除 {{ model.summary.removed }}</span>
          <span class="diff-stat changed">变更 {{ model.summary.changed }}</span>
        </div>

        <div class="diff-code-grid">
          <section class="diff-code-pane">
            <strong class="diff-code-title">左侧格式化 JSON</strong>
            <div class="json-code">
              <span v-for="line in model.leftLines" :key="`left-${line.number}`" class="json-code-line" :class="line.kind" :data-path="line.kind ? line.path : undefined">
                <span class="json-code-number">{{ line.number }}</span>
                <span class="json-code-text">{{ line.text }}</span>
              </span>
            </div>
          </section>

          <section class="diff-code-pane">
            <strong class="diff-code-title">右侧格式化 JSON</strong>
            <div class="json-code">
              <span v-for="line in model.rightLines" :key="`right-${line.number}`" class="json-code-line" :class="line.kind" :data-path="line.kind ? line.path : undefined">
                <span class="json-code-number">{{ line.number }}</span>
                <span class="json-code-text">{{ line.text }}</span>
              </span>
            </div>
          </section>
        </div>

        <div class="diff-details">
          <span v-for="item in model.changes" :key="`${item.kind}-${item.path}`" class="diff-detail-row" :class="item.kind.toLowerCase()">
            <span class="diff-detail-kind">{{ item.kind }}</span>
            <span class="diff-detail-path">{{ item.path }}</span>
            <span class="diff-detail-value">{{ detailValue(item) }}</span>
          </span>
        </div>
      </div>
    </SurfaceCard>
  </div>
</template>
