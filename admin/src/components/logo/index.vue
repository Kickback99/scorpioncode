<template>
  <!-- ===== Logo：按 logo.admin_dark_logo 渲染对应动画 ===== -->
  <LogoNeon v-if="animStyle === 'neon'" :hide-image="hideImage" :hide-text="hideText" @click="handleLogoClick" />
  <LogoMultiNeon v-else-if="animStyle === 'multi-neon'" :hide-image="hideImage" :hide-text="hideText" @click="handleLogoClick" />
  <LogoEnergyPulse v-else-if="animStyle === 'energy-pulse'" :hide-image="hideImage" :hide-text="hideText" @click="handleLogoClick" />
  <LogoStrokeScan v-else-if="animStyle === 'stroke-scan'" :hide-image="hideImage" :hide-text="hideText" @click="handleLogoClick" />
  <LogoGlitch v-else-if="animStyle === 'glitch'" :hide-image="hideImage" :hide-text="hideText" @click="handleLogoClick" />
  <div v-else class="logo logo-plain" @click="handleLogoClick">
    <LogoIcon :hide-image="hideImage" />
    <p v-if="!hideText" :style="hideImage ? {flex:'1', textAlign:'center', fontSize:'22px'} : {}">{{ settingStore.title }}</p>
  </div>
</template>

<script setup>
// ============================================================
// 依赖导入
// ============================================================
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfigStore } from '@/store/config'
import { useSettingStore } from '@/setting'
import { useUserConfigStore } from '@/store/userConfig'
import { useUserStore } from '@/store/user'
import LogoNeon from './LogoNeon.vue'
import LogoMultiNeon from './LogoMultiNeon.vue'
import LogoEnergyPulse from './LogoEnergyPulse.vue'
import LogoStrokeScan from './LogoStrokeScan.vue'
import LogoGlitch from './LogoGlitch.vue'
import LogoIcon from './LogoIcon.vue'

// ============================================================
// 数据
// ============================================================
const configStore = useConfigStore()
const settingStore = useSettingStore()
const userConfigStore = useUserConfigStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const animStyle = computed(() => {
  // 管理员：深色/主题色菜单 → 配置的动画样式；浅色 → 管理员浅色 Logo 配置
  if (userStore.isAdmin) {
    if (userConfigStore.isDarkEnabled || settingStore.menuThemeColor) return configStore.getAdminDarkLogo()
    return configStore.getAdminLightLogo()
  }

  // 非管理员：深色或主题色菜单 → 霓虹；浅色 → 用户浅色 Logo 配置
  if (userConfigStore.isDarkEnabled || settingStore.menuThemeColor) return 'neon'
  return configStore.getUserLightLogo()
})
const hideImage = computed(() => configStore.getLogoHideImage())
// 菜单折叠状态（与 ToolBar.vue 的 userConfigStore.getCollapseEnabled() 同源）
const collapsed = computed(() => userConfigStore.getCollapseEnabled())
// 折叠且未隐藏图标时，隐藏标题文字（只保留图标）
const hideText = computed(() => collapsed.value && !hideImage.value)

// ============================================================
// 事件
// ============================================================
// Logo 点击：不在首页则跳转回首页
const handleLogoClick = () => {
  if (route.path !== '/index') router.push('/index')
}
</script>

<style scoped lang="scss">
// 所有变体根节点统一可点击（子组件根节点携带父组件 scope id，普通选择器即可命中）
.logo {
  cursor: pointer;
}

.logo-plain {
  @include flex(center, center, null);
  color: var(--el-color-primary);
  font-weight: bold;
  margin: 20px 0;
  height: $base-menu-logo-height;
  padding: 5px 0;
  gap: $base-logo-gap;

  p {
    font-size: 17px;
    z-index: 1;
  }
}
</style>
