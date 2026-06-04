<script setup lang="ts">
import { computed } from "vue";

import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    href?: string;
    variant?: "default" | "outline" | "ghost" | "soft" | "destructive";
    size?: "sm" | "md" | "lg" | "icon";
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "default",
    size: "md",
    type: "button"
  }
);

const buttonClass = computed(() => cn("ui-button", `ui-button--${props.variant}`, `ui-button--${props.size}`));
</script>

<template>
  <a v-if="href" :href="href" :class="buttonClass">
    <slot />
  </a>
  <button v-else :type="type" :class="buttonClass">
    <slot />
  </button>
</template>
