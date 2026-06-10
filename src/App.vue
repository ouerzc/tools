<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type Component } from "vue";
import { useI18n } from "vue-i18n";
import {
  ArrowLeft,
  Braces,
  ChevronRight,
  Clock3,
  Command,
  Copy,
  GitCompareArrows,
  Languages,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelTop,
  Search,
  Sun
} from "@lucide/vue";

import ToastViewport from "@/components/ToastViewport.vue";
import JsonDiffTool from "@/components/tools/JsonDiffTool.vue";
import JsonFormatterTool from "@/components/tools/JsonFormatterTool.vue";
import TimestampTool from "@/components/tools/TimestampTool.vue";
import AppButton from "@/components/ui/AppButton.vue";
import SurfaceCard from "@/components/ui/SurfaceCard.vue";
import { provideToast } from "@/composables/useToast";
import { localeLabels, setAppLocale, supportedLocales, type Locale } from "@/i18n";
import { getLocalizedToolById, getLocalizedTools, isToolId, tools, type ToolId, type ToolMeta } from "@/lib/tools";
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

type ThemeName = "light" | "dark";

const themeStorageKey = "devkit-theme";
const sidebarStorageKey = "devkit-sidebar-collapsed";

const searchInput = ref<HTMLInputElement | null>(null);
const query = ref("");
const activeToolId = ref<ToolId | null>(readHash());
const toast = provideToast();
const theme = ref<ThemeName>(readStoredTheme());
const sidebarCollapsed = ref(readStoredSidebarState());
const { t, locale } = useI18n({ useScope: "global" });
let pendingGlassPointer: { target: EventTarget | null; clientX: number; clientY: number } | null = null;
let glassPointerFrame = 0;

const translate = (key: string, values?: Record<string, string | number>) => t(key, values || {});

const selectedLocale = computed({
  get: () => locale.value as Locale,
  set: nextLocale => {
    setAppLocale(nextLocale);
  }
});
const localizedTools = computed(() => getLocalizedTools(translate));
const activeTool = computed(() => (activeToolId.value ? getLocalizedToolById(activeToolId.value, translate) : null));
const activeComponent = computed(() => (activeToolId.value ? componentMap[activeToolId.value] : null));
const themeIcon = computed(() => (theme.value === "dark" ? Sun : Moon));
const themeToggleLabel = computed(() => (theme.value === "dark" ? t("app.theme.toLight") : t("app.theme.toDark")));
const sidebarToggleIcon = computed(() => (sidebarCollapsed.value ? PanelLeftOpen : PanelLeftClose));
const sidebarToggleLabel = computed(() => (sidebarCollapsed.value ? t("app.sidebar.expand") : t("app.sidebar.collapse")));
const filteredTools = computed(() => {
  const needle = query.value.trim().toLowerCase();
  if (!needle) return localizedTools.value;
  return localizedTools.value.filter(tool => [tool.title, tool.description, tool.longDescription, tool.keywords, ...tool.tags].join(" ").toLowerCase().includes(needle));
});

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

function readStoredSidebarState() {
  try {
    return window.localStorage.getItem(sidebarStorageKey) === "true";
  } catch {
    return false;
  }
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

function saveSidebarState(nextCollapsed: boolean) {
  try {
    window.localStorage.setItem(sidebarStorageKey, String(nextCollapsed));
  } catch {
    // Ignore storage restrictions; the in-memory sidebar state still updates.
  }
}

function readHash() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return isToolId(hash) ? hash : null;
}

function syncFromHash() {
  activeToolId.value = readHash();
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function flushGlassPointer() {
  glassPointerFrame = 0;
  const pointer = pendingGlassPointer;
  pendingGlassPointer = null;
  if (!pointer || !(pointer.target instanceof Element)) return;

  const glass = pointer.target.closest<HTMLElement>(".glass, .glass-overlay");
  if (!glass) return;

  const rect = glass.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const x = ((pointer.clientX - rect.left) / rect.width) * 100;
  const y = ((pointer.clientY - rect.top) / rect.height) * 100;
  glass.style.setProperty("--glass-mx", `${Math.min(100, Math.max(0, x)).toFixed(2)}%`);
  glass.style.setProperty("--glass-my", `${Math.min(100, Math.max(0, y)).toFixed(2)}%`);
}

function handleGlassPointerMove(event: PointerEvent) {
  pendingGlassPointer = { target: event.target, clientX: event.clientX, clientY: event.clientY };
  if (!glassPointerFrame) {
    glassPointerFrame = window.requestAnimationFrame(flushGlassPointer);
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

function openTool(id: ToolId) {
  activeToolId.value = id;
  if (window.location.hash !== `#${id}`) {
    window.location.hash = id;
  }
  scrollToTop();
}

function goHome() {
  activeToolId.value = null;
  window.history.pushState(null, "", `${window.location.pathname}${window.location.search}`);
  scrollToTop();
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
  toast.showToast(ok ? t("app.toast.entryCopied") : t("app.toast.copyBlocked"));
}

function shortcutLabel(tool: ToolMeta) {
  return `${tool.shortcut} / ${tool.kind}`;
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  applyTheme(theme.value);
  saveTheme(theme.value);
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  saveSidebarState(sidebarCollapsed.value);
}

onMounted(() => {
  applyTheme(theme.value);
  window.addEventListener("hashchange", syncFromHash);
  window.addEventListener("keydown", handleKeydown);
  if (!prefersReducedMotion()) {
    document.addEventListener("pointermove", handleGlassPointerMove);
  }
});

onUnmounted(() => {
  window.removeEventListener("hashchange", syncFromHash);
  window.removeEventListener("keydown", handleKeydown);
  document.removeEventListener("pointermove", handleGlassPointerMove);
  if (glassPointerFrame) {
    window.cancelAnimationFrame(glassPointerFrame);
  }
});
</script>

<template>
  <div class="wallpaper" aria-hidden="true"></div>
  <a class="skip-link" href="#main-content">{{ t("app.skipLink") }}</a>

  <div class="app-layout" :class="{ 'app-layout--sidebar-collapsed': sidebarCollapsed }">
    <header class="topbar glass" :class="{ 'topbar--collapsed': sidebarCollapsed }">
      <div class="topbar-head">
        <a class="brand" href="#" :aria-label="t('app.brandHome')" title="DevKit Hub" @click.prevent="goHome">
          <span class="mark"><Braces :size="18" aria-hidden="true" /></span>
          <span>DevKit Hub</span>
        </a>

        <button class="sidebar-toggle" type="button" :aria-label="sidebarToggleLabel" :title="sidebarToggleLabel" @click="toggleSidebar">
          <component :is="sidebarToggleIcon" :size="17" aria-hidden="true" />
        </button>
      </div>

      <nav class="nav" :aria-label="t('app.nav.aria')">
        <a href="#" :class="{ active: !activeToolId }" :title="t('app.nav.tools')" @click.prevent="goHome">
          <span class="nav-icon"><Braces :size="15" aria-hidden="true" /></span>
          <span>{{ t("app.nav.tools") }}</span>
        </a>
        <a v-for="tool in localizedTools" :key="tool.id" :href="toolHref(tool.id)" :class="{ active: activeToolId === tool.id }" :title="tool.title" @click.prevent="openTool(tool.id)">
          <span class="nav-icon"><component :is="iconForTool(tool.id)" :size="15" aria-hidden="true" /></span>
          <span>{{ tool.title }}</span>
        </a>
      </nav>

      <div class="sidebar-actions">
        <label class="locale-switcher" :title="t('app.locale.title')">
          <Languages :size="16" aria-hidden="true" />
          <select v-model="selectedLocale" class="locale-select" :aria-label="t('app.locale.ariaLabel')">
            <option v-for="nextLocale in supportedLocales" :key="nextLocale" :value="nextLocale">
              {{ localeLabels[nextLocale] }}
            </option>
          </select>
        </label>

        <button class="theme-toggle" type="button" :aria-label="themeToggleLabel" :title="themeToggleLabel" @click="toggleTheme">
          <component :is="themeIcon" :size="17" aria-hidden="true" />
        </button>
      </div>
    </header>

    <div class="app-shell">
      <main id="main-content">
        <section v-if="!activeToolId" class="home-layout" aria-labelledby="page-title">
          <div class="stack">
            <SurfaceCard class="command-panel" tone="subtle">
              <div class="command-strip">
                <div class="command-title-group">
                  <span class="command-title-icon"><Braces :size="17" aria-hidden="true" /></span>
                  <div>
                    <h1 id="page-title">{{ t("app.home.title") }}</h1>
                    <span>{{ t("app.home.count", { shown: filteredTools.length, total: tools.length }) }}</span>
                  </div>
                </div>

                <label class="searchbox command-search">
                  <Search :size="18" aria-hidden="true" />
                  <input ref="searchInput" v-model="query" type="search" :placeholder="t('app.home.searchPlaceholder')" autocomplete="off" />
                  <span class="kbd"><Command :size="12" aria-hidden="true" />K</span>
                </label>

                <AppButton class="command-copy" size="md" @click="copyHubLink()">
                  <Copy :size="16" aria-hidden="true" />
                  {{ t("app.home.copyEntry") }}
                </AppButton>
              </div>
            </SurfaceCard>

            <section class="tools-grid" :aria-label="t('app.home.toolsAria')" aria-live="polite">
              <button v-for="tool in filteredTools" :key="tool.id" class="tool-card glass" type="button" @click="openTool(tool.id)">
                <span class="tool-top">
                  <span class="tool-icon"><component :is="iconForTool(tool.id)" :size="20" aria-hidden="true" /></span>
                  <span class="tool-kind">{{ shortcutLabel(tool) }}</span>
                </span>
                <span class="tool-copy">
                  <strong>{{ tool.title }}</strong>
                  <span>{{ tool.longDescription }}</span>
                </span>
                <span class="tool-action">
                  <span>{{ t("app.home.openTool") }}</span>
                  <ChevronRight :size="18" aria-hidden="true" />
                </span>
              </button>
            </section>

            <SurfaceCard v-if="filteredTools.length === 0" class="empty-state">
              {{ t("app.home.noMatches") }}
            </SurfaceCard>
          </div>
        </section>

        <section v-else class="active-shell">
          <div class="workspace-bar glass">
            <AppButton variant="outline" size="sm" @click="goHome">
              <ArrowLeft :size="15" aria-hidden="true" />
              {{ t("app.workspace.back") }}
            </AppButton>
            <div v-if="activeTool" class="workspace-meta">
              <span class="tool-icon small"><component :is="iconForTool(activeTool.id)" :size="16" aria-hidden="true" /></span>
              <span>{{ activeTool.title }}</span>
            </div>
            <AppButton variant="ghost" size="sm" @click="copyHubLink()">
              <Copy :size="15" aria-hidden="true" />
              {{ t("app.workspace.copyEntry") }}
            </AppButton>
          </div>

          <component :is="activeComponent" v-if="activeComponent" />
        </section>
      </main>
    </div>
  </div>

  <footer class="footer">
    <PanelTop :size="16" aria-hidden="true" />
    <span>{{ t("app.footer") }}</span>
  </footer>

  <ToastViewport :message="toast.message.value" :visible="toast.visible.value" />
</template>
