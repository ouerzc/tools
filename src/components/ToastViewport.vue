<script setup lang="ts">
defineProps<{
  message: string;
  visible: boolean;
}>();
</script>

<template>
  <div class="toast" :class="{ show: visible }" role="status" aria-live="polite">
    <span>{{ message }}</span>
  </div>
</template>
