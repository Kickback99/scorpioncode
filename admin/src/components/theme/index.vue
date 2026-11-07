<template>
  <!-- ===== 主题布局切换：按 theme_layout_mode 渲染对应变体 ===== -->
  <ThemeFloat v-if="mode === 'float'" />
  <ThemeInline v-else-if="mode === 'inline'" />
  <!-- popover: 主题色点由外部（ToolBar settings popover）直接使用 ThemeDots -->
</template>

<script setup>
// ============================================================
// 依赖导入
// ============================================================
import { computed } from 'vue'
import { useConfigStore } from '@/store/config'
import ThemeFloat from './ThemeFloat.vue'
import ThemeInline from './ThemeInline.vue'

// ============================================================
// 数据
// ============================================================
const configStore = useConfigStore()

/** 当前主题布局：float(底部浮动) | inline(行内色点) | popover(popover 内) */
const mode = computed(() => configStore.getThemeLayoutMode())
</script>
