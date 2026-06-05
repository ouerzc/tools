<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type Component } from "vue";
import { ArrowLeft, Braces, ChevronRight, Clock3, Command, Copy, GitCompareArrows, Moon, PanelTop, Search, Sparkles, Sun } from "@lucide/vue";

import ToastViewport from "@/components/ToastViewport.vue";
import JsonDiffTool from "@/components/tools/JsonDiffTool.vue";
import JsonFormatterTool from "@/components/tools/JsonFormatterTool.vue";
import TimestampTool from "@/components/tools/TimestampTool.vue";
import AppButton from "@/components/ui/AppButton.vue";
import Badge from "@/components/ui/Badge.vue";
import SurfaceCard from "@/components/ui/SurfaceCard.vue";
import { provideToast } from "@/composables/useToast";
import { getToolById, isToolId, tools, type ToolId, type ToolMeta } from "@/lib/tools";
import { copyText } from "@/lib/utils";

const componentMap: Record<ToolId, Component> = {
  "json-diff": JsonDiffTool,
  "json-format": JsonFormatterTool,
  timestamp: TimestampTool
};

const iconMap: Record<ToolId, Component> = {
  "json-diff": GitCompareArrows,
  "json-format": Braces,
  timestamp: Clock3
};

const searchInput = ref<HTMLInputElement | null>(null);
const query = ref("");
const activeToolId = ref<ToolId | null>(readHash());
const toast = provideToast();
const theme = ref<ThemeName>(readStoredTheme());

const activeTool = computed(() => (activeToolId.value ? getToolById(activeToolId.value) : null));
const activeComponent = computed(() => (activeToolId.value ? componentMap[activeToolId.value] : null));
const themeIcon = computed(() => (theme.value === "dark" ? Sun : Moon));
const themeToggleLabel = computed(() => (theme.value === "dark" ? "切换到白色主题" : "切换到黑色主题"));
const filteredTools = computed(() => {
  const needle = query.value.trim().toLowerCase();
  if (!needle) return tools;
  return tools.filter(tool => [tool.title, tool.description, tool.longDescription, tool.keywords, ...tool.tags].join(" ").toLowerCase().includes(needle));
});

type ThemeName = "light" | "dark";

const themeStorageKey = "devkit-theme";

function isThemeName(value: string | null): value is ThemeName {
  return value === "light" || value === "dark";
}

function readStoredTheme(): ThemeName {
  try {
    const storedTheme = window.localStorage.getItem(themeStorageKey);
    if (isThemeName(storedTheme)) return storedTheme;
  } catch {
    // Ignore storage restrictions and keep the default light theme.
  }
  return "light";
}

function applyTheme(nextTheme: ThemeName) {
  document.documentElement.dataset.theme = nextTheme;
}

function saveTheme(nextTheme: ThemeName) {
  try {
    window.localStorage.setItem(themeStorageKey, nextTheme);
  } catch {
    // Ignore storage restrictions; the in-memory theme still updates.
  }
}

function readHash() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return isToolId(hash) ? hash : null;
}

function syncFromHash() {
  activeToolId.value = readHash();
}

function openTool(id: ToolId) {
  activeToolId.value = id;
  if (window.location.hash !== `#${id}`) {
    window.location.hash = id;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goHome() {
  activeToolId.value = null;
  window.history.pushState(null, "", `${window.location.pathname}${window.location.search}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function iconForTool(id: ToolId) {
  return iconMap[id];
}

function toolHref(id: ToolId) {
  return `#${id}`;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}

function focusSearch() {
  if (activeToolId.value) {
    goHome();
  }
  window.requestAnimationFrame(() => searchInput.value?.focus());
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    focusSearch();
    return;
  }

  if (event.key === "Escape" && activeToolId.value && !isTypingTarget(event.target)) {
    goHome();
    return;
  }

  if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

  const matched = tools.find(tool => tool.shortcut.toLowerCase() === event.key.toLowerCase());
  if (matched) {
    openTool(matched.id);
  }
}

async function copyHubLink(id?: ToolId) {
  const url = new URL(window.location.href);
  url.hash = id || activeToolId.value || "";
  const ok = await copyText(url.href);
  toast.showToast(ok ? "已复制入口" : "浏览器限制了复制权限");
}

function shortcutLabel(tool: ToolMeta) {
  return `${tool.shortcut} / ${tool.kind}`;
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  applyTheme(theme.value);
  saveTheme(theme.value);
}

onMounted(() => {
  applyTheme(theme.value);
  window.addEventListener("hashchange", syncFromHash);
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("hashchange", syncFromHash);
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <a class="skip-link" href="#main-content">跳到主要内容</a>

  <div class="app-layout">
    <header class="topbar">
      <a class="brand" href="#" aria-label="DevKit Hub 首页" @click.prevent="goHome">
        <span class="mark"><Braces :size="18" aria-hidden="true" /></span>
        <span>DevKit Hub</span>
      </a>

      <nav class="nav" aria-label="主导航">
        <a href="#" :class="{ active: !activeToolId }" @click.prevent="goHome">
          <span class="nav-icon"><Braces :size="15" aria-hidden="true" /></span>
          <span>工具</span>
        </a>
        <a v-for="tool in tools" :key="tool.id" :href="toolHref(tool.id)" :class="{ active: activeToolId === tool.id }" @click.prevent="openTool(tool.id)">
          <span class="nav-icon"><component :is="iconForTool(tool.id)" :size="15" aria-hidden="true" /></span>
          <span>{{ tool.title }}</span>
        </a>
      </nav>

      <button class="theme-toggle" type="button" :aria-label="themeToggleLabel" :title="themeToggleLabel" @click="toggleTheme">
        <component :is="themeIcon" :size="17" aria-hidden="true" />
      </button>
    </header>

    <div class="app-shell">
      <main id="main-content">
        <section v-if="!activeToolId" class="home-layout" aria-labelledby="page-title">
          <div class="stack">
            <SurfaceCard class="command-panel">
              <div class="headline">
                <div>
                  <Badge tone="muted">Local-first toolkit</Badge>
                  <h1 id="page-title">开发工具</h1>
                </div>
                <span class="count">{{ filteredTools.length }} / {{ tools.length }} tools</span>
              </div>

              <div class="command-row">
                <label class="searchbox">
                  <Search :size="18" aria-hidden="true" />
                  <input ref="searchInput" v-model="query" type="search" placeholder="搜索 JSON、diff、timestamp..." autocomplete="off" />
                  <span class="kbd"><Command :size="12" aria-hidden="true" />K</span>
                </label>
                <AppButton size="lg" @click="copyHubLink()">
                  <Copy :size="16" aria-hidden="true" />
                  复制入口
                </AppButton>
              </div>

              <div class="tag-row" aria-label="常用标签">
                <Badge>JSON</Badge>
                <Badge tone="muted">Diff</Badge>
                <Badge tone="muted">Formatter</Badge>
                <Badge tone="muted">Timestamp</Badge>
              </div>
            </SurfaceCard>

            <section class="tools-grid" aria-label="工具入口" aria-live="polite">
              <button v-for="tool in filteredTools" :key="tool.id" class="tool-card" type="button" @click="openTool(tool.id)">
                <span class="tool-top">
                  <span class="tool-icon"><component :is="iconForTool(tool.id)" :size="20" aria-hidden="true" /></span>
                  <span class="tool-kind">{{ shortcutLabel(tool) }}</span>
                </span>
                <span class="tool-copy">
                  <strong>{{ tool.title }}</strong>
                  <span>{{ tool.longDescription }}</span>
                </span>
                <span class="tool-action">
                  <span>打开工具</span>
                  <ChevronRight :size="18" aria-hidden="true" />
                </span>
              </button>
            </section>

            <SurfaceCard v-if="filteredTools.length === 0" class="empty-state">
              没有匹配工具。
            </SurfaceCard>
          </div>
        </section>

        <section v-else class="active-shell">
          <div class="workspace-bar">
            <AppButton variant="outline" size="sm" @click="goHome">
              <ArrowLeft :size="15" aria-hidden="true" />
              返回工具集合
            </AppButton>
            <div v-if="activeTool" class="workspace-meta">
              <span class="tool-icon small"><component :is="iconForTool(activeTool.id)" :size="16" aria-hidden="true" /></span>
              <span>{{ activeTool.title }}</span>
            </div>
            <AppButton variant="ghost" size="sm" @click="copyHubLink()">
              <Copy :size="15" aria-hidden="true" />
              复制入口
            </AppButton>
          </div>

          <component :is="activeComponent" v-if="activeComponent" />
        </section>
      </main>
    </div>
  </div>

  <footer class="footer">
    <PanelTop :size="16" aria-hidden="true" />
    <span>DevKit Hub</span>
  </footer>

  <ToastViewport :message="toast.message.value" :visible="toast.visible.value" />
  <Sparkles class="ambient-mark" :size="18" aria-hidden="true" />
</template>
