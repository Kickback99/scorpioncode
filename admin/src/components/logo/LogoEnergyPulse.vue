<!-- LogoEnergyPulse — 能量脉冲，心跳式高光扫过 -->
<template>
  <div class="logo logo-energy-pulse">
    <LogoIcon :hide-image="hideImage" />
    <p v-if="!hideText" :style="hideImage ? {flex:'1', textAlign:'center', fontSize:'22px'} : {}">{{ settingStore.title }}</p>
  </div>
</template>

<script setup>
// 能量脉冲 — 文字始终 25% 亮度可见，高光带心跳式从左到右冲过
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

.logo-energy-pulse p {
  // 底色始终 25% 可见，文字不会消失
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--logo-text-color, #fff) 25%, transparent) 0%,
    color-mix(in srgb, var(--logo-text-color, #fff) 25%, transparent) 28%,
    color-mix(in srgb, var(--logo-text-color, #fff) 90%, transparent) 47%,
    var(--logo-text-color, #fff) 50%,
    color-mix(in srgb, var(--logo-text-color, #fff) 90%, transparent) 53%,
    color-mix(in srgb, var(--logo-text-color, #fff) 25%, transparent) 72%,
    color-mix(in srgb, var(--logo-text-color, #fff) 25%, transparent) 100%
  );
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;

  animation:
    energy-sweep 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite,
    energy-glow 2.8s ease-in-out infinite;
}

// 能量波扫过：蓄力→释放→间歇
@keyframes energy-sweep {
  0%, 35%, 100% { background-position: 100% 0; }  // 暗态
  52%           { background-position: 10% 0; }    // 释放
  57%           { background-position: 0% 0; }     // 峰值
  60%           { background-position: 100% 0; }   // 快速回落
}

// 光晕随脉冲膨胀收缩
@keyframes energy-glow {
  0%, 100% { text-shadow: none; }
  35%      { text-shadow: 0 0 8px var(--el-color-primary-light-5); }   // 蓄力
  50%      { text-shadow: 0 0 4px var(--logo-text-color, #fff), 0 0 16px var(--el-color-primary), 0 0 36px var(--el-color-primary-light-3); }  // 释放
  57%      { text-shadow: 0 0 4px var(--logo-text-color, #fff), 0 0 16px var(--el-color-primary), 0 0 36px var(--el-color-primary-light-3); }  // 峰值
  65%      { text-shadow: none; }                                        // 回落
}
</style>
