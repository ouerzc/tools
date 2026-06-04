<script setup lang="ts">
import { computed } from "vue";

import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    as?: string;
    tone?: "default" | "raised" | "code" | "subtle";
  }>(),
  {
    as: "section",
    tone: "default"
  }
);

const cardClass = computed(() => cn("surface-card", `surface-card--${props.tone}`));
</script>

<template>
  <component :is="as" :class="cardClass">
    <slot />
  </component>
</template>
