<!-- LogoNeon — 霓虹灯管多层光晕呼吸 -->
<template>
  <div class="logo logo-neon">
    <LogoIcon :hide-image="hideImage" />
    <p v-if="!hideText" :style="hideImage ? {flex:'1', textAlign:'center', fontSize:'22px'} : {}">{{ settingStore.title }}</p>
  </div>
</template>

<script setup>
// 霓虹灯管 — 4 层 text-shadow 叠加（白芯→主题色→深色光晕），不同频率微呼吸
import { useSettingStore } from '@/setting'
import LogoIcon from './LogoIcon.vue'

defineProps({
  hideImage: { type: Boolean, default: false },
  hideText: { type: Boolean, default: false }
})

const settingStore = useSettingStore()
</script>

<style scoped lang="scss">
.logo {
  @include flex(center, center, null);
  color: var(--logo-text-color, #fff);
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

.logo-neon p {
  animation: neon-flicker 4s ease-in-out infinite;
}

@keyframes neon-flicker {
  0%, 100% {
    text-shadow:
      0 0 3px var(--logo-text-color, #fff),
      0 0 8px var(--logo-text-color, #fff),
      0 0 18px var(--el-color-primary),
      0 0 36px var(--el-color-primary),
      0 0 64px var(--el-color-primary-light-3);
  }
  3% {
    text-shadow:
      0 0 3px var(--logo-text-color, #fff),
      0 0 8px var(--logo-text-color, #fff),
      0 0 18px var(--el-color-primary),
      0 0 30px var(--el-color-primary),
      0 0 56px var(--el-color-primary-light-3);
  }
  6% {
    text-shadow:
      0 0 3px var(--logo-text-color, #fff),
      0 0 10px var(--logo-text-color, #fff),
      0 0 22px var(--el-color-primary),
      0 0 42px var(--el-color-primary),
      0 0 76px var(--el-color-primary-light-3);
  }
  50% {
    text-shadow:
      0 0 4px var(--logo-text-color, #fff),
      0 0 10px var(--logo-text-color, #fff),
      0 0 24px var(--el-color-primary),
      0 0 48px var(--el-color-primary),
      0 0 80px var(--el-color-primary-light-5);
  }
}
</style>
