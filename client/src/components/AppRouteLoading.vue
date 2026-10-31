<template>
  <!-- ===== 路由级 loading ===== -->
  <!-- 不加遮罩：遮罩底过深会压掉 primary 对比度，别加回来 -->
  <v-overlay :model-value="routeLoading" :scrim="false" persistent class="align-center justify-center">
    <div class="d-flex flex-column align-center">
      <v-progress-circular
        indeterminate
        color="primary"
        :size="display.mobile.value ? 32 : 40"
      />
      <span class="mt-3 text-caption">加载中...</span>
    </div>
  </v-overlay>
</template>

<script setup>
import { useDisplay } from 'vuetify'
import { useRouteLoading } from '@/composables/useRouteLoading'

// ============================================================
// 数据
// ============================================================
const routeLoading = useRouteLoading()
const display = useDisplay()
</script>
