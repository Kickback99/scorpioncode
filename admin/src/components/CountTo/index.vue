<!-- CountTo — 数字滚动动画，从 startVal 缓动滚动到 endVal，显示时做 K/M 缩写 -->
<template>
  <span>{{ displayText }}</span>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  endVal: { type: Number, default: 0 },
  startVal: { type: Number, default: 0 },
  duration: { type: Number, default: 1000 }
})

// easeOutExpo 缓动：先快后慢
const easeOutExpo = (t, b, c, d) => (c * (-Math.pow(2, (-10 * t) / d) + 1) * 1024) / 1023 + b

// K/M 缩写（与首页 formatNumber 一致）
const format = (num) => {
  const n = Math.round(num ?? 0)
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

const displayText = ref(format(props.startVal))
let rafId = null

const run = () => {
  cancelAnimationFrame(rafId)
  const from = props.startVal
  const to = props.endVal
  let startTime = null
  const step = (now) => {
    if (startTime === null) startTime = now
    const progress = Math.min(now - startTime, props.duration)
    displayText.value = format(easeOutExpo(progress, from, to - from, props.duration))
    if (progress < props.duration) {
      rafId = requestAnimationFrame(step)
    }
  }
  rafId = requestAnimationFrame(step)
}

onMounted(run)
watch(() => props.endVal, run)
onUnmounted(() => cancelAnimationFrame(rafId))
</script>
