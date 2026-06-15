<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ChevronDown, ChevronRight } from "@lucide/vue";

import type { JsonTreeNode as JsonTreeModelNode } from "@/lib/json-tree";

defineOptions({
  name: "JsonTreeNode"
});

const props = withDefaults(
  defineProps<{
    node: JsonTreeModelNode;
    collapsedPaths: Set<string>;
    depth?: number;
  }>(),
  {
    depth: 0
  }
);

const emit = defineEmits<{
  toggle: [path: string];
}>();

const { t } = useI18n({ useScope: "global" });
const isCollapsed = computed(() => props.collapsedPaths.has(props.node.path));
const toggleLabel = computed(() =>
  t(isCollapsed.value ? "tools.jsonFormat.tree.expandPath" : "tools.jsonFormat.tree.collapsePath", { path: props.node.path })
);
const rowStyle = computed(() => ({ paddingInlineStart: `${12 + props.depth * 18}px` }));

function toggleNode() {
  emit("toggle", props.node.path);
}
</script>

<template>
  <div class="json-tree-node" :data-path="node.path">
    <div class="json-tree-row" :class="`json-tree-row--${node.kind}`" :style="rowStyle">
      <button v-if="node.collapsible" class="json-tree-toggle" type="button" :aria-label="toggleLabel" @click="toggleNode">
        <ChevronRight v-if="isCollapsed" :size="14" aria-hidden="true" />
        <ChevronDown v-else :size="14" aria-hidden="true" />
      </button>
      <span v-else class="json-tree-toggle-spacer" aria-hidden="true"></span>
      <span class="json-tree-key">{{ node.key }}</span>
      <span class="json-tree-summary">{{ node.summary }}</span>
    </div>

    <div v-if="node.children.length > 0 && !isCollapsed" class="json-tree-children">
      <JsonTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :collapsed-paths="collapsedPaths"
        :depth="depth + 1"
        @toggle="emit('toggle', $event)"
      />
    </div>
  </div>
</template>
