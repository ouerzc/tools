<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { Clipboard, Clock, RefreshCw } from "@lucide/vue";

import AppButton from "@/components/ui/AppButton.vue";
import Badge from "@/components/ui/Badge.vue";
import SurfaceCard from "@/components/ui/SurfaceCard.vue";
import { useToast } from "@/composables/useToast";
import {
  createResult,
  formatInZone,
  getOffsetLabel,
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
const inputZone = ref("Asia/Shanghai");
const displayZone = ref("Asia/Shanghai");
const status = ref("等待输入");
const isError = ref(false);
const currentDate = ref<Date | null>(null);
const result = ref<TimestampResult | null>(null);
const liveSeconds = ref("计算中");
const liveMilliseconds = ref("计算中");
const localZone = ref("Asia/Shanghai");
const showToast = useToast();
let liveTimer = 0;

const timezoneCompareZones = ["Asia/Shanghai", "UTC", "America/Los_Angeles", "Europe/London", "Asia/Tokyo"];

const resultRows = computed(() => [
  ["seconds", "Unix 秒", result.value?.seconds || "未转换"],
  ["milliseconds", "Unix 毫秒", result.value?.milliseconds || "未转换"],
  ["zoned", "显示时区", result.value?.zoned || "未转换"],
  ["utc", "UTC", result.value?.utc || "未转换"],
  ["iso", "ISO 8601", result.value?.iso || "未转换"],
  ["relative", "相对时间", result.value?.relative || "未转换"],
  ["weekday", "星期", result.value?.weekday || "未转换"],
  ["week", "周数", result.value?.week || "未转换"],
  ["dayOfYear", "年内第几天", result.value?.dayOfYear || "未转换"]
]);

const zoneStatus = computed(() => {
  if (!currentDate.value) return displayZone.value;
  return `${displayZone.value} ${getOffsetLabel(currentDate.value, displayZone.value)}`;
});

const timezoneRows = computed(() =>
  timezoneCompareZones.map(zone => ({
    zone,
    label: zone === "Asia/Shanghai" ? "上海" : zone === "America/Los_Angeles" ? "洛杉矶" : zone === "Europe/London" ? "伦敦" : zone === "Asia/Tokyo" ? "东京" : "UTC",
    value: currentDate.value ? `${formatInZone(currentDate.value, zone)} ${getOffsetLabel(currentDate.value, zone)}` : "未转换"
  }))
);

const zoneOffset = computed(() => (currentDate.value ? getOffsetLabel(currentDate.value, displayZone.value) : "计算中"));

function setStatus(message: string, error = false) {
  status.value = message;
  isError.value = error;
}

function paint(date: Date) {
  result.value = createResult(date, displayZone.value);
  currentDate.value = date;
  setStatus("已转换");
}

function convert() {
  const raw = stamp.value.trim();
  let date: Date | null = null;

  if (raw) {
    date = parseTimestamp(raw);
    if (!date) {
      setStatus("时间戳格式无效", true);
      return;
    }
  } else if (dateInput.value) {
    date = makeDateInZone(dateInput.value, inputZone.value);
  }

  if (!date || Number.isNaN(date.getTime())) {
    setStatus("请输入有效时间", true);
    return;
  }

  paint(date);
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
  paint(date);
}

function resetResults() {
  stamp.value = "";
  dateInput.value = "";
  currentDate.value = null;
  result.value = null;
  setStatus("等待输入");
}

function tickLive() {
  const now = Date.now();
  liveSeconds.value = String(Math.floor(now / 1000));
  liveMilliseconds.value = String(now);
}

async function copyValue(value: string) {
  if (value === "未转换") return;
  const ok = await copyText(value);
  showToast(ok ? "已复制" : "浏览器限制了复制权限");
}

onMounted(() => {
  const resolvedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai";
  localZone.value = resolvedZone;
  inputZone.value = zones.some(zone => zone[0] === resolvedZone) ? resolvedZone : "Asia/Shanghai";
  tickLive();
  liveTimer = window.setInterval(tickLive, 1000);
  paint(new Date());
});

onUnmounted(() => {
  window.clearInterval(liveTimer);
});
</script>

<template>
  <div class="tool-workspace">
    <section class="tool-heading">
      <div>
        <Badge tone="muted">Unix Time</Badge>
        <h1>时间戳转换</h1>
        <p>秒、毫秒、日期和时区互转。常用值可直接复制。</p>
      </div>
      <div class="tool-heading-actions">
        <AppButton variant="outline" @click="resetResults">
          <RefreshCw :size="16" aria-hidden="true" />
          清空
        </AppButton>
        <AppButton @click="convert">
          <Clock :size="16" aria-hidden="true" />
          转换
        </AppButton>
      </div>
    </section>

    <section class="timestamp-grid" aria-label="时间戳转换工具">
      <SurfaceCard>
        <div class="panel-head">
          <strong>输入</strong>
          <span class="status-text" :class="{ error: isError }">{{ status }}</span>
        </div>

        <div class="form-grid">
          <label class="field">
            <span>Unix 时间戳</span>
            <input v-model="stamp" inputmode="numeric" placeholder="1718006400 或 1718006400000" autocomplete="off" @input="dateInput = ''" />
          </label>

          <div class="inline-fields">
            <label class="field">
              <span>日期时间</span>
              <input v-model="dateInput" type="datetime-local" step="1" @input="stamp = ''" />
            </label>
            <label class="field">
              <span>输入时区</span>
              <select v-model="inputZone" @change="dateInput ? convert() : undefined">
                <option v-for="zone in zones" :key="zone[0]" :value="zone[0]">{{ zone[1] }}</option>
              </select>
            </label>
          </div>

          <label class="field">
            <span>显示时区</span>
            <select v-model="displayZone" @change="currentDate ? paint(currentDate) : undefined">
              <option v-for="zone in zones" :key="zone[0]" :value="zone[0]">{{ zone[1] }}</option>
            </select>
          </label>

          <div class="quick-block">
            <span>快捷入口</span>
            <div class="quick-actions">
              <AppButton variant="outline" size="sm" @click="setQuickDate('now')">当前时间</AppButton>
              <AppButton variant="outline" size="sm" @click="setQuickDate('today')">今天 00:00</AppButton>
              <AppButton variant="outline" size="sm" @click="setQuickDate('tomorrow')">明天 00:00</AppButton>
              <AppButton variant="outline" size="sm" @click="setQuickDate('week')">一周后</AppButton>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <div class="panel-head">
          <strong>转换结果</strong>
          <span class="status-text">{{ zoneStatus }}</span>
        </div>
        <div class="result-list">
          <div v-for="row in resultRows" :key="row[0]" class="result-row">
            <span>{{ row[1] }}</span>
            <strong>{{ row[2] }}</strong>
            <button class="inline-action" type="button" @click="copyValue(row[2])">
              <Clipboard :size="14" aria-hidden="true" />
              复制
            </button>
          </div>
        </div>
      </SurfaceCard>
    </section>

    <section class="side-grid" aria-label="额外时间功能">
      <SurfaceCard tone="subtle">
        <div class="small-card-head">
          <h2>时区对照</h2>
        </div>
        <div class="timezone-list">
          <div v-for="row in timezoneRows" :key="row.zone" class="tz-row">
            <span>{{ row.label }}</span>
            <strong>{{ row.value }}</strong>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard tone="subtle">
        <div class="small-card-head">
          <h2>开发常用</h2>
        </div>
        <div class="notes">
          <div>当前秒级时间戳：<strong>{{ liveSeconds }}</strong></div>
          <div>当前毫秒时间戳：<strong>{{ liveMilliseconds }}</strong></div>
          <div>当前本地时区：<strong>{{ localZone }}</strong></div>
          <div>显示 UTC 偏移：<strong>{{ zoneOffset }}</strong></div>
        </div>
      </SurfaceCard>
    </section>
  </div>
</template>
