<!-- LogoStrokeScan — 镂空扫描描边，mask 从左到右流动 -->
<template>
  <div class="logo logo-tech-stroke">
    <LogoIcon :hide-image="hideImage" />
    <p
      v-if="!hideText"
      :data-text="settingStore.title"
      :style="hideImage ? {flex:'1', textAlign:'center', fontSize:'22px'} : {}"
    >{{ settingStore.title }}</p>
  </div>
</template>

<script setup>
// 全镂空 + 单组主题色流动描边 — mask 控制描边显隐从左到右扫描
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

.logo-tech-stroke p {
  position: relative;

  // 本体：全镂空，仅 --el-text-color-regular 描边
  -webkit-text-stroke: 1.5px var(--logo-text-color, var(--el-text-color-regular));
  -webkit-text-fill-color: transparent;
  color: transparent;

  // 外层：主题色描边 + mask 从左到右扫描流动
  &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    // 主题色描边，比本体略粗
    -webkit-text-stroke: 2.5px var(--el-color-primary);
    -webkit-text-fill-color: transparent;

    // 微光晕增强科技感
    text-shadow:
      0 0 8px var(--el-color-primary),
      0 0 16px var(--el-color-primary-light-3);

    // mask 从左到右扫描：只露出一段描边
    mask: linear-gradient(
      90deg,
      transparent 0%,
      transparent 32%,
      black 45%,
      black 55%,
      transparent 68%,
      transparent 100%
    );
    mask-size: 250% 100%;
    animation: tech-scan 2.5s linear infinite;

    pointer-events: none;
  }
}

@keyframes tech-scan {
  0%   { mask-position: 100% 0; }
  100% { mask-position: -150% 0; }
}
</style>
