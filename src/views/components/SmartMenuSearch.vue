<!-- src/views/components/SmartMenuSearch.vue -->
<template>
  <!-- ===== 菜单搜索 ===== -->
  <div class="smart-menu-search" ref="containerRef">
    <div class="search-input-row" :class="{ 'is-focused': isFocused }">
      <el-icon class="search-input-icon" @click="handleIconClick"><Search /></el-icon>
      <input
        ref="inputRef"
        v-model="query"
        class="search-input-field"
        placeholder="搜索菜单..."
        @focus="handleFocus"
        @keydown="handleKeydown"
      />
    </div>

    <div class="search-results" ref="resultsRef" v-if="isFocused && displayList.length > 0">
      <div v-if="!query.trim()" class="results-header">
        <span>最近访问</span>
        <span class="results-header-clear" @mousedown.prevent.stop="handleClearRecent">清空</span>
      </div>
      <div
        v-for="(item, index) in displayList"
        :key="index"
        class="result-item"
        :class="{ 'is-active': index === activeIndex }"
        @mousedown.prevent="navigateTo(item)"
        @mouseenter="activeIndex = index"
      >
        <el-icon class="result-item-icon">
          <SingleIcon :icon="item.icon || 'ep:menu'" />
        </el-icon>
        <div class="result-item-text">
          <span class="result-item-title" v-html="highlight(item.title)"></span>
          <span class="result-item-breadcrumb">{{ item.breadcrumb.join(' › ') }}</span>
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
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { useConfigStore } from '@/store/config'
import PinyinMatch from 'pinyin-match'

const router = useRouter()
const userStore = useUserStore()
const configStore = useConfigStore()

// ============================================================
// Props
// ============================================================
const props = defineProps({
  /** 回车行为：navigate=跳转路由, expand=展开菜单 emit('expand-menu', item) */
  actionMode: {
    type: String,
    default: 'navigate',
    validator: (v) => ['navigate', 'expand'].includes(v),
  },
})

const emit = defineEmits(['expand-menu'])

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
// 菜单扁平化
// ============================================================

/**
 * 将 userMenu 树递归展平为可搜索的菜单项列表
 * 父级菜单（Layout / ParentView）解析到第一个子叶路径用于导航
 */
const flattenMenu = (menus, typePrefix = '', parentPath = '', breadcrumb = []) => {
  const result = []

  for (const menu of menus) {
    if (menu.hidden) continue

    const title = menu.meta?.title || menu.path || ''
    const icon = menu.meta?.icon || 'ep:menu'
    const currentBreadcrumb = [...breadcrumb, title]
    const currentType = menu.type || typePrefix
    // Layout / ParentView 识别：routesHandler 解析后 component 不再是字符串，改用 children[0].level 判断
    const isParentView = menu.children?.[0]?.level === true
    const isList = menu.component === 'list'

    if (menu.children && menu.children.length > 0 && !isList) {
      const firstLeafPath = resolveFirstLeaf(menu, currentType)
      result.push({ title, icon, path: firstLeafPath, breadcrumb: currentBreadcrumb })

      const childOptions = flattenMenu(
        menu.children,
        currentType,
        isParentView ? menu.path : '',
        currentBreadcrumb,
      )
      result.push(...childOptions)
    } else {
      let fullPath
      if (menu._addToParentNode) {
        fullPath = `/${currentType}`
      } else if (parentPath) {
        fullPath = `/${currentType}/${parentPath}/${menu.path}`
      } else {
        fullPath = `/${currentType}/${menu.path}`
      }

      result.push({ title, icon, path: fullPath, breadcrumb: currentBreadcrumb })
    }
  }

  return result
}

const resolveFirstLeaf = (menu, typePrefix) => {
  if (!menu.children || menu.children.length === 0) {
    if (menu._addToParentNode) return `/${typePrefix}`
    return `/${typePrefix}/${menu.path}`
  }
  const firstChild = menu.children[0]
  const isParentView = menu.children?.[0]?.level === true
  const parentPath = isParentView ? menu.path : ''
  return resolveChildPath(firstChild, typePrefix, parentPath)
}

const resolveChildPath = (menu, typePrefix, parentPath) => {
  if (menu.children && menu.children.length > 0 && menu.component !== 'list') {
    const isParentView = menu.children?.[0]?.level === true
    const nextParent = isParentView ? menu.path : parentPath
    return resolveChildPath(menu.children[0], typePrefix, nextParent)
  }
  if (menu._addToParentNode) return `/${typePrefix}`
  if (parentPath) return `/${typePrefix}/${parentPath}/${menu.path}`
  return `/${typePrefix}/${menu.path}`
}

const allMenuItems = computed(() => flattenMenu(userStore.userMenu))

// ============================================================
// 搜索
// ============================================================

const filteredItems = computed(() => {
  const q = query.value.trim()
  if (!q) return []

  const lowerQ = q.toLowerCase()
  return allMenuItems.value.filter(item => {
    const text = item.title
    const lowerText = text.toLowerCase()

    if (lowerText.includes(lowerQ)) return true
    if (PinyinMatch.match(text, q)) return true

    return false
  })
})

const displayList = computed(() => {
  if (query.value.trim()) return filteredItems.value
  return recentList.value.filter(item =>
    allMenuItems.value.some(m => m.path === item.path),
  )
})

const highlight = (text) => {
  const q = query.value.trim()
  if (!q || !text) return text

  const lowerText = text.toLowerCase()
  const lowerQuery = q.toLowerCase()

  // 1. 英文/中文直接包含匹配（优先）
  const idx = lowerText.indexOf(lowerQuery)
  if (idx !== -1) {
    const before = text.substring(0, idx)
    const match = text.substring(idx, idx + q.length)
    const after = text.substring(idx + q.length)
    return `${before}<strong>${match}</strong>${after}`
  }

  // 2. PinyinMatch（中文拼音）— 返回 [startIndex, endIndex]
  const pinyinResult = PinyinMatch.match(text, q)
  if (pinyinResult && pinyinResult.length >= 2) {
    const from = pinyinResult[0], to = pinyinResult[1] + 1
    return text.substring(0, from) + '<strong>' + text.substring(from, to) + '</strong>' + text.substring(to)
  }

  // 3. 复合词首字母匹配
  const words = text.split(/[\s\-_\.\/]+/)
  if (words.length > 1) {
    const initials = words.map(w => w[0]).join('').toLowerCase()
    if (initials.includes(lowerQuery)) {
      let html = ''
      let currentPos = 0
      const queryChars = lowerQuery.split('')
      let queryIdx = 0

      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        if (i > 0) {
          const sepMatch = text.substring(currentPos).match(/[\s\-_\.\/]+/)
          if (sepMatch) {
            html += sepMatch[0]
            currentPos += sepMatch[0].length
          }
        }
        if (queryIdx < queryChars.length && word[0].toLowerCase() === queryChars[queryIdx]) {
          html += `<strong>${word[0]}</strong>`
          html += word.substring(1)
          queryIdx++
        } else {
          html += word
        }
        currentPos += word.length
      }
      return html
    }
  }

  // 4. 单词内字符跳位匹配
  if (lowerQuery.length > 1) {
    let html = ''
    let lastIdx = 0
    let queryIdx = 0
    for (let i = 0; i < text.length && queryIdx < lowerQuery.length; i++) {
      if (text[i].toLowerCase() === lowerQuery[queryIdx]) {
        if (i > lastIdx) html += text.substring(lastIdx, i)
        html += `<strong>${text[i]}</strong>`
        lastIdx = i + 1
        queryIdx++
      }
    }
    if (queryIdx === lowerQuery.length) {
      if (lastIdx < text.length) html += text.substring(lastIdx)
      return html
    }
  }

  return text
}

// ============================================================
// 导航
// ============================================================

const navigateTo = (item) => {
  const exists = recentList.value.findIndex(r => r.path === item.path)
  if (exists !== -1) recentList.value.splice(exists, 1)
  recentList.value.unshift({ title: item.title, path: item.path, icon: item.icon, breadcrumb: item.breadcrumb })
  if (recentList.value.length > MAX_RECENT) recentList.value.pop()

  if (props.actionMode === 'expand') {
    emit('expand-menu', { ...item })
    nextTick(() => resetState())
  } else {
    router.push(item.path)
    if (!configStore.getSearchMenuFocus()) {
      resetState()
    } else {
      query.value = ''
      activeIndex.value = 0
    }
  }
}

// ============================================================
// 交互
// ============================================================

const resetState = () => {
  query.value = ''
  isFocused.value = false
  activeIndex.value = 0
  inputRef.value?.blur()
}

const handleFocus = () => {
  isFocused.value = true
  activeIndex.value = 0
}

const handleClearRecent = () => {
  recentList.value = []
}

const handleIconClick = () => {
  if (isFocused.value) {
    query.value = ''
    activeIndex.value = 0
  }
  inputRef.value?.focus()
}

/**
 * 键盘导航时，将高亮项滚动到可视区域
 */
const scrollToHighlighted = (index) => {
  nextTick(() => {
    if (!resultsRef.value) return
    const items = resultsRef.value.querySelectorAll('.result-item')
    if (!items.length || index < 0 || index >= items.length) return
    items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

const handleKeydown = (e) => {
  const list = displayList.value

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeIndex.value = Math.min(activeIndex.value + 1, list.length - 1)
      scrollToHighlighted(activeIndex.value)
      break
    case 'ArrowUp':
      e.preventDefault()
      activeIndex.value = Math.max(activeIndex.value - 1, 0)
      scrollToHighlighted(activeIndex.value)
      break
    case 'Enter':
      e.preventDefault()
      if (list.length > 0 && activeIndex.value >= 0) {
        navigateTo(list[activeIndex.value])
      }
      break
    case 'Escape':
      inputRef.value?.blur()
      resetState()
      break
  }
}

watch(query, () => { activeIndex.value = 0 })

const handleClickOutside = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    resetState()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped lang="scss">
.smart-menu-search {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
  margin-left: 12px;
}

// ============================================================
// 搜索输入框（始终显示）
// ============================================================
.search-input-row {
  display: flex;
  align-items: center;
  height: 24px;
  width: 200px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
  transition: border-color 0.25s;

  &.is-focused {
    border-color: var(--el-color-primary);
  }
}

.search-input-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

.search-input-field {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 12px;
  color: var(--el-text-color-regular);
  padding-right: 8px;

  &::placeholder {
    color: var(--el-text-color-placeholder);
  }
}

// ============================================================
// 下拉结果（输入框下方弹出）
// ============================================================
.search-results {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 3000;

  &::-webkit-scrollbar {
    width: 4px !important;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--el-fill-color) !important;
    border-radius: 2px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--el-border-color-hover) !important;
  }
  &::-webkit-scrollbar-track {
    background: transparent !important;
  }
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.5px;

  .results-header-clear {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover,
  &.is-active {
    background: var(--el-fill-color-light);
  }

  .result-item-icon {
    flex-shrink: 0;
    font-size: 18px;
    color: var(--el-text-color-regular);
  }

  .result-item-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .result-item-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);

    :deep(strong) {
      color: var(--el-color-primary);
    }
  }

  .result-item-breadcrumb {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>

<style lang="scss">
/* ===== SmartMenuSearch ui-mode 适配（非 scoped，匹配 html 上的 .ui-full / .ui-plain） ===== */

/* full — 键盘/鼠标 高亮行：实心底色+白字 */
/*.ui-full .smart-menu-search .result-item:hover,
.ui-full .smart-menu-search .result-item.is-active {
  color: var(--el-color-primary-text);
  background: var(--el-color-primary-solid-bg);

  .result-item-icon,
  .result-item-title { color: var(--el-color-primary-text); }
  .result-item-title strong { color: var(--el-color-primary-text); }
  .result-item-breadcrumb { color: var(--el-color-primary-light-5); }
}*/

/* plain — 键盘/鼠标 高亮行：浅底色+主色字 */
/*.ui-plain .smart-menu-search .result-item:hover,
.ui-plain .smart-menu-search .result-item.is-active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-plain-bg);

  .result-item-icon,
  .result-item-title { color: var(--el-color-primary); }
  .result-item-breadcrumb { color: var(--el-color-primary-light-3); }
}*/
</style>
