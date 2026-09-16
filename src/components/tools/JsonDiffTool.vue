<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Clipboard, Copy, GitCompareArrows, Plus, X, WandSparkles } from "@lucide/vue";

import AppButton from "@/components/ui/AppButton.vue";
import Badge from "@/components/ui/Badge.vue";
import SurfaceCard from "@/components/ui/SurfaceCard.vue";
import { useToast } from "@/composables/useToast";
import type { Locale } from "@/i18n";
import { loadJsonHistory, type JsonHistoryEntry } from "@/lib/json-history";
import { buildDiffViewModel, formatDiffLine, formatJsonValue, formatParsedJson, parseJson, type DiffItem, type DiffViewModel } from "@/lib/json-diff";
import { copyText } from "@/lib/utils";

interface JsonInput {
  id: number;
  text: string;
  historyId: string;
  status: { key: string; error: boolean };
}

const { t, locale } = useI18n({ useScope: "global" });
const maxInputs = 5;
let nextId = 0;
function createInput(): JsonInput {
  return { id: nextId++, text: "", historyId: "", status: { key: "common.waiting", error: false } };
}
const inputs = ref<JsonInput[]>([createInput(), createInput()]);
const comparisons = ref<{ id: number; number: number; model: DiffViewModel }[]>([]);
const resultMessageKey = ref("tools.jsonDiff.initialResult");
const history = ref<JsonHistoryEntry[]>(loadJsonHistory());
const showToast = useToast();
const currentLocale = computed(() => locale.value as Locale);
const pairTitle = (number: number) => `JSON 1 ↔ JSON ${number}`;
const resultText = computed(() => comparisons.value.length
  ? comparisons.value.map(({ number, model }) => `${pairTitle(number)}\n${model.changes.length ? model.changes.map(formatDiffLine).join("\n") : t("tools.jsonDiff.noFieldDiff")}`).join("\n\n")
  : t(resultMessageKey.value));

function invalidateResults() {
  comparisons.value = [];
  resultMessageKey.value = "tools.jsonDiff.initialResult";
}
function inputId(input: JsonInput) {
  return input.id === 0 ? "leftJson" : input.id === 1 ? "rightJson" : `json-${input.id}`;
}
function historyId(input: JsonInput) {
  return input.id === 0 ? "leftHistory" : input.id === 1 ? "rightHistory" : `history-${input.id}`;
}
function parseInput(input: JsonInput) {
  if (!input.text.trim()) {
    input.status = { key: "common.waiting", error: false };
    return { ok: false, value: undefined };
  }
  const parsed = parseJson(input.text, currentLocale.value);
  input.status = { key: parsed.ok ? "common.jsonValid" : parsed.error, error: !parsed.ok };
  return parsed;
}
function onInput(input: JsonInput) {
  input.historyId = "";
  parseInput(input);
  invalidateResults();
}
async function addInput() {
  if (inputs.value.length >= maxInputs) return;
  const input = createInput();
  inputs.value.push(input);
  invalidateResults();
  await nextTick();
  document.getElementById(inputId(input))?.focus();
}
function removeInput(index: number) {
  if (index < 2 || inputs.value.length <= 2) return;
  inputs.value.splice(index, 1);
  invalidateResults();
}
function formatInput(input: JsonInput) {
  if (!input.text.trim()) return;
  const formatted = formatParsedJson(input.text, 2, currentLocale.value);
  if (!formatted.ok) {
    input.status = { key: formatted.error, error: true };
    return;
  }
  input.text = formatted.text;
  input.status = { key: "common.formatted", error: false };
}
function compare() {
  const parsed = inputs.value.map(parseInput);
  if (parsed.some(input => !input.ok)) {
    comparisons.value = [];
    resultMessageKey.value = "tools.jsonDiff.fixJsonErrors";
    return;
  }
  inputs.value.forEach((input, index) => {
    input.text = formatJsonValue(parsed[index].value, 2);
    input.status = { key: "common.formatted", error: false };
  });
  comparisons.value = inputs.value.slice(1).map((input, index) => ({
    id: input.id,
    number: index + 2,
    model: buildDiffViewModel(parsed[0].value, parsed[index + 1].value)
  }));
}
function fillSample() {
  inputs.value.forEach((input, index) => {
    input.historyId = "";
    input.text = JSON.stringify(index === 0
      ? { service: "api", version: 1, flags: { beta: false }, timeout: 1200, list: [1, 2] }
      : { service: "api", version: index + 1, flags: { beta: true }, retries: index + 2, list: [1, index + 2] }, null, 2);
  });
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
async function copyInput(input: JsonInput) {
  const ok = await copyText(input.text.trim());
  showToast(ok ? t("tools.jsonDiff.copiedJson") : t("common.copyBlocked"));
}
function copyLabel(index: number) {
  if (index < 2) return t(index === 0 ? "tools.jsonDiff.copyLeft" : "tools.jsonDiff.copyRight");
  return t("tools.jsonDiff.copyInput", { number: index + 1 });
}
function historyOptionLabel(entry: JsonHistoryEntry) {
  const compact = entry.text.replace(/\s+/g, " ").trim();
  const preview = compact.length > 48 ? `${compact.slice(0, 48)}…` : compact;
  const time = new Intl.DateTimeFormat(currentLocale.value, { dateStyle: "short", timeStyle: "short" }).format(entry.formattedAt);
  return `${time} · ${preview}`;
}
function loadHistory(input: JsonInput) {
  const entry = history.value.find(item => item.id === input.historyId);
  if (!entry) return;
  input.text = entry.text;
  parseInput(input);
  invalidateResults();
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
        <AppButton variant="outline" :disabled="inputs.length >= maxInputs" @click="addInput">
          <Plus :size="16" aria-hidden="true" />
          {{ t("tools.jsonDiff.addInput") }}
        </AppButton>
        <span class="status-text">{{ inputs.length }} / {{ maxInputs }}</span>
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

    <section class="diff-input-grid" :class="{ 'diff-input-grid--multiple': inputs.length > 2 }" :aria-label="t('tools.jsonDiff.inputAria')">
      <SurfaceCard v-for="(input, index) in inputs" :key="input.id" class="editor-card">
        <div class="panel-head">
          <label class="panel-title" :for="inputId(input)">JSON {{ index + 1 }}{{ index === 0 ? ` · ${t('tools.jsonDiff.baseline')}` : '' }}</label>
          <span class="panel-actions">
            <label class="sr-only" :for="historyId(input)">{{ t('tools.jsonDiff.selectHistory', { number: index + 1 }) }}</label>
            <select :id="historyId(input)" v-model="input.historyId" class="json-history-select" :disabled="!history.length" @change="loadHistory(input)">
              <option value="" disabled>{{ history.length ? t("tools.jsonDiff.history.placeholder") : t("tools.jsonDiff.history.empty") }}</option>
              <option v-for="entry in history" :key="entry.id" :value="entry.id">{{ historyOptionLabel(entry) }}</option>
            </select>
            <span class="status-text" :class="{ error: input.status.error }">{{ input.status.error ? input.status.key : t(input.status.key) }}</span>
            <button class="inline-action inline-action--icon" type="button" :aria-label="copyLabel(index)" :title="copyLabel(index)" @click="copyInput(input)">
              <Copy :size="14" aria-hidden="true" />
            </button>
            <button class="inline-action" type="button" @click="formatInput(input)">{{ t("tools.jsonDiff.format") }}</button>
            <button v-if="index >= 2" class="inline-action inline-action--icon" type="button" :aria-label="t('tools.jsonDiff.removeInput', { number: index + 1 })" :title="t('tools.jsonDiff.removeInput', { number: index + 1 })" @click="removeInput(index)">
              <X :size="14" aria-hidden="true" />
            </button>
          </span>
        </div>
        <textarea :id="inputId(input)" v-model="input.text" class="code-textarea" spellcheck="false" :placeholder="JSON.stringify({ name: 'devkit', version: index + 1 })" @input="onInput(input)" />
      </SurfaceCard>
    </section>

    <SurfaceCard tone="code" class="result-panel" aria-live="polite">
      <div class="result-head">
        <div>
          <strong>{{ t("tools.jsonDiff.resultTitle") }}</strong>
        </div>
        <AppButton variant="soft" size="sm" @click="copyResult">
          <Clipboard :size="15" aria-hidden="true" />
          {{ t("tools.jsonDiff.copyResult") }}
        </AppButton>
      </div>

      <p v-if="!comparisons.length" class="result-empty">{{ resultText }}</p>

      <section v-for="{ id, number, model } in comparisons" :key="id" class="diff-comparison">
        <h2 class="diff-comparison-title">{{ pairTitle(number) }}</h2>
        <p>{{ t("tools.jsonDiff.summary", model.summary) }}</p>
        <p v-if="!model.changes.length" class="result-empty">{{ t('tools.jsonDiff.noFieldDiff') }}</p>
        <div v-else class="semantic-diff">
          <div class="diff-summary">
            <span class="diff-stat">{{ t("tools.jsonDiff.total", { count: model.summary.total }) }}</span>
            <span class="diff-stat added">{{ t("tools.jsonDiff.added", { count: model.summary.added }) }}</span>
            <span class="diff-stat removed">{{ t("tools.jsonDiff.removed", { count: model.summary.removed }) }}</span>
            <span class="diff-stat changed">{{ t("tools.jsonDiff.changed", { count: model.summary.changed }) }}</span>
          </div>

          <div class="diff-code-grid">
            <section class="diff-code-pane">
              <strong class="diff-code-title">{{ t("tools.jsonDiff.formattedInput", { number: 1 }) }}</strong>
              <div class="json-code">
                <span v-for="line in model.leftLines" :key="`left-${line.number}`" class="json-code-line" :class="line.kind" :data-path="line.kind ? line.path : undefined">
                  <span class="json-code-number">{{ line.number }}</span>
                  <span class="json-code-text">{{ line.text }}</span>
                </span>
              </div>
            </section>

            <section class="diff-code-pane">
              <strong class="diff-code-title">{{ t("tools.jsonDiff.formattedInput", { number }) }}</strong>
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
      </section>
    </SurfaceCard>
  </div>
</template>
