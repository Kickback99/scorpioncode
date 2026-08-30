<template>
  <!-- 全宽应用栏 -->
  <v-app-bar app color="secondary">
    <!-- 将导航内容限制在容器内 -->
    <v-container class="d-flex align-center">
      <AppHeaderDesktop v-if="!smAndDown" :categories="categories" />
      <AppHeaderMobile v-else :categories="categories" />
    </v-container>
  </v-app-bar>

  <!-- 移动端抽屉 Teleport 目标已移至 index.html（Vue 挂载前就存在于文档中） -->
  <AppLogin></AppLogin>
</template>

<script setup>
import { ref, provide, watch, onMounted } from 'vue'
import { useDisplay, useTheme } from 'vuetify'
import AppLogin from './AppLogin.vue'
import AppHeaderDesktop from './AppHeaderDesktop.vue'
import AppHeaderMobile from './AppHeaderMobile.vue'
import { useThemeStore } from '@/store/theme'

const { smAndDown } = useDisplay()
const vuetifyTheme = useTheme()
const themeStore = useThemeStore()

defineProps(['categories'])

// 移动端抽屉状态（由 AppHeaderMobile 通过 inject 读写）
const drawer = ref(false)
provide('drawer', drawer)

// ============================================================
// 主题
// ============================================================

/**
 * 初始化主题：从 Vuetify 同步到 store
 */
const initTheme = () => {
  themeStore.initTheme(vuetifyTheme)
}

// ========== 双向同步 ==========

// 监听 Store 变化，同步到 Vuetify
watch(
  () => themeStore.currentTheme,
  (newTheme) => {
    if (vuetifyTheme.global.name.value !== newTheme) {
      themeStore.applyTheme(vuetifyTheme, newTheme)
    }
  }
)

// 监听 Vuetify 变化，同步到 Store
watch(
  () => vuetifyTheme.global.name.value,
  (newTheme) => {
    if (themeStore.currentTheme !== newTheme) {
      themeStore.setTheme(newTheme)
    }
  }
)

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  initTheme()
})
</script>
