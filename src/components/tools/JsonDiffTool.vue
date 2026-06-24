<script setup lang="ts">
import { computed, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { Clipboard, Copy, GitCompareArrows, WandSparkles } from "@lucide/vue";

import AppButton from "@/components/ui/AppButton.vue";
import Badge from "@/components/ui/Badge.vue";
import SurfaceCard from "@/components/ui/SurfaceCard.vue";
import { useToast } from "@/composables/useToast";
import type { Locale } from "@/i18n";
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
  key: string;
  error: boolean;
}

const { t, locale } = useI18n({ useScope: "global" });
const leftInput = ref("");
const rightInput = ref("");
const leftStatus = ref<InputStatus>({ key: "common.waiting", error: false });
const rightStatus = ref<InputStatus>({ key: "common.waiting", error: false });
const model = ref<DiffViewModel | null>(null);
const resultMessageKey = ref("tools.jsonDiff.initialResult");
const showToast = useToast();

const currentLocale = computed(() => locale.value as Locale);
const leftStatusText = computed(() => t(leftStatus.value.key));
const rightStatusText = computed(() => t(rightStatus.value.key));
const resultText = computed(() => {
  if (!model.value) return t(resultMessageKey.value);
  if (model.value.changes.length === 0) return t("tools.jsonDiff.noFieldDiff");
  return model.value.changes.map(formatDiffLine).join("\n");
});

function setStatus(target: Ref<InputStatus>, key: string, error = false) {
  target.value = { key, error };
}

function parseInput(raw: string, status: Ref<InputStatus>) {
  if (!raw.trim()) {
    setStatus(status, "common.waiting");
    return { ok: false, value: undefined, error: "", empty: true };
  }

  const parsed = parseJson(raw, currentLocale.value);
  setStatus(status, parsed.ok ? "common.jsonValid" : parsed.error, !parsed.ok);
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
    setStatus(status, "common.waiting");
    return;
  }

  const formatted = formatParsedJson(source.value, 2, currentLocale.value);
  if (!formatted.ok) {
    setStatus(status, formatted.error, true);
    return;
  }

  source.value = formatted.text;
  setStatus(status, "common.formatted");
}

function compare() {
  const left = parseInput(leftInput.value, leftStatus);
  const right = parseInput(rightInput.value, rightStatus);
  if (!left.ok || !right.ok) {
    model.value = null;
    resultMessageKey.value = "tools.jsonDiff.fixJsonErrors";
    return;
  }

  leftInput.value = formatJsonValue(left.value, 2);
  rightInput.value = formatJsonValue(right.value, 2);
  setStatus(leftStatus, "common.formatted");
  setStatus(rightStatus, "common.formatted");

  model.value = buildDiffViewModel(left.value, right.value);
  resultMessageKey.value = model.value.changes.length === 0 ? "tools.jsonDiff.noFieldDiff" : "";
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
  showToast(ok ? t("tools.jsonDiff.copied") : t("common.copyBlocked"));
}

async function copySide(side: "left" | "right") {
  const source = side === "left" ? leftInput : rightInput;
  const ok = await copyText(source.value.trim());
  showToast(ok ? t("tools.jsonDiff.copiedJson") : t("common.copyBlocked"));
}
</script>

<template>
  <div class="tool-workspace">
    <section class="tool-heading">
      <div>
        <Badge tone="muted">{{ t("tools.jsonDiff.badge") }}</Badge>
        <h1>{{ t("tools.jsonDiff.title") }}</h1>
        <p>{{ t("tools.jsonDiff.description") }}</p>
      </div>
      <div class="tool-heading-actions">
        <AppButton variant="outline" @click="fillSample">
          <WandSparkles :size="16" aria-hidden="true" />
          {{ t("tools.jsonDiff.fillSample") }}
        </AppButton>
        <AppButton @click="compare">
          <GitCompareArrows :size="16" aria-hidden="true" />
          {{ t("tools.jsonDiff.compare") }}
        </AppButton>
      </div>
    </section>

    <section class="diff-input-grid" :aria-label="t('tools.jsonDiff.inputAria')">
      <SurfaceCard class="editor-card">
        <div class="panel-head">
          <label class="panel-title" for="leftJson">{{ t("tools.jsonDiff.leftJson") }}</label>
          <span class="panel-actions">
            <span class="status-text" :class="{ error: leftStatus.error }">{{ leftStatusText }}</span>
            <button class="inline-action inline-action--icon" type="button" :aria-label="t('tools.jsonDiff.copyLeft')" :title="t('tools.jsonDiff.copyLeft')" @click="copySide('left')">
              <Copy :size="14" aria-hidden="true" />
            </button>
            <button class="inline-action" type="button" @click="formatSide('left')">{{ t("tools.jsonDiff.format") }}</button>
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
          <label class="panel-title" for="rightJson">{{ t("tools.jsonDiff.rightJson") }}</label>
          <span class="panel-actions">
            <span class="status-text" :class="{ error: rightStatus.error }">{{ rightStatusText }}</span>
            <button class="inline-action inline-action--icon" type="button" :aria-label="t('tools.jsonDiff.copyRight')" :title="t('tools.jsonDiff.copyRight')" @click="copySide('right')">
              <Copy :size="14" aria-hidden="true" />
            </button>
            <button class="inline-action" type="button" @click="formatSide('right')">{{ t("tools.jsonDiff.format") }}</button>
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
          <strong>{{ t("tools.jsonDiff.resultTitle") }}</strong>
          <p v-if="model">{{ t("tools.jsonDiff.summary", model.summary) }}</p>
        </div>
        <AppButton variant="soft" size="sm" @click="copyResult">
          <Clipboard :size="15" aria-hidden="true" />
          {{ t("tools.jsonDiff.copyResult") }}
        </AppButton>
      </div>

      <p v-if="!model || model.changes.length === 0" class="result-empty">{{ resultText }}</p>

      <div v-else class="semantic-diff">
        <div class="diff-summary">
          <span class="diff-stat">{{ t("tools.jsonDiff.total", { count: model.summary.total }) }}</span>
          <span class="diff-stat added">{{ t("tools.jsonDiff.added", { count: model.summary.added }) }}</span>
          <span class="diff-stat removed">{{ t("tools.jsonDiff.removed", { count: model.summary.removed }) }}</span>
          <span class="diff-stat changed">{{ t("tools.jsonDiff.changed", { count: model.summary.changed }) }}</span>
        </div>

        <div class="diff-code-grid">
          <section class="diff-code-pane">
            <strong class="diff-code-title">{{ t("tools.jsonDiff.leftFormatted") }}</strong>
            <div class="json-code">
              <span v-for="line in model.leftLines" :key="`left-${line.number}`" class="json-code-line" :class="line.kind" :data-path="line.kind ? line.path : undefined">
                <span class="json-code-number">{{ line.number }}</span>
                <span class="json-code-text">{{ line.text }}</span>
              </span>
            </div>
          </section>

          <section class="diff-code-pane">
            <strong class="diff-code-title">{{ t("tools.jsonDiff.rightFormatted") }}</strong>
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
