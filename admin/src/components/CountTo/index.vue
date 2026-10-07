<!-- CountTo — 数字滚动动画，从当前显示值缓动到 endVal，显示时做 K/M 缩写 -->
<template>
  <span>{{ displayText }}</span>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  endVal: { type: Number, default: 0 },
  startVal: { type: Number, default: 0 },
  duration: { type: Number, default: 400 }
})

// easeOutCubic 缓动：数值分布比 easeOutExpo 均匀，前 1/4 时长走约 58%
const easeOutCubic = (t, b, c, d) => c * (1 - Math.pow(1 - t / d, 3)) + b

// K/M 缩写
const format = (num) => {
  const n = Math.round(num ?? 0)
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

const displayText = ref(format(props.startVal))
// 记录当前滚到哪，作为下次滚动的起点 —— 增量更新才不会每次都从 startVal 重来
let current = props.startVal
let rafId = null

const run = () => {
  cancelAnimationFrame(rafId)
  const from = current
  const to = props.endVal
  if (from === to) return
  let startTime = null
  const step = (now) => {
    if (startTime === null) startTime = now
    const progress = Math.min(now - startTime, props.duration)
    current = progress < props.duration ? easeOutCubic(progress, from, to - from, props.duration) : to
    const text = format(current)
    if (text !== displayText.value) displayText.value = text // 文本没变就不写，省掉重复渲染
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
