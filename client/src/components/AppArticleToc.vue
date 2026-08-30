<template>
  <!-- ===== TOC 容器 ===== -->
  <v-sheet class="toc-container">
    <!-- TOC 切换按钮 -->
    <v-btn
      v-if="hasToc"
      icon
      size="small"
      variant="text"
      @click.stop="handleToggleToc"
      class="toc-toggle-btn"
      :style="{
        right: rightOffset,
        top: `${POSITION_CONFIG.TOP}px`
      }"
    >
      <v-icon>mdi-text</v-icon>
    </v-btn>

    <!-- TOC 目录卡片 -->
    <v-card
      v-show="showToc"
      class="toc-card"
      elevation="4"
      :style="{
        right: rightOffset,
        top: `${POSITION_CONFIG.TOP + POSITION_CONFIG.VERTICAL_GAP}px`,
        '--toc-scale': tocFontScale
      }"
    >
      <!-- 目录头部 -->
      <div class="toc-header-fixed">
        <v-card-title class="py-2 text-caption d-flex justify-space-between alien-item-center bg-surface">
          <span style="align-self: center;">文章目录</span>
          <v-btn icon variant="text" size="small" @click.stop="handleToggleToc">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider color="primary" opacity=".7" gradient></v-divider>
      </div>

      <!-- 目录列表 -->
      <v-list density="compact" v-model:selected="selectedTocItem">
        <template v-for="(anchor, index) in tocAnchors" :key="`anchor-${index}`">
          <v-list-item
            :value="anchor"
            @click="handleAnchorClick(anchor)"
            :class="getIndentClass(anchor.level)"
          >
            <v-list-item-title>
              <v-tooltip
                v-model="tooltipVisible[index]"
                :disabled="!isTitleOverflow(index)"
                location="right"
                :open-delay="300"
                :close-delay="100"
                open-on-hover
                attach="body"
                :text="anchor.title"
              >
                <template v-slot:activator="{ props: tooltipProps }">
                  <span
                    v-bind="tooltipProps"
                    :ref="el => setTitleRef(el, index)"
                    class="toc-title-text"
                    @mouseenter="handleTitleMouseEnter(index)"
                    @mouseleave="handleTitleMouseLeave(index)"
                  >
                    {{ anchor.title }}
                  </span>
                </template>
              </v-tooltip>
            </v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-card>
  </v-sheet>
</template>

<script setup>
// 依赖导入
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useDisplay } from 'vuetify'
import { useConfigStore } from '@/store/config'

const display = useDisplay()
const configStore = useConfigStore()

const props = defineProps({
  /** markdown 预览组件实例，用于查询标题 DOM */
  preview: { type: Object, default: null }
})

// ============================================================
// 数据
// ============================================================
const showToc = ref(false)
const tocAnchors = ref([])
const selectedTocItem = ref([])
const titleElements = ref([])
const tooltipVisible = ref({})
const rightOffset = ref('0px')
let isScrollingToTarget = false
let scrollTimeout = null

const POSITION_CONFIG = {
  TOP: 150,
  EDGE_GAP: 0,
  VERTICAL_GAP: 56,
  SCROLL_TOP_OFFSET: 80,
  ACTIVATION_OFFSET: 100
}

// ============================================================
// 计算属性
// ============================================================
const tocFontScale = computed(() => (display.mobile.value ? 0.85 : 1))

const existingLevels = computed(() => {
  if (tocAnchors.value.length === 0) return []
  return [...new Set(tocAnchors.value.map(a => a.level))].sort((a, b) => a - b)
})

const hasToc = computed(() => {
  return configStore.isAnchorEnabled && tocAnchors.value.length >= 2
})

/**
 * 根据标题级别返回对应的缩进 CSS 类
 */
const getIndentClass = (level) => {
  if (existingLevels.value.length === 0) return 'toc-level-0'
  const index = existingLevels.value.indexOf(level)
  if (index === -1) return 'toc-level-0'
  return `toc-level-${index}`
}

// ============================================================
// 目录生成与定位
// ============================================================

/** 防抖工具函数 */
const debounce = (fn, delay = 100) => {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 生成目录锚点：从 preview DOM 中提取标题元素
 */
const generateTocAnchors = () => {
  if (!props.preview) return

  const selector = 'h1,h2,h3,h4,h5,h6'
  const anchors = props.preview.$el.querySelectorAll(selector)
  const titles = Array.from(anchors).filter(title => !!title.innerText.trim())

  if (!titles.length) {
    tocAnchors.value = []
    return
  }

  const hTags = Array.from(new Set(titles.map(title => title.tagName))).sort()

  // 尝试恢复之前的高亮项
  const previousTitle = selectedTocItem.value[0]?.title

  tocAnchors.value = titles.map(el => ({
    title: el.innerText,
    lineIndex: el.getAttribute('data-v-md-line'),
    indent: hTags.indexOf(el.tagName),
    level: parseInt(el.tagName.slice(1)),
    element: el
  }))

  if (tocAnchors.value.length > 0) {
    if (previousTitle) {
      const match = tocAnchors.value.find(a => a.title === previousTitle)
      selectedTocItem.value = match ? [match] : [tocAnchors.value[0]]
    } else {
      selectedTocItem.value = [tocAnchors.value[0]]
    }
  }
}

/**
 * 计算 TOC 按钮/卡片的水平定位
 * 二者均为 fixed 定位，各自以自身右边缘对齐文章内容区右边缘，宽度差异由浏览器处理，互不影响
 * 注意：fixed 的包含块为不含滚动条的初始包含块，须用 clientWidth 而非 innerWidth
 */
const calculatePosition = () => {
  const articleContent = document.querySelector('.markdown-content')
  if (!articleContent) return

  const contentRight = articleContent.getBoundingClientRect().right
  const viewportWidth = document.documentElement.clientWidth
  rightOffset.value = `${viewportWidth - contentRight + POSITION_CONFIG.EDGE_GAP}px`
}

/** 滚动时高亮对应的目录项 */
const updateActiveToc = () => {
  if (isScrollingToTarget) return
  if (!props.preview || tocAnchors.value.length === 0) return

  const ACTIVATION_OFFSET = POSITION_CONFIG.ACTIVATION_OFFSET

  const activeAnchor = [...tocAnchors.value]
    .reverse()
    .find(anchor => {
      const rect = anchor.element?.getBoundingClientRect()
      return rect && rect.top <= ACTIVATION_OFFSET
    }) || tocAnchors.value[0]

  if (activeAnchor && selectedTocItem.value[0] !== activeAnchor) {
    selectedTocItem.value = [activeAnchor]
  }
}

const scrollHandler = debounce(() => {
  if (!hasToc.value || isScrollingToTarget) return
  updateActiveToc()
}, 100)

/** 滚动目录卡到当前高亮项 */
const scrollToActiveTocItem = (behavior = 'smooth') => {
  if (!hasToc.value || !showToc.value) return

  const activeElement = document.querySelector('.v-list-item--active')
  if (!activeElement) return

  activeElement.scrollIntoView({
    behavior,
    block: 'center',
    inline: 'nearest'
  })
}

const scrollTocToActive = () => {
  if (!showToc.value) return
  setTimeout(() => {
    scrollToActiveTocItem('smooth')
  }, 50)
}

const debouncedScrollToc = debounce(scrollTocToActive, 50)

// ============================================================
// 交互处理
// ============================================================

const handleToggleToc = () => {
  showToc.value = !showToc.value
}

/**
 * 点击目录项：平滑滚动到对应标题
 */
const handleAnchorClick = (anchor) => {
  if (!props.preview || isScrollingToTarget) return

  const heading = props.preview.$el.querySelector(
    `[data-v-md-line="${anchor.lineIndex}"]`
  )

  if (heading) {
    isScrollingToTarget = true
    window.removeEventListener('scroll', scrollHandler)

    if (selectedTocItem.value[0] !== anchor) {
      selectedTocItem.value = [anchor]
    }

    const rect = heading.getBoundingClientRect()
    const currentScrollY = window.scrollY
    const targetPosition = currentScrollY + rect.top - POSITION_CONFIG.SCROLL_TOP_OFFSET

    window.scrollTo({
      top: Math.max(0, targetPosition),
      behavior: 'smooth'
    })

    if (scrollTimeout) clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      updateActiveToc()
      isScrollingToTarget = false
      window.addEventListener('scroll', scrollHandler)
      scrollTimeout = null
    }, 500)
  }

  showToc.value = true
}

const setTitleRef = (el, index) => {
  if (el) {
    titleElements.value[index] = el
  }
}

/** 检测指定索引的标题是否溢出（省略号） */
const isTitleOverflow = (index) => {
  if (!hasToc.value) return false
  const el = titleElements.value[index]
  if (!el) return false
  return el.scrollWidth > el.clientWidth
}

const handleTitleMouseEnter = (index) => {
  if (!hasToc.value) return
  if (isTitleOverflow(index)) {
    tooltipVisible.value[index] = true
  }
}

const handleTitleMouseLeave = (index) => {
  if (!hasToc.value) return
  tooltipVisible.value[index] = false
}

// ============================================================
// 监听
// ============================================================

// 监听目录卡显示状态，打开时滚动到高亮项
watch(() => showToc.value, (newVal) => {
  if (!hasToc.value) return
  if (newVal && selectedTocItem.value[0] && !isScrollingToTarget) {
    nextTick(() => {
      setTimeout(() => {
        scrollToActiveTocItem('smooth')
      }, 150)
    })
  }
})

// 监听高亮项变化，自动滚动目录卡
watch(() => selectedTocItem.value[0], () => {
  if (!hasToc.value) return
  nextTick(() => {
    if (showToc.value && !isScrollingToTarget) {
      debouncedScrollToc()
    }
  })
})

// 监听目录数量变化，触发 tooltip 溢出重新检测
watch(() => tocAnchors.value.length, () => {
  if (!hasToc.value) return
  nextTick(() => {
    titleElements.value = [...titleElements.value]
  })
})

// ============================================================
// 生命周期
// ============================================================

/** 窗口尺寸变化：重新计算定位 + 触发 tooltip 溢出重新检测 */
const handleResize = () => {
  calculatePosition()
  if (!hasToc.value) return
  nextTick(() => {
    titleElements.value = [...titleElements.value]
  })
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', scrollHandler)
  setTimeout(calculatePosition, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', scrollHandler)
  if (scrollTimeout) clearTimeout(scrollTimeout)
})

// ============================================================
// 公开方法
// ============================================================

defineExpose({
  /**
   * 外部触发目录重建（文章内容加载 / 主题切换后调用）
   */
  generateAnchors() {
    generateTocAnchors()
    calculatePosition()
  }
})
</script>

<style scoped lang="scss">
// ============================================================
// 定位
// ============================================================
// 容器脱离文档流：不生成盒子、不占位，内部按钮/卡片仍各自 fixed 相对视口定位
.toc-container {
  display: contents;
}

.toc-toggle-btn,
.toc-card {
  position: fixed;
  z-index: 999;
  max-width: 280px;
  transition: right 0.3s ease;
}

.toc-card {
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  width: 280px;
  --toc-scale: 1;
}

// ============================================================
// 字号
// ============================================================
.toc-card .toc-title-text {
  font-size: calc(1rem * var(--toc-scale));
}

// ============================================================
// 缩进层级
// ============================================================
.toc-level-0 { padding-left: 8px !important; }
.toc-level-1 { padding-left: 16px !important; }
.toc-level-2 { padding-left: 24px !important; }
.toc-level-3 { padding-left: 32px !important; }
.toc-level-4 { padding-left: 40px !important; }
.toc-level-5 { padding-left: 48px !important; }

// ============================================================
// 交互
// ============================================================
.v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
  cursor: pointer;
}

// ============================================================
// 目录头部
// ============================================================
.toc-header-fixed {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  background-color: inherit;
  z-index: 10;
  border-radius: 8px 8px 0 0;
}

// ============================================================
// 标题文本溢出
// ============================================================
.toc-title-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  max-width: 100%;
}

:deep(.v-tooltip) {
  z-index: 10000 !important;
}

// ============================================================
// 移动端适配
// ============================================================
@media (max-width: 960px) {
  .toc-toggle-btn,
  .toc-card {
    right: 20px !important;
  }
  .toc-card {
    width: 50%;
  }
}
</style>
