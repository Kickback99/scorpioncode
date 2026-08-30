<template>
  <!-- ===== 配置列表：按 config_view_mode 渲染对应变体 ===== -->
  <div class="config-list-root">
    <ConfigSidebar v-if="mode === 'sidebar'" />
    <ConfigAccordion v-else-if="mode === 'card'" />
    <ConfigCollapseTable v-else />
  </div>
</template>

<script setup>
// ============================================================
// 依赖导入
// ============================================================
import { computed } from 'vue'
import { useConfigStore } from '@/store/config'
import ConfigSidebar from './ConfigSidebar.vue'
import ConfigAccordion from './ConfigAccordion.vue'
import ConfigCollapseTable from './ConfigCollapseTable.vue'

// ============================================================
// 数据
// ============================================================
const configStore = useConfigStore()

/** 当前配置界面样式：sidebar | card（默认） | table */
const mode = computed(() => configStore.getConfigViewMode())
</script>

<style scoped>
.config-list-root {
  width: 100%;
  height: 100%;
}
</style>
