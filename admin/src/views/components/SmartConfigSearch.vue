<!-- src/views/components/SmartConfigSearch.vue -->
<template>
  <!-- ===== 配置搜索 ===== -->
  <div class="smart-config-search" ref="containerRef">
    <div class="scs-input-row" :class="{ 'is-focused': isFocused }">
      <el-icon class="scs-input-icon" @click="handleIconClick"><Search /></el-icon>
      <input
        ref="inputRef"
        v-model="query"
        class="scs-input-field"
        placeholder="搜索配置项..."
        @focus="handleFocus"
        @keydown="handleKeydown"
      />
    </div>

    <div class="scs-results" ref="resultsRef" v-if="isFocused && displayList.length > 0">
      <div v-if="!query.trim()" class="scs-results-header">
        <span>最近搜索</span>
        <span class="scs-results-header-clear" @mousedown.prevent.stop="handleClearRecent">清空</span>
      </div>
      <div
        v-for="(item, index) in displayList"
        :key="index"
        class="scs-result-item"
        :class="{ 'is-active': index === activeIndex }"
        @mousedown.prevent="handleSelect(item)"
        @mouseenter="activeIndex = index"
      >
        <el-icon class="scs-result-icon"><component :is="item.icon || Setting" /></el-icon>
        <div class="scs-result-text">
          <span class="scs-result-title" v-html="highlightMatch(item)"></span>
          <span class="scs-result-desc" v-if="item.desc" v-html="highlightDesc(item)"></span>
          <span v-if="!item.isGroup" class="scs-result-path">{{ item.breadcrumb.join('  ›  ') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ============================================================
// 依赖导入
// ============================================================
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Search, Setting } from '@element-plus/icons-vue'
import { useConfigItems } from '@/views/config/configItems'
import { useConfigStore } from '@/store/config'
import PinyinMatch from 'pinyin-match'

// ============================================================
// 数据
// ============================================================
const query = ref('')
const isFocused = ref(false)
const activeIndex = ref(0)
const inputRef = ref(null)
const containerRef = ref(null)
const resultsRef = ref(null)
const recentList = ref([])
const MAX_RECENT = 5

// ============================================================
// 构建搜索索引 — 从 configItems.js 展平所有配置项
// ============================================================
const { groups } = useConfigItems()

const searchIndex = groups.flatMap(group => {
  const result = []

  // 分组本身作为一个可搜索条目
  result.push({
    groupKey: group.key,
    groupLabel: group.label,
    configKey: group.key,
    label: group.label,
    desc: `「${group.label}」分类下的全部配置项`,
    breadcrumb: [group.key],
    icon: group.icon,
    isGroup: true,
  })

  for (const item of (group.items || [])) {
    const cfgKey = item.key
    const parts = cfgKey.split('.')
    const breadcrumb = parts.length > 1
      ? [group.key, ...parts]
      : [group.key, cfgKey]

    result.push({
      groupKey: group.key,
      groupLabel: group.label,
      configKey: cfgKey,
      label: item.label,
      desc: item.desc,
      breadcrumb,
      icon: item.icon,
      isGroup: false,
    })
  }

  return result
})

// 补充 configStore 中存在但 configItems 中未声明的额外 key
const configStore = useConfigStore()
const existingKeys = new Set(searchIndex.map(s => s.configKey))

const flattenState = (obj, prefix = '') => {
  const result = []
  for (const [key, value] of Object.entries(obj || {})) {
    if (key.startsWith('$') || key === 'loading' || key === 'numberLimits') continue
    const full = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result.push(...flattenState(value, full))
    }
    if (!existingKeys.has(full)) {
      result.push({ configKey: full, value, prefix })
    }
  }
  return result
}

const extraKeys = computed(() => {
  const extras = []
  const state = configStore.$state

  for (const [topKey, topValue] of Object.entries(state)) {
    if (topKey.startsWith('$') || topKey === 'loading' || topKey === 'numberLimits') continue

    const group = groups.find(g => g.key === topKey)

    if (topValue !== null && typeof topValue === 'object' && !Array.isArray(topValue)) {
      const groupLabel = group ? group.label : topKey
      // 非已知 group 时，补一个分组条目（对齐 searchIndex 的 isGroup 条目）
      if (!group) {
        extras.push({
          groupKey: topKey, groupLabel, configKey: topKey,
          label: topKey, desc: `「${topKey}」分类下的全部配置项`,
          breadcrumb: [topKey], icon: null, isGroup: true,
        })
      }

      const flat = flattenState(topValue, topKey)
      for (const { configKey, value } of flat) {
        const parts = configKey.split('.')
        extras.push({
          groupKey: topKey, groupLabel, configKey,
          label: '', desc: typeof value === 'object' ? '对象' : String(value),
          breadcrumb: [topKey, ...parts.slice(1)],
          icon: null, isGroup: false,
        })
      }
    }
  }

  if (extras.length) console.log('SmartConfigSearch extraKeys:', extras.map(e => e.configKey))
  return extras
})

const fullSearchIndex = computed(() => [...searchIndex, ...extraKeys.value])

// ============================================================
// 搜索
// ============================================================
const filteredItems = computed(() => {
  const q = query.value.trim()
  if (!q) return []

  const lowerQ = q.toLowerCase()
  const matchText = (text) => {
    if (!text) return false
    if (text.toLowerCase().includes(lowerQ)) return true
    if (PinyinMatch.match(text, q)) return true
    return false
  }

  return fullSearchIndex.value.filter(item => {
    if (matchText(item.label)) return true
    if (matchText(item.desc)) return true
    if (matchText(item.configKey)) return true
    if (item.breadcrumb.some(b => matchText(b))) return true
    return false
  })
})

const displayList = computed(() => {
  if (query.value.trim()) return filteredItems.value
  return recentList.value.filter(r =>
    fullSearchIndex.value.some(s => s.configKey === r.configKey && s.groupKey === r.groupKey)
  )
})

// ============================================================
// 高亮
// ============================================================
const doHighlight = (text) => {
  const q = query.value.trim()
  if (!q || !text) return text

  const lowerQuery = q.toLowerCase()

  // 1. 直接包含匹配
  const idx = text.toLowerCase().indexOf(lowerQuery)
  if (idx !== -1) {
    return text.substring(0, idx) + '<strong>' + text.substring(idx, idx + q.length) + '</strong>' + text.substring(idx + q.length)
  }

  // 2. 拼音匹配 — PinyinMatch 返回 [startIndex, endIndex]
  const pinyinResult = PinyinMatch.match(text, q)
  if (pinyinResult && pinyinResult.length >= 2) {
    const from = pinyinResult[0], to = pinyinResult[1] + 1
    return text.substring(0, from) + '<strong>' + text.substring(from, to) + '</strong>' + text.substring(to)
  }

  return text
}

const highlightMatch = (item) => {
  const q = query.value.trim()
  const keyHtml = q ? doHighlight(item.configKey || '') : (item.configKey || '')
  const labelHtml = q ? doHighlight(item.label || '') : (item.label || '')
  return `<span>${keyHtml}</span><br><span>${labelHtml}</span>`
}

const highlightDesc = (item) => {
  if (!item.desc) return ''
  return doHighlight(item.desc)
}

// ============================================================
// 交互
// ============================================================
const emit = defineEmits(['select'])

const handleSelect = (item) => {
  const exists = recentList.value.findIndex(r => r.configKey === item.configKey && r.groupKey === item.groupKey)
  if (exists !== -1) recentList.value.splice(exists, 1)
  recentList.value.unshift({ configKey: item.configKey, groupKey: item.groupKey, groupLabel: item.groupLabel, label: item.label, desc: item.desc, breadcrumb: item.breadcrumb, icon: item.icon, isGroup: item.isGroup })
  if (recentList.value.length > MAX_RECENT) recentList.value.pop()

  emit('select', item)
  query.value = ''
  activeIndex.value = 0
  // 等父组件更新完 DOM 再失焦，避免 Vue patch 打断事件链路
  nextTick(() => {
    inputRef.value?.blur()
    isFocused.value = false
  })
}

const resetState = () => {
  query.value = ''
  activeIndex.value = 0
  isFocused.value = false
  inputRef.value?.blur()
}

const handleFocus = () => { isFocused.value = true; activeIndex.value = 0 }

const handleClearRecent = () => { recentList.value = [] }

const handleIconClick = () => {
  if (isFocused.value) {
    query.value = ''
    activeIndex.value = 0
  }
  inputRef.value?.focus()
}

const handleKeydown = (e) => {
  if (!isFocused.value || !displayList.value.length) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % displayList.value.length
    scrollToActive()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + displayList.value.length) % displayList.value.length
    scrollToActive()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (displayList.value[activeIndex.value]) {
      handleSelect(displayList.value[activeIndex.value])
    }
  } else if (e.key === 'Escape') {
    resetState()
  }
}

const scrollToActive = () => {
  nextTick(() => {
    const el = resultsRef.value?.querySelector('.is-active')
    el?.scrollIntoView({ block: 'nearest' })
  })
}

watch(query, () => { activeIndex.value = 0 })

// 点击外部关闭 — 对齐 SmartMenuSearch 实现
const handleClickOutside = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    resetState()
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<style scoped lang="scss">
.smart-config-search {
  position: relative;
  width: 340px;
}

.scs-input-row {
  display: flex;
  align-items: center;
  height: 24px;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color-overlay);
  transition: border-color .2s;

  &.is-focused {
    border-color: var(--el-color-primary);
  }
}

.scs-input-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
  flex-shrink: 0;
}

.scs-input-field {
  border: none;
  outline: none;
  flex: 1;
  font-size: 12px;
  background: transparent;
  color: var(--el-text-color-primary);
  line-height: 28px;

  &::placeholder {
    color: var(--el-text-color-placeholder);
  }
}

.scs-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, .1);
  max-height: 320px;
  overflow-y: auto;
  z-index: 2000;

  &::-webkit-scrollbar { width: 4px !important; }
  &::-webkit-scrollbar-thumb { background: var(--el-fill-color) !important; border-radius: 2px !important; }
  &::-webkit-scrollbar-thumb:hover { background: var(--el-border-color-hover) !important; }
  &::-webkit-scrollbar-track { background: transparent !important; }
}

.scs-results-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.scs-results-header-clear {
  cursor: pointer;
  &:hover { color: var(--el-color-primary); }
}

.scs-result-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background .1s;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child { border-bottom: none; }
  &:hover, &.is-active { background: var(--el-fill-color-light); }
}

.scs-result-icon {
  margin-top: 2px;
  color: var(--el-color-primary-light-3);
  flex-shrink: 0;
}

.scs-result-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;

  :deep(strong) {
    color: var(--el-color-primary);
  }

  small {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.scs-result-title {
  font-size: 13px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
}

.scs-result-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.3;
}

.scs-result-path {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}
</style>
