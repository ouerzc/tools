<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Braces, ChevronsDownUp, ChevronsUpDown, Clipboard, FileText, ListTree, Minimize2, Trash2, WandSparkles } from "@lucide/vue";

import AppButton from "@/components/ui/AppButton.vue";
import Badge from "@/components/ui/Badge.vue";
import JsonTreeNode from "@/components/tools/JsonTreeNode.vue";
import SurfaceCard from "@/components/ui/SurfaceCard.vue";
import { useToast } from "@/composables/useToast";
import type { Locale } from "@/i18n";
import { clearJsonHistory, loadJsonHistory, recordJsonHistory, type JsonHistoryEntry } from "@/lib/json-history";
import { formatJson, type JsonIndent } from "@/lib/json-format";
import { buildJsonTree, type JsonTreeNode as JsonTreeModelNode } from "@/lib/json-tree";
import { copyText } from "@/lib/utils";

const sampleJson =
  '{"name":"DevKit Hub","tools":[{"id":"json-diff","ready":true},{"id":"json-format","ready":true},{"id":"timestamp","ready":true}],"theme":{"surface":"warm","style":"shadcn"}}';

interface StatusState {
  key: string;
  values?: Record<string, string | number>;
  error: boolean;
}

const { t, locale } = useI18n({ useScope: "global" });
const input = ref("");
const indent = ref<JsonIndent>(2);
const status = ref<StatusState>({ key: "common.waiting", error: false });
const viewMode = ref<"text" | "preview">("text");
const tree = ref<JsonTreeModelNode | null>(null);
const collapsedPaths = ref<Set<string>>(new Set());
const history = ref<JsonHistoryEntry[]>(loadJsonHistory());
const selectedHistoryId = ref("");
const showToast = useToast();

const currentLocale = computed(() => locale.value as Locale);
const lineCount = computed(() => (input.value ? input.value.split("\n").length : 0));
const byteSize = computed(() => new Blob([input.value]).size);
const statusText = computed(() => t(status.value.key, status.value.values || {}));
const isError = computed(() => status.value.error);
const modeLabel = computed(() => (indent.value === 0 ? t("tools.jsonFormat.singleLine") : t("tools.jsonFormat.spaces", { count: indent.value })));
const previewEmptyText = computed(() => (isError.value ? t("tools.jsonFormat.tree.fixJson") : t("tools.jsonFormat.tree.empty")));

function setStatus(key: string, error = false, values?: Record<string, string | number>) {
  status.value = { key, error, values };
}

function setTree(value: unknown) {
  tree.value = buildJsonTree(value);
  collapsedPaths.value = new Set();
}

function clearTree() {
  tree.value = null;
  collapsedPaths.value = new Set();
}

function parseOnly() {
  selectedHistoryId.value = "";

  if (!input.value.trim()) {
    setStatus("common.waiting");
    clearTree();
    return;
  }

  const result = formatJson(input.value, indent.value, currentLocale.value);
  if (result.ok) {
    setStatus("common.jsonValid");
    setTree(result.value);
    return;
  }

  status.value = { key: result.error, error: true };
  clearTree();
}

function formatWith(nextIndent: JsonIndent, nextView: "text" | "preview" = "preview", remember = true) {
  if (!input.value.trim()) {
    setStatus("common.waiting");
    clearTree();
    return;
  }

  const result = formatJson(input.value, nextIndent, currentLocale.value);
  if (!result.ok) {
    status.value = { key: result.error, error: true };
    clearTree();
    return;
  }

  input.value = result.text;
  indent.value = result.indent;
  setTree(result.value);
  viewMode.value = nextView;
  setStatus(result.indent === 0 ? "tools.jsonFormat.status.minified" : "tools.jsonFormat.status.formatted", false, { count: result.indent });
  if (remember) {
    history.value = recordJsonHistory({ text: result.text, indent: result.indent });
    selectedHistoryId.value = history.value[0]?.id || "";
  }
}

function fillSample() {
  input.value = sampleJson;
  formatWith(2, "preview", false);
}

async function copyResult() {
  const ok = await copyText(input.value);
  showToast(ok ? t("tools.jsonFormat.copied") : t("common.copyBlocked"));
}

function togglePath(path: string) {
  const nextPaths = new Set(collapsedPaths.value);
  if (nextPaths.has(path)) {
    nextPaths.delete(path);
  } else {
    nextPaths.add(path);
  }
  collapsedPaths.value = nextPaths;
}

function collectCollapsiblePaths(node: JsonTreeModelNode, output: string[] = []) {
  if (node.collapsible) {
    output.push(node.path);
  }
  node.children.forEach(child => collectCollapsiblePaths(child, output));
  return output;
}

function collapseAll() {
  if (!tree.value) return;
  collapsedPaths.value = new Set(collectCollapsiblePaths(tree.value));
}

function expandAll() {
  collapsedPaths.value = new Set();
}

function historyPreview(entry: JsonHistoryEntry) {
  const compact = entry.text.replace(/\s+/g, " ").trim();
  return compact.length > 72 ? `${compact.slice(0, 72)}…` : compact;
}

function formatHistoryTime(entry: JsonHistoryEntry) {
  return new Intl.DateTimeFormat(currentLocale.value, { dateStyle: "short", timeStyle: "medium" }).format(entry.formattedAt);
}

function selectHistory(entry: JsonHistoryEntry) {
  input.value = entry.text;
  indent.value = entry.indent;
  selectedHistoryId.value = entry.id;

  const result = formatJson(entry.text, entry.indent, currentLocale.value);
  if (!result.ok) {
    status.value = { key: result.error, error: true };
    clearTree();
    return;
  }

  setTree(result.value);
  setStatus("tools.jsonFormat.status.historyLoaded");
}

function clearHistory() {
  clearJsonHistory();
  history.value = [];
  selectedHistoryId.value = "";
}
</script>

<template>
  <div class="tool-workspace">
    <section class="tool-heading">
      <div>
        <Badge tone="muted">{{ t("tools.jsonFormat.badge") }}</Badge>
        <h1>{{ t("tools.jsonFormat.title") }}</h1>
        <p>{{ t("tools.jsonFormat.description") }}</p>
      </div>
      <div class="tool-heading-actions">
        <AppButton variant="outline" @click="fillSample">
          <WandSparkles :size="16" aria-hidden="true" />
          {{ t("tools.jsonFormat.fillSample") }}
        </AppButton>
        <AppButton @click="formatWith(indent, 'preview')">
          <Braces :size="16" aria-hidden="true" />
          {{ t("tools.jsonFormat.format") }}
        </AppButton>
      </div>
    </section>

    <div class="formatter-layout">
      <SurfaceCard class="editor-card">
        <div class="panel-head">
          <strong>{{ t("tools.jsonFormat.panelTitle") }}</strong>
          <span class="formatter-panel-actions">
            <span class="formatter-view-toggle" role="tablist" :aria-label="t('tools.jsonFormat.viewMode')">
              <button class="inline-action" type="button" :class="{ active: viewMode === 'text' }" :aria-selected="viewMode === 'text'" @click="viewMode = 'text'">
                <FileText :size="13" aria-hidden="true" />
                {{ t("tools.jsonFormat.textView") }}
              </button>
              <button class="inline-action" type="button" :class="{ active: viewMode === 'preview' }" :aria-selected="viewMode === 'preview'" @click="viewMode = 'preview'">
                <ListTree :size="13" aria-hidden="true" />
                {{ t("tools.jsonFormat.previewView") }}
              </button>
            </span>
            <span class="status-text" :class="{ error: isError }">{{ statusText }}</span>
          </span>
        </div>
        <textarea
          v-if="viewMode === 'text'"
          v-model="input"
          class="code-textarea tall"
          spellcheck="false"
          placeholder='{"name":"devkit","tools":["diff","format","timestamp"]}'
          @input="parseOnly"
        />
        <div v-else class="json-tree-panel">
          <div class="json-tree-toolbar">
            <span>{{ tree ? t("tools.jsonFormat.tree.ready") : previewEmptyText }}</span>
            <span class="json-tree-actions">
              <button class="inline-action" type="button" :disabled="!tree" @click="collapseAll">
                <ChevronsDownUp :size="13" aria-hidden="true" />
                {{ t("tools.jsonFormat.tree.collapseAll") }}
              </button>
              <button class="inline-action" type="button" :disabled="!tree" @click="expandAll">
                <ChevronsUpDown :size="13" aria-hidden="true" />
                {{ t("tools.jsonFormat.tree.expandAll") }}
              </button>
            </span>
          </div>
          <div v-if="tree" class="json-tree-scroll" role="tree" :aria-label="t('tools.jsonFormat.tree.aria')">
            <JsonTreeNode :node="tree" :collapsed-paths="collapsedPaths" @toggle="togglePath" />
          </div>
          <p v-else class="result-empty">{{ previewEmptyText }}</p>
        </div>
      </SurfaceCard>

      <aside class="tool-side-stack">
        <SurfaceCard tone="subtle" class="control-card">
          <div class="control-row">
            <label for="indent">{{ t("tools.jsonFormat.indent") }}</label>
            <select id="indent" v-model="indent" @change="selectedHistoryId = ''">
              <option :value="2">{{ t("tools.jsonFormat.twoSpaces") }}</option>
              <option :value="4">{{ t("tools.jsonFormat.fourSpaces") }}</option>
              <option :value="0">{{ t("tools.jsonFormat.minifyOption") }}</option>
            </select>
          </div>
          <div class="button-grid">
            <AppButton variant="outline" @click="formatWith(0, 'text')">
              <Minimize2 :size="16" aria-hidden="true" />
              {{ t("tools.jsonFormat.minify") }}
            </AppButton>
            <AppButton variant="outline" @click="copyResult">
              <Clipboard :size="16" aria-hidden="true" />
              {{ t("tools.jsonFormat.copyResult") }}
            </AppButton>
          </div>
        </SurfaceCard>

        <SurfaceCard tone="subtle" class="json-history-card">
          <div class="small-card-head">
            <h2>{{ t("tools.jsonFormat.history.title") }}</h2>
            <span class="count">{{ history.length }} / 10</span>
            <button
              class="inline-action json-history-clear"
              type="button"
              :disabled="!history.length"
              @click="clearHistory"
            >
              <Trash2 :size="13" aria-hidden="true" />
              {{ t("tools.jsonFormat.history.clear") }}
            </button>
          </div>
          <div class="json-history-list">
            <p v-if="!history.length" class="history-empty">{{ t("tools.jsonFormat.history.empty") }}</p>
            <button
              v-for="entry in history"
              :key="entry.id"
              class="json-history-item"
              :class="{ active: selectedHistoryId === entry.id }"
              type="button"
              :title="entry.text"
              :aria-label="t('tools.jsonFormat.history.load', { time: formatHistoryTime(entry) })"
              @click="selectHistory(entry)"
            >
              <span class="json-history-preview">{{ historyPreview(entry) }}</span>
              <span class="json-history-time">{{ formatHistoryTime(entry) }}</span>
            </button>
          </div>
        </SurfaceCard>

        <SurfaceCard tone="subtle" class="metric-card">
          <div>
            <span>{{ t("tools.jsonFormat.lines") }}</span>
            <strong>{{ lineCount }}</strong>
          </div>
          <div>
            <span>{{ t("tools.jsonFormat.bytes") }}</span>
            <strong>{{ byteSize }}</strong>
          </div>
          <div>
            <span>{{ t("tools.jsonFormat.mode") }}</span>
            <strong>{{ modeLabel }}</strong>
          </div>
        </SurfaceCard>
      </aside>
    </div>
  </div>
</template>
