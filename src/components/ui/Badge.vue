<script setup lang="ts">
import { computed } from "vue";

import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    tone?: "default" | "muted" | "success" | "warning" | "danger";
  }>(),
  {
    tone: "default"
  }
);

const badgeClass = computed(() => cn("ui-badge", `ui-badge--${props.tone}`));
</script>

<template>
  <span :class="badgeClass">
    <slot />
  </span>
</template>
