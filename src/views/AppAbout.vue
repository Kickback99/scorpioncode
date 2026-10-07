<template>
  <v-container class="about-page pa-0">
        <!-- text 变体：去掉卡片底色与投影，标题/正文直接落在页面背景上（布局与内边距不变） -->
        <v-card class="mx-auto mt-3" variant="text" :style="{ '--about-scale': scale }">
          <v-card-title class="text-h5 font-weight-bold">{{ appTitle }}</v-card-title>
          <v-card-subtitle>你好，很高兴遇见你。</v-card-subtitle>
          <v-divider></v-divider>
          <v-card-text class="text-body-1">
            这里是{{ appTitle }}，一个分享编程知识和学习笔记的小站。欢迎有空常来看看，一起交流，一起进步。
          </v-card-text>
        </v-card>
  </v-container>
</template>

<script setup>
import { useDialogFontScale } from '@/composables/useDialogFontScale'

// ============================================================
// 数据
// ============================================================
// 应用标题：统一取自 .env 的 VITE_APP_TITLE，改一处全局生效
const appTitle = import.meta.env.VITE_APP_TITLE

const scale = useDialogFontScale(0.8)
</script>

<style scoped lang="scss">

// ============================================================
// 移动端字号缩放
// ============================================================
.v-card {
  --about-scale: 1;

  :deep(.v-card-title) {
    font-size: calc(1.5rem * var(--about-scale)) !important;
  }

  :deep(.v-card-subtitle) {
    font-size: calc(0.875rem * var(--about-scale)) !important;
  }

  :deep(.v-card-text) {
    font-size: calc(1rem * var(--about-scale)) !important;
  }
}
</style>
