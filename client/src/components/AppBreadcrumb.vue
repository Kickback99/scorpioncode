<template>
  <div class="breadcrumb-wrapper py-2" v-if="items.length > 1 || smAndDown">
    <div class="d-flex align-center">
      <v-breadcrumbs
        v-if="items.length > 1 && !(smAndDown && route.path === '/profile') && !(route.path === '/about')"
        :items="items"
        density="compact"
        class="pa-0 flex-grow-0"
      >
        <template v-slot:divider>
          <v-icon size="16" class="text-medium-emphasis">mdi-chevron-right</v-icon>
        </template>

        <template v-slot:item="{ item }">
          <v-breadcrumbs-item
            :disabled="item.disabled"
            @click="handleItemClick(item)"
            :class="[smAndUp ? 'text-body-2' : 'text-caption', item.to && !item.disabled ? 'breadcrumb-link' : '']"
          >
            {{ item.title }}
          </v-breadcrumbs-item>
        </template>
      </v-breadcrumbs>

      <!-- 移动端搜索 -->
      <v-text-field
        v-if="smAndDown"
        :style="{ visibility: route.path === '/' ? 'visible' : 'hidden' }"
        v-model="keyword"
        label="请输入标题/内容"
        variant="outlined"
        density="compact"
        hide-details
        append-inner-icon="mdi-magnify"
        @click:append-inner="onSearch('keyword', keyword)"
        @keyup.enter="onSearch('keyword', keyword)"
        class="mobile-search px-2 ml-auto"
      />
    </div>
  </div>
</template>

<script setup>
// 依赖导入
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useSearch } from '@/utils/useSearch'
import emitter from '@/utils/event-bus.js'
import { useTagStore } from '@/store/tag'

// ============================================================
// 数据
// ============================================================

/**
 * 首页默认面包屑文字 — 修改此常量即可变更首页显示文案
 */
const HOME_DEFAULT_LABEL = '最新文章'

const route = useRoute()
const router = useRouter()
const { smAndUp, smAndDown } = useDisplay()
const { triggerSearch } = useSearch()

const keyword = ref('')

// 移动端搜索
const onSearch = (type, param) => {
  if (type === 'keyword') {
    if (!param.trim()) {
      return
    }
  }
  triggerSearch(type, param)
  keyword.value = ''
}

const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  }
})

const tagStore = useTagStore()
const tagMap = computed(() => {
  const map = {}
  tagStore.list.forEach(t => { map[t.id] = t.name })
  return map
})

// ============================================================
// 渲染
// ============================================================

/**
 * 在分类树中根据 ID 查找节点路径（含祖先节点）
 */
const findCategoryPath = (nodes, targetId) => {
  const path = []
  const search = (list, ancestors) => {
    for (const node of list) {
      const currentPath = [...ancestors, node]
      if (node.id === targetId) {
        path.push(...currentPath)
        return true
      }
      if (node.children && node.children.length > 0) {
        if (search(node.children, currentPath)) return true
      }
    }
    return false
  }
  search(nodes, [])
  return path
}

/**
 * 页面标签映射
 */
const PAGE_LABELS = {
  '/about': '关于',
  '/friendLink': '友链',
  '/blog': '博客',
  '/profile': '个人中心'
}

/**
 * 根据当前路由构建面包屑数据
 */
const items = computed(() => {
  const result = [{ title: '首页', to: '/' }]
  const path = route.path
  const query = route.query

  // 文章详情 /detail/:id
  if (path.startsWith('/detail/')) {
    result.push({ title: '文章详情', disabled: true })
    return result
  }

  // 静态页面
  if (PAGE_LABELS[path]) {
    result.push({ title: PAGE_LABELS[path], disabled: true })
    return result
  }

  // 首页 — 按查询参数区分
  if (path === '/') {
    if (query.type && query.param) {
      const param = query.param

      switch (query.type) {
        case 'cate': {
          const catePath = findCategoryPath(props.categories, Number(param))
          catePath.forEach((cate, index) => {
            const isLast = index === catePath.length - 1
            result.push({
              title: cate.name,
              to: isLast ? undefined : { path: '/', query: { type: 'cate', param: cate.id } },
              disabled: isLast
            })
          })
          break
        }
        case 'tag': {
          const tagName = tagMap.value[Number(param)] || param
          result.push({ title: `标签：${tagName}`, disabled: true })
          break
        }
        case 'keyword':
          result.push({ title: `搜索：${param}`, disabled: true })
          break
      }
    } else {
      // 纯首页 — 无筛选条件时默认显示
      result.push({ title: HOME_DEFAULT_LABEL, disabled: true })
    }
  }

  return result
})

// ============================================================
// 导航
// ============================================================

/**
 * 面包屑点击导航 — 处理首页 query 参数清除的边界情况
 */
const handleItemClick = (item) => {
  if (item.disabled || !item.to) return

  // 点击"首页"且当前在首页带查询参数时，需强制重置搜索 + 清 URL
  if (route.path === '/' && route.query.type) {
    const toPath = typeof item.to === 'string' ? item.to : item.to.path || ''
    if (toPath === '/' && !item.to.query) {
      emitter.emit('reset-search')
      router.push('/')
      return
    }
  }

  router.push(item.to)
}

</script>

<style scoped lang="scss">
// ============================================================
// 面包屑容器
// ============================================================

.breadcrumb-wrapper {
  // Vuetify 工具类已处理深浅模式适配，不需要额外样式
  // text-medium-emphasis / text-high-emphasis 自动适配主题
}

.breadcrumb-link {
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
}

// ============================================================
// 移动端搜索
// ============================================================

.mobile-search {
  max-width: 200px;
  align-self: center !important;
}

:deep(.v-text-field .v-label) {
  font-size: 10px !important;
}

:deep(.v-field__input) {
  font-size: 12px !important;
}

:deep(.v-field--focused .v-field__outline),
:deep(.v-field--focused:hover .v-field__outline) {
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
