<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { GitCompareArrows, WandSparkles } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import SurfaceCard from "@/components/ui/SurfaceCard.vue";
import { collapseTextRows, diffText, type TextDiffRow } from "@/lib/text-diff";

const { t } = useI18n({ useScope: "global" });
const left = ref("");
const right = ref("");
const ignoreWhitespace = ref(false);
const collapse = ref(false);
const rows = ref<TextDiffRow[] | null>(null);
const error = ref(false);
const activeGroup = ref(-1);
const leftPane = ref<HTMLElement | null>(null);
const rightPane = ref<HTMLElement | null>(null);
const groups = computed(() => rows.value?.length ? Math.max(-1, ...rows.value.map(row => row.group ?? -1)) + 1 : 0);
const visibleRows = computed(() => collapseTextRows(rows.value || [], collapse.value));
const summary = computed(() => ({
  groups: groups.value,
  added: rows.value?.filter(row => row.kind === "added").length || 0,
  removed: rows.value?.filter(row => row.kind === "removed").length || 0,
  changed: rows.value?.filter(row => row.kind === "changed").length || 0
}));

watch([left, right, ignoreWhitespace], () => {
  rows.value = null;
  error.value = false;
  activeGroup.value = -1;
});

function compare() {
  try {
    rows.value = diffText(left.value, right.value, ignoreWhitespace.value);
    error.value = false;
    activeGroup.value = -1;
    if (leftPane.value) leftPane.value.scrollTop = 0;
  } catch {
    rows.value = null;
    error.value = true;
  }
}

async function fillSample() {
  left.value = 'message Request {\n  string http_code = 8; // 状态码\n  string action = 9;\n}\n';
  right.value = 'message Request {\n  optional uint32 http_code = 8; // 不传表示全部\n  string action = 9;\n  uint32 limit = 10;\n}\n';
  await nextTick();
  compare();
}

function syncScroll(event: Event, side: string) {
  const source = event.target as HTMLElement;
  const target = side === "left" ? rightPane.value : leftPane.value;
  if (!target) return;
  if (target.scrollTop !== source.scrollTop) target.scrollTop = source.scrollTop;
  if (target.scrollLeft !== source.scrollLeft) target.scrollLeft = source.scrollLeft;
}

async function navigate(direction: number) {
  if (!groups.value) return;
  activeGroup.value = activeGroup.value < 0
    ? direction > 0 ? 0 : groups.value - 1
    : (activeGroup.value + direction + groups.value) % groups.value;
  await nextTick();
  const pane = leftPane.value;
  const target = pane?.querySelector<HTMLElement>(`[data-group="${activeGroup.value}"]`);
  if (pane && target) {
    pane.scrollTop = target.offsetTop;
    if (rightPane.value) rightPane.value.scrollTop = pane.scrollTop;
  }
}
</script>

<template>
  <div class="tool-workspace">
    <section class="tool-heading">
      <div>
        <h1>{{ t('tools.textDiff.title') }}</h1>
        <p>{{ t('tools.textDiff.description') }}</p>
      </div>
      <div class="tool-heading-actions">
        <AppButton variant="outline" @click="fillSample"><WandSparkles :size="16" aria-hidden="true" />{{ t('tools.jsonDiff.fillSample') }}</AppButton>
        <AppButton @click="compare"><GitCompareArrows :size="16" aria-hidden="true" />{{ t('tools.jsonDiff.compare') }}</AppButton>
      </div>
    </section>

    <section class="diff-input-grid" :aria-label="t('tools.textDiff.inputAria')">
      <SurfaceCard class="editor-card">
        <div class="panel-head"><label class="panel-title" for="text-diff-left">{{ t('tools.textDiff.left') }}</label></div>
        <textarea id="text-diff-left" v-model="left" class="code-textarea" spellcheck="false" :placeholder="t('tools.textDiff.placeholder')" />
      </SurfaceCard>
      <SurfaceCard class="editor-card">
        <div class="panel-head"><label class="panel-title" for="text-diff-right">{{ t('tools.textDiff.right') }}</label></div>
        <textarea id="text-diff-right" v-model="right" class="code-textarea" spellcheck="false" :placeholder="t('tools.textDiff.placeholder')" />
      </SurfaceCard>
    </section>

    <div class="text-diff-options">
      <label><input v-model="ignoreWhitespace" type="checkbox" /> {{ t('tools.textDiff.ignoreWhitespace') }}</label>
      <label><input v-model="collapse" type="checkbox" /> {{ t('tools.textDiff.collapse') }}</label>
    </div>

    <SurfaceCard tone="code" class="result-panel">
      <div class="result-head">
        <strong>{{ t('tools.jsonDiff.resultTitle') }}</strong>
        <div class="panel-actions">
          <AppButton variant="soft" size="sm" :disabled="!groups" @click="navigate(-1)">{{ t('tools.textDiff.previous') }}</AppButton>
          <span v-if="groups" class="text-diff-position" aria-live="polite">{{ activeGroup + 1 }} / {{ groups }}</span>
          <AppButton variant="soft" size="sm" :disabled="!groups" @click="navigate(1)">{{ t('tools.textDiff.next') }}</AppButton>
        </div>
      </div>
      <p v-if="error" class="result-empty error" role="alert">{{ t('tools.textDiff.tooLarge') }}</p>
      <p v-else-if="rows === null" class="result-empty">{{ t('tools.textDiff.initial') }}</p>
      <template v-else>
        <p class="text-diff-summary" role="status">{{ groups ? t('tools.textDiff.summary', summary) : t('tools.textDiff.identical') }}</p>
        <div v-if="rows.length" class="text-diff-grid">
          <section v-for="side in (['left', 'right'] as const)" :key="side" class="diff-code-pane">
            <strong class="diff-code-title">{{ t(`tools.textDiff.${side}`) }}</strong>
            <div :ref="element => { if (side === 'left') leftPane = element as HTMLElement; else rightPane = element as HTMLElement; }" class="text-diff-pane" tabindex="0" role="region" :aria-label="t(`tools.textDiff.${side}`)" @scroll="syncScroll($event, side)">
              <template v-for="entry in visibleRows" :key="entry.key">
                <button v-if="entry.hidden" type="button" class="text-diff-fold" @click="collapse = false">{{ t('tools.textDiff.hidden', { count: entry.hidden }) }}</button>
                <div v-else-if="entry.row" class="text-diff-row" :class="[entry.row.kind === 'changed' ? side === 'left' ? 'removed' : 'added' : entry.row.kind, { 'text-diff-active': entry.row.group !== undefined && entry.row.group === activeGroup }]" :data-group="entry.row.group">
                  <span class="json-code-number">{{ entry.row[side]?.number }}</span>
                  <span class="text-diff-sign" aria-hidden="true">{{ entry.row.kind === 'equal' ? ' ' : side === 'left' ? entry.row.left ? '−' : ' ' : entry.row.right ? '+' : ' ' }}</span>
                  <span class="json-code-text"><span v-for="(segment, index) in entry.row[side]?.segments" :key="index" :class="{ 'text-diff-mark': segment.changed }">{{ segment.text }}</span></span>
                </div>
              </template>
            </div>
          </section>
        </div>
      </template>
    </SurfaceCard>
  </div>
</template>
