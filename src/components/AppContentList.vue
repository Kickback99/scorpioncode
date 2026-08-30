<template>
  <v-sheet class="content-list pa-6" :style="{ '--content-list-scale': handleFontScale }">
    <!-- 搜索框区域：只在非加载状态且启用搜索时显示 -->
    <div v-if="!loading && enableSearch" class="d-flex justify-center mb-4">
      <v-text-field
        v-model="searchKeyword"
        :label="searchLabel"
        :placeholder="searchPlaceholder"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        hide-details
        clearable
        density="compact"
        :style="{
          maxWidth: display.mobile.value ? '200px' : '400px',
          width: display.mobile.value ? '100%' : '60%'
        }"
        @click:clear="handleClearSearch"
        @input="handleSearch"
      />
    </div>

    <!-- ==================== Table 模式（v-data-table + 分页）==================== -->
    <div v-if="contentType === 'table'">
      <!-- 数据加载中，显示 loading -->
      <div v-if="loading" class="d-flex flex-column justify-center align-center py-8">
        <v-progress-circular indeterminate color="primary" size="40" />
        <span class="mt-3 text-grey text-caption">加载中...</span>
      </div>

      <!-- 有数据时显示表格 -->
       <!-- 分页方式： -->
      <!-- hide-default-footer = true  使用 Vuetify 默认分页（一次性加载所有数据） -->
      <!-- hide-default-footer = false  使用自定义分页（后端分页，按需加载） -->
      <v-data-table
        v-else-if="filteredItems.length > 0"
        :headers="tableHeaders"
        :items="filteredItems"
        :hide-default-header="hideDefaultHeader"
        :hide-default-footer="hideDefaultFooter"
        hover
      >
        <template 
          v-for="header in tableHeaders" 
          :key="header.key"
          #[`item.${header.key}`]="{ item }"
        >
          <slot :name="`column-${header.key}`" :item="item">
            <span>{{ item[header.key] }}</span>
          </slot>
        </template>

        <template #no-data>
          <slot name="empty" :searchKeyword="searchKeyword">
            <v-empty-state
              :headline="searchKeyword ? '未找到相关内容' : emptyHeadline"
              :text="searchKeyword ? `没有找到包含“${searchKeyword}”的内容` : emptyText"
              :icon="searchKeyword ? 'mdi-magnify-remove-outline' : emptyIcon"
              class="custom-empty-state"
            />
          </slot>
        </template>
      </v-data-table>

      <!-- 无数据且不在加载中时显示空状态 -->
      <slot v-else name="empty" :searchKeyword="searchKeyword">
        <v-empty-state
          :headline="searchKeyword ? '未找到相关内容' : emptyHeadline"
          :text="searchKeyword ? `没有找到包含“${searchKeyword}”的内容` : emptyText"
          :icon="searchKeyword ? 'mdi-magnify-remove-outline' : emptyIcon"
          class="custom-empty-state"
        />
      </slot>

        <!-- 自定义分页组件 -->
        <div v-if="hideDefaultFooter && filteredItems.length > 0" class="d-flex justify-center mt-4">
          <v-pagination
            v-show="paginationVisible"
            v-model="currentPage"
            :length="totalPages"
            :total-visible="display.mobile.value ? 5 : 7"
            @update:model-value="handlePageChange"
          />
        </div>
    </div>

    <!-- ==================== Grid 模式（虚拟滚动表格）==================== -->
    <div v-if="contentType === 'grid'" class="grid-container">
      
      <!-- 数据加载之前，使用 loading -->
      <div v-if="loading" class="d-flex flex-column justify-center align-center py-8">
        <v-progress-circular indeterminate color="primary" size="40" />
        <span class="mt-3 text-grey text-caption">加载中...</span>
      </div>

      <!-- 有数据时显示列表 -->
      <v-data-table-virtual
        v-else-if="filteredItems.length > 0"
        :headers="tableHeaders"
        :items="filteredItems"
        :height="hasData ? (display.mobile.value ? 'calc(100vh - 380px)' : 'calc(100vh - 360px)') : 'auto'"
        hover
        :hide-default-header="hideDefaultHeader"
        hide-default-footer
      >
        <!-- 动态遍历所有列，使用具名插槽 -->
        <template 
          v-for="header in tableHeaders" 
          :key="header.key"
          #[`item.${header.key}`]="{ item }"
        >
          <!-- 使用插槽：命名规则为 `column-{key}` -->
          <slot :name="`column-${header.key}`" :item="item">
            <!-- 默认显示（如果没有提供插槽） -->
            <span>{{ item[header.key] }}</span>
          </slot>
        </template>

        <!-- 空状态：使用默认插槽 -->
        <!-- <template #no-data>
          <slot name="empty" :searchKeyword="searchKeyword">
            <v-empty-state
              :headline="searchKeyword ? '未找到相关内容' : emptyHeadline"
              :text="searchKeyword ? `没有找到包含“${searchKeyword}”的内容` : emptyText"
              :icon="searchKeyword ? 'mdi-magnify-remove-outline' : emptyIcon"
              class="custom-empty-state"
            />
          </slot>
        </template> -->
      </v-data-table-virtual>
        
      <!-- 无数据且不在加载中时显示空状态 -->
      <slot v-else name="empty" :searchKeyword="searchKeyword">
      <v-empty-state
        :headline="searchKeyword ? '未找到相关内容' : emptyHeadline"
        :text="searchKeyword ? `没有找到包含“${searchKeyword}”的内容` : emptyText"
        :icon="searchKeyword ? 'mdi-magnify-remove-outline' : emptyIcon"
        class="custom-empty-state"
      />
    </slot>
    </div>

     <!-- ==================== Card 模式（卡片列表布局）==================== -->
    <div v-else-if="contentType === 'card'" class="content-card-list">

      <!-- 数据加载之前，使用 loading -->
      <div v-if="loading" class="d-flex flex-column justify-center align-center py-8">
        <v-progress-circular indeterminate color="primary" size="40" />
        <span class="mt-3 text-grey text-caption">加载中...</span>
      </div>

      <!-- 有数据时显示列表 -->
      <v-list v-else-if="filteredItems.length > 0">
        <v-list-item
          v-for="item in filteredItems"
          :key="getItemId(item)"
          lines="two"
          class="content-item"
        >
          <!-- 前置图标插槽 -->
          <template #prepend>
            <slot name="card-prepend" :item="item">
              <v-avatar size="40" color="grey-lighten-2">
                <v-icon>mdi-file-document</v-icon>
              </v-avatar>
            </slot>
          </template>

          <!-- 标题插槽 -->
          <template #title>
            <slot name="card-title" :item="item">
              {{ item.title || item.content }}
            </slot>
          </template>

          <!-- 副标题插槽 -->
          <template #subtitle>
            <slot name="card-subtitle" :item="item">
              发布于 {{ item.createTime }}
            </slot>
          </template>

          <!-- 后置操作插槽 -->
          <template #append>
            <slot name="card-append" :item="item">
              <v-btn
                icon
                variant="text"
                size="small"
                :color="deleteButtonColor"
                :loading="isDeleting(item)"
                @click="handleDelete(item)"
              >
                <v-icon size="18">{{ deleteIcon }}</v-icon>
              </v-btn>
            </slot>
          </template>
        </v-list-item>
      </v-list>

      <!-- 无数据且不在加载中时显示空状态 -->
      <slot v-else name="empty" :searchKeyword="searchKeyword">
        <v-empty-state
          :headline="searchKeyword ? '未找到相关内容' : emptyHeadline"
          :text="searchKeyword ? `没有找到包含“${searchKeyword}”的内容` : emptyText"
          :icon="searchKeyword ? 'mdi-magnify-remove-outline' : emptyIcon"
          class="custom-empty-state"
        />
      </slot>

      <!-- 分页组件 -->
      <div v-if="pagination && filteredItems.length > 0" class="d-flex justify-center mt-4">
        <v-pagination
          v-show="paginationVisible"
          v-model="currentPage"
          :length="totalPages"
          :total-visible="display.mobile.value ? 5 : 7"
          @update:model-value="handlePageChange"
        />
      </div>
    </div>
  </v-sheet>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useDisplay } from 'vuetify'

// Props 定义
const props = defineProps({
  // 内容类型：'grid'（虚拟滚动）、'card'（卡片）、'table'（表格+分页）
  contentType: {
    type: String,
    default: 'grid',
    validator: (value) => ['grid', 'card', 'table'].includes(value)
  },
  // 数据加载函数（必须返回 Promise）
  loadDataApi: {
    type: Function,
    required: true
  },
  // 删除函数（可选，不传则触发 console.log）
  deleteApi: {
    type: Function,
    default: null
  },
  // 表格列配置
  tableHeaders: {
    type: Array,
    default: () => [
      { title: '标题', key: 'title', align: 'start' },
      { title: '操作', key: 'actions', sortable: false, align: 'end' }
    ]
  },
  // 是否启用搜索
  enableSearch: {
    type: Boolean,
    default: false
  },
  // 搜索标签
  searchLabel: {
    type: String,
    default: '搜索'
  },
  // 搜索占位符
  searchPlaceholder: {
    type: String,
    default: '输入关键词搜索'
  },
  // 搜索字段（前端过滤用）
  searchFields: {
    type: Array,
    default: () => ['title']
  },
  // 是否隐藏标题行，（true=隐藏标题行，false=不隐藏标题行）
  hideDefaultHeader:{
    type: Boolean,
    default: true
  },
  // 是否隐藏 Vuetify 默认分页脚（true=使用自定义 v-pagination，false=使用默认分页）
  hideDefaultFooter: {
    type: Boolean,
    default: false
  },
  // table 模式 每页显示数量（如果传递 pageSize 就用传递的，否则当 hideDefaultFooter=true 时，为 10；否则为 9999）
  // card  模式 每页显示数量（如果传递 pageSize 就用传递的，否则当 pagination=true 时，为 10；否则为 9999）
  pageSize: {
    type: Number,
    default: null
  },
  // 空状态图标
  emptyIcon: {
    type: String,
    default: 'mdi-inbox-outline'
  },
  // 空状态标题
  emptyHeadline: {
    type: String,
    default: '暂无内容'
  },
  // 空状态描述
  emptyText: {
    type: String,
    default: '还没有任何内容'
  },
  // 条目图标
  itemIcon: {
    type: String,
    default: 'mdi-file-document'
  },
  // 删除按钮图标
  deleteIcon: {
    type: String,
    default: 'mdi-delete'
  },
  // 删除按钮颜色
  deleteButtonColor: {
    type: String,
    default: 'red'
  },
  // 是否分页
  pagination: {
    type: Boolean,
    default: false
  },
  // 获取条目ID的函数
  getItemId: {
    type: Function,
    default: (item) => item.id || item.commentId || item.articleId
  },
  // 是否自动加载
  autoLoad: {
    type: Boolean,
    default: true
  }
})

// 响应式数据
const display = useDisplay()

// 移动端字号缩放系数（动态 rem 适配）
const handleFontScale = computed(() => (display.mobile.value ? 0.8 : 1))

const items = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const total = ref(0)
const deletingIds = ref([]) // 正在删除的ID列表

// 计算每页显示数量
const itemsPerPage  = computed(() => {
  if (props.pageSize !== null) return props.pageSize
  if (props.contentType === 'table') {
      // table 模式每页大小处理
      return props.hideDefaultFooter ? 10 : 9999
  }else if (props.contentType === 'card') {
    // card 模式每页大小处理
    return props.pagination ? 10 : 9999
  }
})

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(total.value / itemsPerPage.value)
})

// pagination 可见性
const paginationVisible = computed(()=>{
  return  Math.ceil(total.value / itemsPerPage.value) > 1
})

// 计算属性
const filteredItems = computed(() => {
  if (!props.enableSearch || !searchKeyword.value.trim()) {
    return items.value
  }
  const keyword = searchKeyword.value.trim().toLowerCase()
  return items.value.filter(item => {
    return props.searchFields.some(field => {
      const value = item[field]
      return value && String(value).toLowerCase().includes(keyword)
    })
  })
})

const hasData = computed(() => {
  return filteredItems.value.length > (display.mobile.value ? 5 : 6)
})

// 方法
const loadData = async (page = currentPage.value) => {
  loading.value = true
  try {
    let params = {}
    
    if (props.contentType === 'table') {
      // table 模式下的分页参数处理
      if (props.hideDefaultFooter) {
        // 自定义分页：按需加载
        params = { pageNum: page, pageSize: itemsPerPage.value }
      } else {
        // 默认分页：一次性加载所有数据
        params = { pageNum: 1, pageSize: 9999 }
      }
    }else {
      // card 模式下的分页参数处理
      params = { pageNum: page, pageSize: itemsPerPage.value}
    }
    
    const result = await props.loadDataApi(params)
    
    if (result && result.data) {
      items.value = result.data.items || result.data.records || result.data
      total.value = result.data.total || items.value.length
    } else if (Array.isArray(result)) {
      items.value = result
      total.value = result.length
    } else {
      items.value = result || []
      total.value = items.value.length
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 自定义分页切换
const handlePageChange = (page) => {
  loadData(page)
}

const handleDelete = async (item) => {
  const itemId = props.getItemId(item)
  deletingIds.value.push(itemId)
  try {
    await props.deleteApi(itemId)
    // 从列表中移除
    items.value = items.value.filter(i => props.getItemId(i) !== itemId)
    total.value = Math.max(0, total.value - 1)
    window.$snackbar?.success('删除成功')
  } catch (error) {
    console.error('删除失败:', error)
    window.$snackbar?.error('删除失败，请重试')
  } finally {
    deletingIds.value = deletingIds.value.filter(id => id !== itemId)
  }
}

const isDeleting = (item) => {
  return deletingIds.value.includes(props.getItemId(item))
}

const handleSearch = () => {
  // 搜索逻辑由 computed 自动处理
  console.log('搜索关键词:', searchKeyword.value)
}

const handleClearSearch = () => {
  searchKeyword.value = ''
  console.log('已清空搜索')
}

/* const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
} */

// 监听搜索关键词变化
watch(searchKeyword, () => {
  if (props.contentType !== 'table') {
    // grid/card 模式重新过滤
  }
})

// 监听
watch(() => props.enableSearch, () => {
  // 搜索功能开关变化时重置搜索关键词
  searchKeyword.value = ''
})

// 生命周期
if (props.autoLoad) {
  onMounted(() => {
    loadData()
  })
}

// 暴露方法供父组件调用
defineExpose({
  loadData,
  refresh: loadData,
  deleteItem: handleDelete
})
</script>

<style scoped>
.content-list {
  --content-list-scale: 1;

  h2 {
    font-size: calc(1.5rem * var(--content-list-scale)) !important;
  }

  h3 {
    font-size: calc(1.25rem * var(--content-list-scale)) !important;
  }

  .text-caption {
    font-size: calc(0.75rem * var(--content-list-scale)) !important;
  }

  /* 搜索框整块缩放：input 经 font:inherit 继承、图标经 em 等比缩放 */
  :deep(.v-field) {
    font-size: calc(1rem * var(--content-list-scale)) !important;
  }

  /* 浮动 label 固定 1rem，需单独命中（未聚焦时它看起来就是"占位符"） */
  :deep(.v-field .v-label) {
    font-size: calc(1rem * var(--content-list-scale)) !important;
  }

  /* 按钮字号（Vuetify 经 --v-btn-size 控制） */
  :deep(.v-btn) {
    --v-btn-size: calc(0.875rem * var(--content-list-scale)) !important;
  }

  /* 表格/虚拟表格根节点字号，单元格文字继承缩放 */
  :deep(.v-data-table),
  :deep(.v-data-table-virtual) {
    font-size: calc(0.875rem * var(--content-list-scale)) !important;
  }

  /* 表格表头字号 */
  :deep(.v-data-table__th) {
    font-size: calc(0.75rem * var(--content-list-scale)) !important;
  }

  /* Card 模式标题与副标题 */
  :deep(.v-list-item-title) {
    font-size: calc(0.875rem * var(--content-list-scale)) !important;
  }

  :deep(.v-list-item-subtitle) {
    font-size: calc(0.75rem * var(--content-list-scale)) !important;
  }
}

.content-item {
  border-bottom: 1px solid #e0e0e0;
}

.content-item:last-child {
  border-bottom: none;
}

.content-card-list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

:deep(.custom-empty-state .v-empty-state__headline) {
  font-size: 1.25rem !important;
  font-weight: 500;
}

:deep(.custom-empty-state .v-empty-state__text) {
  font-size: 0.875rem !important;
}

:deep(.custom-empty-state .v-icon) {
  font-size: 60px !important;
}

@media (max-width: 600px) {
  :deep(.custom-empty-state .v-empty-state__headline) {
    font-size: 1rem !important;
  }
  
  :deep(.custom-empty-state .v-empty-state__text) {
    font-size: 0.75rem !important;
  }
  
  :deep(.custom-empty-state .v-icon) {
    font-size: 48px !important;
  }
}
</style>