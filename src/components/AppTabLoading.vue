<template>
  <!-- ===== 异步 tab 加载占位 ===== -->
  <!-- 自身占高只用于内部居中；拦塌陷的下限在 AppProfileCenter 的 .v-window__container 上 -->
  <div class="tab-loading d-flex flex-column align-center justify-center">
    <v-progress-circular
      indeterminate
      color="primary"
      :size="display.mobile.value ? 32 : 40"
    />
    <span class="mt-3 text-caption text-grey">加载中...</span>
  </div>
</template>

<script setup>
import { useDisplay } from 'vuetify'

// ============================================================
// 数据
// ============================================================
const display = useDisplay()
</script>

<style scoped>
/* 与 AppProfileCenter 的容器下限同值，低于它占位与空态之间会露出高度差（空态实测 213） */
.tab-loading {
  min-height: 230px;
}
</style>
