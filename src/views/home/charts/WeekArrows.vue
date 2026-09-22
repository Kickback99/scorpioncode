<template>
  <!-- ===== 周切换控件 ===== -->
  <span v-if="periodLabel" class="chart-period">{{ periodLabel }}</span>
  <div class="chart-nav">
    <el-button size="small" text circle :disabled="leftDisabled || loading" @click="handlePrev">
      <OfflineIcon icon="ri:arrow-left-s-line"></OfflineIcon>
    </el-button>
    <el-button size="small" text circle :disabled="rightDisabled || loading" @click="handleNext">
      <OfflineIcon icon="ri:arrow-right-s-line"></OfflineIcon>
    </el-button>
    <span v-if="progressText" class="chart-progress">{{ progressText }}</span>
    <el-tooltip content="回到本周" :show-after="500">
      <el-button size="small" text circle @click="handleReset">
        <OfflineIcon icon="ri:home-8-line"></OfflineIcon>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup>
// ============================================================
import { computed } from 'vue'

// ============================================================
// 数据
// ============================================================
const props = defineProps({
  periodLabel: { type: String, default: '' },
  leftDisabled:  { type: Boolean, default: false },
  rightDisabled: { type: Boolean, default: true },
  loading:       { type: Boolean, default: false },
  offset:        { type: Number, default: 0 },
  maxOffset:     { type: Number, default: 0 },
})

const emit = defineEmits(['prev', 'next', 'reset'])

// ============================================================
// 渲染
// ============================================================
const progressText = computed(() => {
  if (props.maxOffset <= 0|| props.maxOffset > 999) return ''
  return `${props.offset} / ${props.maxOffset}`
})

const handlePrev = () => emit('prev')
const handleNext = () => emit('next')
const handleReset = () => emit('reset')
</script>

<style scoped lang="scss">
.chart-period {
  font-size: 12px; font-weight: 400;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 2px 10px; border-radius: 4px;
}

.chart-nav {
  display: flex; align-items: center; gap: 2px; margin-left: auto;
}

.chart-progress {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin: 6px;
  white-space: nowrap;
}
</style>
