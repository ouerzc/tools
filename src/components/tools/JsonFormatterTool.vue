<script setup lang="ts">
import { computed, ref } from "vue";
import { Braces, Clipboard, Minimize2, WandSparkles } from "@lucide/vue";

import AppButton from "@/components/ui/AppButton.vue";
import Badge from "@/components/ui/Badge.vue";
import SurfaceCard from "@/components/ui/SurfaceCard.vue";
import { useToast } from "@/composables/useToast";
import { formatJson, type JsonIndent } from "@/lib/json-format";
import { copyText } from "@/lib/utils";

const sampleJson =
  '{"name":"DevKit Hub","tools":[{"id":"json-diff","ready":true},{"id":"json-format","ready":true},{"id":"timestamp","ready":true}],"theme":{"surface":"warm","style":"shadcn"}}';

const input = ref("");
const indent = ref<JsonIndent>(2);
const status = ref("等待输入");
const isError = ref(false);
const showToast = useToast();

const lineCount = computed(() => (input.value ? input.value.split("\n").length : 0));
const byteSize = computed(() => new Blob([input.value]).size);

function setStatus(message: string, error = false) {
  status.value = message;
  isError.value = error;
}

function parseOnly() {
  if (!input.value.trim()) {
    setStatus("等待输入");
    return;
  }

  const result = formatJson(input.value, indent.value);
  if (result.ok) {
    setStatus("JSON 有效");
    return;
  }

  setStatus(result.error, true);
}

function formatWith(nextIndent: JsonIndent) {
  if (!input.value.trim()) {
    setStatus("等待输入");
    return;
  }

  const result = formatJson(input.value, nextIndent);
  if (!result.ok) {
    setStatus(result.error, true);
    return;
  }

  input.value = result.text;
  indent.value = result.indent;
  setStatus(result.indent === 0 ? "已压缩成单行" : `已格式化为 ${result.indent} 空格缩进`);
}

function fillSample() {
  input.value = sampleJson;
  formatWith(2);
}

async function copyResult() {
  const ok = await copyText(input.value);
  showToast(ok ? "已复制结果" : "浏览器限制了复制权限");
}
</script>

<template>
  <div class="tool-workspace">
    <section class="tool-heading">
      <div>
        <Badge tone="muted">Formatter</Badge>
        <h1>JSON 格式化</h1>
        <p>粘贴 JSON，选择缩进后格式化；也可以压缩成适合接口传输的单行。</p>
      </div>
      <div class="tool-heading-actions">
        <AppButton variant="outline" @click="fillSample">
          <WandSparkles :size="16" aria-hidden="true" />
          填入示例
        </AppButton>
        <AppButton @click="formatWith(indent)">
          <Braces :size="16" aria-hidden="true" />
          格式化
        </AppButton>
      </div>
    </section>

    <div class="formatter-layout">
      <SurfaceCard class="editor-card">
        <div class="panel-head">
          <strong>输入 / 输出</strong>
          <span class="status-text" :class="{ error: isError }">{{ status }}</span>
        </div>
        <textarea
          v-model="input"
          class="code-textarea tall"
          spellcheck="false"
          placeholder='{"name":"devkit","tools":["diff","format","timestamp"]}'
          @input="parseOnly"
        />
      </SurfaceCard>

      <aside class="tool-side-stack">
        <SurfaceCard tone="subtle" class="control-card">
          <div class="control-row">
            <label for="indent">缩进</label>
            <select id="indent" v-model="indent">
              <option :value="2">2 空格缩进</option>
              <option :value="4">4 空格缩进</option>
              <option :value="0">压缩成单行</option>
            </select>
          </div>
          <div class="button-grid">
            <AppButton variant="outline" @click="formatWith(0)">
              <Minimize2 :size="16" aria-hidden="true" />
              压缩
            </AppButton>
            <AppButton variant="outline" @click="copyResult">
              <Clipboard :size="16" aria-hidden="true" />
              复制结果
            </AppButton>
          </div>
        </SurfaceCard>

        <SurfaceCard tone="subtle" class="metric-card">
          <div>
            <span>行数</span>
            <strong>{{ lineCount }}</strong>
          </div>
          <div>
            <span>字节</span>
            <strong>{{ byteSize }}</strong>
          </div>
          <div>
            <span>模式</span>
            <strong>{{ indent === 0 ? "单行" : `${indent} 空格` }}</strong>
          </div>
        </SurfaceCard>
      </aside>
    </div>
  </div>
</template>
