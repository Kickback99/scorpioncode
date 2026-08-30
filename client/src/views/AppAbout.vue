<template>
  <v-container class="about-page pa-0">
        <v-card class="mx-auto mt-5" rounded="xm" :style="{ '--about-scale': scale }">
          <v-card-title class="text-h5 font-weight-bold">蝎子编程</v-card-title>
          <v-card-subtitle>你好，很高兴遇见你。</v-card-subtitle>
          <v-divider></v-divider>
          <v-card-text class="text-body-1">
            这里是蝎子编程，一个分享编程知识和学习笔记的小站。欢迎有空常来看看，一起交流，一起进步。
          </v-card-text>
        </v-card>
  </v-container>
</template>

<script setup>
import { useDialogFontScale } from '@/composables/useDialogFontScale'

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
