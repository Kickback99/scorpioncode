<!-- LogoIcon — logo 图标统一封装，换图标/改尺寸/改颜色/调显隐/改 style 只改这一处 -->
<template>
  <SvgIcon
    v-if="!hideImage"
    name="scorpioncode"
    width="30"
    height="30"
    fill="var(--el-color-primary)"
  />
</template>

<script setup>
import { useUserConfigStore } from '@/store/userConfig'

// ============================================================
// 数据
// ============================================================
defineProps({
  hideImage: { type: Boolean, default: false }
})

const userConfigStore = useUserConfigStore()
</script>
