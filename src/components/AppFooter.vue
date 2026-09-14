<template>
  <!-- ===== 底部页脚 ===== -->
  <v-footer class="app-footer" color="transparent" :style="{ '--footer-scale': scale }">
    <v-container class="py-3">
      <v-divider />
      <div class="footer-text text-medium-emphasis text-center mt-3">powered by scorpioncode</div>
    </v-container>
  </v-footer>
</template>

<script setup>
// 依赖导入
import { useDialogFontScale } from '@/composables/useDialogFontScale'

// ============================================================
// 数据
// ============================================================
// 移动端字号缩放系数（复用 4cfe2ff 引入的 composable）
const scale = useDialogFontScale(0.8)
</script>

<style scoped lang="scss">
// ============================================================
// 底部页脚
// ============================================================
.app-footer {
  // 取消 v-footer 默认 padding，由内部 v-container 统一控制边距，保证与主内容对齐
  padding: 0;

  // 覆盖 v-footer 默认的 flex: 1 1 auto：页脚不应参与纵向拉伸，
  // 否则内容不足一屏时（如刷新瞬间骨架屏）页脚被撑高、文字垂直居中，出现大量留白
  flex: 0 0 auto;

  // 桌面 15px，移动端缩小至 12px（0.9375rem * 0.8）
  .footer-text {
    font-size: calc(0.9375rem * var(--footer-scale));
  }
}
</style>
