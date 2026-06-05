<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Clipboard, Clock, RefreshCw } from "@lucide/vue";

import AppButton from "@/components/ui/AppButton.vue";
import Badge from "@/components/ui/Badge.vue";
import SurfaceCard from "@/components/ui/SurfaceCard.vue";
import { useToast } from "@/composables/useToast";
import type { Locale } from "@/i18n";
import {
  createResult,
  formatZoneLabel,
  formatZoneOption,
  formatZonedDateTime,
  getOffsetLabel,
  getOffsetTimeZoneId,
  getZonedParts,
  makeDateInZone,
  pad2,
  parseTimestamp,
  zones,
  type TimestampResult
} from "@/lib/timestamp";
import { copyText } from "@/lib/utils";

const stamp = ref("");
const dateInput = ref("");
const inputZone = ref("UTC+08:00");
const displayZone = ref("UTC+08:00");
const statusKey = ref("common.waiting");
const isError = ref(false);
const currentDate = ref<Date | null>(null);
const result = ref<TimestampResult | null>(null);
const liveSeconds = ref("");
const liveMilliseconds = ref("");
const localZone = ref("UTC+08:00");
const showToast = useToast();
const { t, locale } = useI18n({ useScope: "global" });
let liveTimer = 0;
let historyId = 0;

interface ConversionHistoryItem {
  id: string;
  source: string;
  seconds: string;
  milliseconds: string;
  zoned: string;
  utc: string;
  recordedAt: string;
}

const conversionHistory = ref<ConversionHistoryItem[]>([]);

const currentLocale = computed(() => locale.value as Locale);
const statusText = computed(() => t(statusKey.value));
const liveSecondsText = computed(() => liveSeconds.value || t("tools.timestamp.status.calculating"));
const liveMillisecondsText = computed(() => liveMilliseconds.value || t("tools.timestamp.status.calculating"));
const resultRows = computed(() => [
  ["seconds", t("tools.timestamp.rows.seconds"), result.value?.seconds || t("tools.timestamp.status.notConverted")],
  ["milliseconds", t("tools.timestamp.rows.milliseconds"), result.value?.milliseconds || t("tools.timestamp.status.notConverted")],
  ["zoned", t("tools.timestamp.rows.zoned"), result.value?.zoned || t("tools.timestamp.status.notConverted")],
  ["utc", t("tools.timestamp.rows.utc"), result.value?.utc || t("tools.timestamp.status.notConverted")],
  ["iso", t("tools.timestamp.rows.iso"), result.value?.iso || t("tools.timestamp.status.notConverted")],
  ["relative", t("tools.timestamp.rows.relative"), result.value?.relative || t("tools.timestamp.status.notConverted")],
  ["weekday", t("tools.timestamp.rows.weekday"), result.value?.weekday || t("tools.timestamp.status.notConverted")],
  ["week", t("tools.timestamp.rows.week"), result.value?.week || t("tools.timestamp.status.notConverted")],
  ["dayOfYear", t("tools.timestamp.rows.dayOfYear"), result.value?.dayOfYear || t("tools.timestamp.status.notConverted")]
]);

const referenceDate = computed(() => currentDate.value || new Date());
const zoneStatus = computed(() => formatZoneLabel(displayZone.value, referenceDate.value, currentLocale.value));

const inputZoneOptions = computed(() =>
  zones.map(([zone]) => {
    const optionDate = dateInput.value ? makeDateInZone(dateInput.value, zone) || referenceDate.value : referenceDate.value;
    return {
      zone,
      label: formatZoneOption(zone, optionDate, currentLocale.value)
    };
  })
);

const displayZoneOptions = computed(() =>
  zones.map(([zone]) => ({
    zone,
    label: formatZoneOption(zone, referenceDate.value, currentLocale.value)
  }))
);

const zoneOffset = computed(() => getOffsetLabel(referenceDate.value, displayZone.value));
const activeInputMode = computed(() => (stamp.value.trim() ? "timestamp" : dateInput.value ? "date" : null));
const localZoneLabel = computed(() => formatZoneLabel(localZone.value, referenceDate.value, currentLocale.value));

function setStatus(key: string, error = false) {
  statusKey.value = key;
  isError.value = error;
}

function rememberConversion(createdResult: TimestampResult, source: string) {
  conversionHistory.value = [
    {
      id: `${Date.now()}-${historyId++}`,
      source,
      seconds: createdResult.seconds,
      milliseconds: createdResult.milliseconds,
      zoned: createdResult.zoned,
      utc: createdResult.utc,
      recordedAt: formatZonedDateTime(new Date(), localZone.value)
    },
    ...conversionHistory.value
  ].slice(0, 5);
}

function paint(date: Date, source = "手动转换", record = true) {
  const createdResult = createResult(date, displayZone.value, Date.now(), currentLocale.value);
  result.value = createdResult;
  currentDate.value = date;
  if (record) rememberConversion(createdResult, source);
  setStatus("tools.timestamp.status.converted");
}

function convert() {
  const raw = stamp.value.trim();
  let date: Date | null = null;
  let source = t("tools.timestamp.source.manual");

  if (raw) {
    date = parseTimestamp(raw);
    if (!date) {
      setStatus("tools.timestamp.status.invalidTimestamp", true);
      return;
    }
    source = t("tools.timestamp.source.timestamp", { value: raw });
  } else if (dateInput.value) {
    date = makeDateInZone(dateInput.value, inputZone.value);
    source = t("tools.timestamp.source.date", { value: dateInput.value.replace("T", " "), zone: inputZone.value });
  }

  if (!date || Number.isNaN(date.getTime())) {
    setStatus("tools.timestamp.status.invalidTime", true);
    return;
  }

  paint(date, source);
}

function fillDateInput(date: Date, zone = inputZone.value) {
  const parts = getZonedParts(date, zone);
  dateInput.value = `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
}

function setQuickDate(kind: "now" | "today" | "tomorrow" | "week") {
  const now = new Date();
  let date = now;

  if (kind === "today" || kind === "tomorrow") {
    const baseParts = getZonedParts(now, inputZone.value);
    const dayShift = kind === "tomorrow" ? 1 : 0;
    const base = new Date(Date.UTC(baseParts.year, baseParts.month - 1, baseParts.day + dayShift, 0, 0, 0));
    date =
      makeDateInZone(`${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(base.getUTCDate())}T00:00:00`, inputZone.value) || now;
  } else if (kind === "week") {
    date = new Date(now.getTime() + 7 * 86400000);
  }

  stamp.value = "";
  fillDateInput(date);
  const labels: Record<typeof kind, string> = {
    now: t("tools.timestamp.quick.now"),
    today: t("tools.timestamp.quick.today"),
    tomorrow: t("tools.timestamp.quick.tomorrow"),
    week: t("tools.timestamp.quick.week")
  };
  paint(date, labels[kind]);
}

function resetResults() {
  stamp.value = "";
  dateInput.value = "";
  currentDate.value = null;
  result.value = null;
  conversionHistory.value = [];
  setStatus("common.waiting");
}

function repaintForDisplayZone() {
  if (currentDate.value) paint(currentDate.value, t("tools.timestamp.source.displayZone", { zone: displayZone.value }));
}

function tickLive() {
  const now = Date.now();
  liveSeconds.value = String(Math.floor(now / 1000));
  liveMilliseconds.value = String(now);
}

async function copyValue(value: string) {
  if (value === t("tools.timestamp.status.notConverted")) return;
  const ok = await copyText(value);
  showToast(ok ? t("tools.timestamp.copied") : t("common.copyBlocked"));
}

watch(locale, () => {
  if (currentDate.value) {
    result.value = createResult(currentDate.value, displayZone.value, Date.now(), currentLocale.value);
  }
});

onMounted(() => {
  const resolvedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const detectedZone = getOffsetTimeZoneId(new Date(), resolvedZone);
  localZone.value = detectedZone;
  inputZone.value = detectedZone;
  displayZone.value = detectedZone;
  tickLive();
  liveTimer = window.setInterval(tickLive, 1000);
  paint(new Date(), t("tools.timestamp.source.initial"), false);
});

onUnmounted(() => {
  window.clearInterval(liveTimer);
});
</script>

<template>
  <div class="tool-workspace">
    <section class="tool-heading">
      <div>
        <Badge tone="muted">{{ t("tools.timestamp.badge") }}</Badge>
        <h1>{{ t("tools.timestamp.title") }}</h1>
        <p>{{ t("tools.timestamp.description") }}</p>
      </div>
      <div class="tool-heading-actions">
        <AppButton variant="outline" @click="resetResults">
          <RefreshCw :size="16" aria-hidden="true" />
          {{ t("tools.timestamp.clear") }}
        </AppButton>
        <AppButton @click="convert">
          <Clock :size="16" aria-hidden="true" />
          {{ t("tools.timestamp.convert") }}
        </AppButton>
      </div>
    </section>

    <section class="timestamp-grid" :aria-label="t('tools.timestamp.gridAria')">
      <SurfaceCard>
        <div class="panel-head">
          <strong>{{ t("tools.timestamp.input") }}</strong>
          <span class="status-text" :class="{ error: isError }">{{ statusText }}</span>
        </div>

        <div class="form-grid">
          <div class="input-mode-grid" :aria-label="t('tools.timestamp.inputModeAria')">
            <section class="input-mode-card" :class="{ active: activeInputMode === 'timestamp', muted: activeInputMode === 'date' }" aria-labelledby="timestamp-input-title">
              <div class="input-mode-head">
                <span class="input-mode-mark">T</span>
                <div>
                  <strong id="timestamp-input-title">{{ t("tools.timestamp.timestampToDate") }}</strong>
                  <span>{{ t("tools.timestamp.secondsOrMilliseconds") }}</span>
                </div>
              </div>
              <label class="field">
                <span>{{ t("tools.timestamp.unixTimestamp") }}</span>
                <input v-model="stamp" inputmode="numeric" :placeholder="t('tools.timestamp.timestampPlaceholder')" autocomplete="off" @input="dateInput = ''" />
              </label>
            </section>

            <div class="input-mode-divider" aria-hidden="true">
              <span>{{ t("tools.timestamp.or") }}</span>
            </div>

            <section class="input-mode-card" :class="{ active: activeInputMode === 'date', muted: activeInputMode === 'timestamp' }" aria-labelledby="date-input-title">
              <div class="input-mode-head">
                <span class="input-mode-mark">D</span>
                <div>
                  <strong id="date-input-title">{{ t("tools.timestamp.dateToTimestamp") }}</strong>
                  <span>{{ t("tools.timestamp.dateWithZone") }}</span>
                </div>
              </div>
              <label class="field">
                <span>{{ t("tools.timestamp.dateTime") }}</span>
                <input v-model="dateInput" type="datetime-local" step="1" @input="stamp = ''" />
              </label>
              <label class="field">
                <span>{{ t("tools.timestamp.inputZone") }}</span>
                <select v-model="inputZone" @change="dateInput ? convert() : undefined">
                  <option v-for="zone in inputZoneOptions" :key="zone.zone" :value="zone.zone">{{ zone.label }}</option>
                </select>
              </label>
            </section>
          </div>

          <div class="output-settings">
            <label class="field">
              <span>{{ t("tools.timestamp.displayZone") }}</span>
              <select v-model="displayZone" @change="repaintForDisplayZone">
                <option v-for="zone in displayZoneOptions" :key="zone.zone" :value="zone.zone">{{ zone.label }}</option>
              </select>
            </label>
          </div>

          <div class="quick-block">
            <span>{{ t("tools.timestamp.quickActions") }}</span>
            <div class="quick-actions">
              <AppButton variant="outline" size="sm" @click="setQuickDate('now')">{{ t("tools.timestamp.quick.now") }}</AppButton>
              <AppButton variant="outline" size="sm" @click="setQuickDate('today')">{{ t("tools.timestamp.quick.today") }}</AppButton>
              <AppButton variant="outline" size="sm" @click="setQuickDate('tomorrow')">{{ t("tools.timestamp.quick.tomorrow") }}</AppButton>
              <AppButton variant="outline" size="sm" @click="setQuickDate('week')">{{ t("tools.timestamp.quick.week") }}</AppButton>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <div class="panel-head">
          <strong>{{ t("tools.timestamp.resultTitle") }}</strong>
          <span class="status-text">{{ zoneStatus }}</span>
        </div>
        <div class="result-list">
          <div v-for="row in resultRows" :key="row[0]" class="result-row">
            <span>{{ row[1] }}</span>
            <strong>{{ row[2] }}</strong>
            <button class="inline-action" type="button" @click="copyValue(row[2])">
              <Clipboard :size="14" aria-hidden="true" />
              {{ t("common.copy") }}
            </button>
          </div>
        </div>
      </SurfaceCard>
    </section>

    <section class="side-grid" :aria-label="t('tools.timestamp.extraAria')">
      <SurfaceCard tone="subtle">
        <div class="small-card-head">
          <h2>{{ t("tools.timestamp.history.title") }}</h2>
          <span class="count">{{ conversionHistory.length }} / 5</span>
        </div>
        <div class="history-list">
          <p v-if="!conversionHistory.length" class="history-empty">{{ t("tools.timestamp.history.empty") }}</p>
          <template v-else>
            <div v-for="item in conversionHistory" :key="item.id" class="history-row">
              <div class="history-main">
                <span>{{ item.source }}</span>
                <strong>{{ item.zoned }}</strong>
              </div>
              <div class="history-meta">
                <span>{{ t("tools.timestamp.history.seconds", { value: item.seconds }) }}</span>
                <span>{{ t("tools.timestamp.history.milliseconds", { value: item.milliseconds }) }}</span>
                <span>{{ item.utc }}</span>
                <span>{{ t("tools.timestamp.history.recorded", { value: item.recordedAt }) }}</span>
              </div>
            </div>
          </template>
        </div>
      </SurfaceCard>

      <SurfaceCard tone="subtle">
        <div class="small-card-head">
          <h2>{{ t("tools.timestamp.devCommon.title") }}</h2>
        </div>
        <div class="notes">
          <div>{{ t("tools.timestamp.devCommon.seconds") }}<strong>{{ liveSecondsText }}</strong></div>
          <div>{{ t("tools.timestamp.devCommon.milliseconds") }}<strong>{{ liveMillisecondsText }}</strong></div>
          <div>{{ t("tools.timestamp.devCommon.localZone") }}<strong>{{ localZoneLabel }}</strong></div>
          <div>{{ t("tools.timestamp.devCommon.offset") }}<strong>{{ zoneOffset }}</strong></div>
        </div>
      </SurfaceCard>
    </section>
  </div>
</template>
