<template>
  <!-- ===== B: ToolBar 中间色点行 ===== -->
  <span class="ti-root">
    <ThemeDots />
  </span>
</template>

<script setup>
// ============================================================
// 行内色点 — 绝对定位在 ToolBar 中间
// ============================================================
import ThemeDots from './ThemeDots.vue'
</script>

<style scoped lang="scss">
.ti-root {
  display: flex;
  align-items: center;
  gap: 8px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
</style>
