<template>
    <v-container>
          <!-- 加载中：进度条 + 骨架屏同时显示 -->
         <template v-if="isLoading">
           <div class="loading-wrapper">
             <v-progress-linear
                 indeterminate
                 color="warning"
                 height="2"
                 class="loading-bar"
             ></v-progress-linear>
          </div>
           <div>
             <ArticleItemSkeleton
               v-for="n in currentPageSize"
               :key="n"
               :class="{ 'mt-5': n !== 1 }"
             />
           </div>
         </template>

          <!-- 正常文章列表 -->
          <template v-else-if="articleList.length > 0">
            <!-- 滚动加载模式 -->
            <template v-if="isScrollMode">
              <v-infinite-scroll
                  :height="'auto'"
                  :loading="scrollLoading"
                  @load="loadMoreArticles"
              >
                <ArticleItem v-for="(item,index) in articleList" :key="item.id" 
                    :class="{'mt-5':(index !== 0)}"
                    :id="item.id"
                    :title="item.title" 
                    :cateName="item.cateName"
                    :cover="item.cover" 
                    :description="item.displayDescription" 
                    :createTime="item.createTime"
                    :viewCount="item.viewCount"
                    :favoriteCount="item.favoriteCount"
                    :commentCount="item.commentCount"
                    :isTop="item.isTop">
                </ArticleItem>

                <template v-slot:loading>
                  <div class="text-center py-4">
                      <v-progress-circular indeterminate size="32" color="primary"></v-progress-circular>
                      <div class="text-caption text-grey mt-2">加载更多文章中...</div>
                  </div>
                </template>

                <template v-slot:empty>
                  <div class="text-center py-4 text-grey">
                      <div class="text-caption">已经到底了~</div>
                  </div>
                </template>
              </v-infinite-scroll>
            </template>
            
            <!-- 分页加载模式（原有逻辑） -->
            <template v-else>
              <ArticleItem 
                  v-for="(item, index) in articleList" 
                  :key="item.id" 
                  :class="{'mt-5': (index !== 0)}"
                  :id="item.id"
                  :title="item.title" 
                  :cateName="item.cateName"
                  :cover="item.cover" 
                  :description="item.displayDescription" 
                  :createTime="item.createTime"
                  :viewCount="item.viewCount"
                  :favoriteCount="item.favoriteCount"
                  :commentCount="item.commentCount"
                  :isTop="item.isTop"
              />

              <v-pagination
              v-show=" Math.ceil(total / currentPageSize) > 1 " 
              v-model="params.pageNum" 
              class="mt-5"
              :length="Math.ceil(total / currentPageSize)"
              :total-visible="smAndUp?8:4"
              :elevation="2"
              size="small"
              @update:modelValue="renderArticleList"
              >

              </v-pagination>
            </template>
          </template>

            <!-- 空状态显示 -->
             <v-card v-else>
              <v-empty-state
                  icon="mdi-file-document-outline"
                  title="暂无文章"
                  text="当前没有找到任何文章内容"
              >
              </v-empty-state>
            </v-card>
    </v-container>
</template>

<script setup>
import { articleListApi } from '@/api/article';
import ArticleItem from './components/ArticleItem.vue';
import ArticleItemSkeleton from './components/ArticleItemSkeleton.vue';
import { ref,onMounted,onUnmounted,watch, provide, computed } from 'vue'
import { useDisplay } from 'vuetify';
import { mdToPlainText } from '@/utils/useExtractText'
import { useConfigStore } from '@/store/config';
const configStore = useConfigStore()


const {smAndUp} = useDisplay()


const isLoading = ref(false)
const scrollLoading = ref(false) // 滚动加载状态

// 全局总线
import emitter from '@/utils/event-bus.js'
import { useRoute, useRouter } from 'vue-router';


const route = useRoute()
const router = useRouter()

// 判断是否为滚动模式
const isScrollMode = computed(() => {
    return configStore.getListLoadMode() === 'scroll'
})

// 根据加载模式获取对应的分页大小
const currentPageSize = computed(() => {
    if (isScrollMode.value) {
        return configStore.getListScrollPageSize()
    } else {
        return configStore.getListPaginationPageSize()
    }
})


// 文章列表
const articleList = ref([])

// 文章分页大小
const total = ref(null)

//搜索相关
const searchData = ref({
      keyword:'',
      categoryId: null,
      tagId: null
})

const params = ref({
    pageNum :1,
})

// 滚动加载状态
const hasMore = ref(true)

// 重置滚动状态
const resetScrollState = () => {
    articleList.value = []
    params.value.pageNum = 1
    total.value = 0
    hasMore.value = true
}


const renderArticleList = async() => {
    // console.log('renderArticleList函数执行...')
    // console.log('searchData.value',searchData.value)
    isLoading.value = true
    try {
      const res = await articleListApi({
        pageNum: params.value.pageNum,
        pageSize: currentPageSize.value,
        searchData: searchData.value
      })
      // console.log('renderArticleList...')
      // console.log('res.data.items',res.data.items)
      articleList.value = res.data.items.map(item => ({
        ...item,
        displayDescription: handleAutoDescription(item)
      }))
      total.value = res.data.total
    }finally {
      isLoading.value = false
      // 数据加载完成后，标记首次加载结束
          }
}

// renderArticleList()

// 处理状态
const isProcessing = ref(false) // 全局标志位
const history = {
    keyword:'',
    categoryId: null,
    tagId: null
}

// 加载更多（无限滚动）- 仿照评论组件
const loadMoreArticles = async ({ done }) => {
    if (!hasMore.value) {
        done('empty')
        return
    }

    scrollLoading.value = true
    const nextPage = params.value.pageNum + 1
    const pageSize = currentPageSize.value

    try {
        const res = await articleListApi({
            pageNum: nextPage,
            pageSize: pageSize,
            searchData: searchData.value
        })

        if (res.code === 200 && res.data) {
            const newArticles = res.data.items || []

            if (newArticles.length === 0) {
                hasMore.value = false
                done('empty')
                return
            }

            // 处理新文章数据
            const processedArticles = newArticles.map(item => ({
                ...item,
                displayDescription: handleAutoDescription(item)
            }))

            articleList.value.push(...processedArticles)
            params.value.pageNum = nextPage
            total.value = res.data.total
            hasMore.value = articleList.value.length < total.value

            done(hasMore.value ? 'ok' : 'empty')
        } else {
            hasMore.value = false
            done('empty')
        }
    } catch (error) {
        window.$snackbar?.error('加载更多文章失败')
        done('error')
    } finally {
        scrollLoading.value = false
    }
}

// 初始化加载（处理滚动和分页两种模式）
const initLoadArticles = async () => {
    if (isScrollMode.value) {
        // 滚动模式：重置状态并加载第一页
        resetScrollState()
        await renderArticleList()
    } else {
        // 分页模式：直接加载
        await renderArticleList()
    }
}

// 仅当无筛选 query 时才做默认加载；带 query 时交由 onMounted 里的 watch(immediate) 统一处理，避免重复请求
if (!route.query.type || !route.query.param) {
    initLoadArticles()
}

// 绑定总线事件
onMounted(()=>{
  // emitter.on('search', receiveParam)
  emitter.on('reset-search', () => {
  // console.log('触发了reset-search')
  params.value.pageNum = 1
  searchData.value = {
    keyword: '',
    categoryId: null,
    tagId: null
  }
  // 根据模式决定是否重置滚动状态
  if (isScrollMode.value) {
      resetScrollState()
  }
  renderArticleList()
})
  
  // 监听路由变化处理参数
  watch(() => route.query, (newQuery) => {
    if (newQuery.type && newQuery.param) {
      // console.log('query参数路由执行...')
      updateSearchState({
        type: newQuery.type,
        param: newQuery.param
      })
      // 根据模式决定是否重置滚动状态
      if (isScrollMode.value) {
          resetScrollState()
      }
      renderArticleList()
    }
  }, { immediate: true })
})

onUnmounted(()=>{
    // console.log("searchData.value.categoryId",searchData.value.categoryId)
})



// 更新搜索状态
const updateSearchState = (data) => {
  params.value.pageNum = 1
  
  // 滚动模式需要重置状态
  if (isScrollMode.value) {
      resetScrollState()
  }
  
  // 更新当前搜索参数
  searchData.value = {
    keyword: data.type === 'keyword' ? data.param : '',
    categoryId: data.type === 'cate' ? Number(data.param) : null,
    tagId: data.type === 'tag' ? Number(data.param) : null
  }
}

const handleAutoDescription = (item) => {
    switch (item.isAutoDescription) {
    case 1: // 刻意留空
      return '';
    case 0: // 自动生成
      return mdToPlainText(item.description) || '暂无内容摘要';
    default: // 自定义或null
      return item.description;
  }
}

// 监听加载模式或分页大小变化，重新加载
/* watch(() => configStore.getListLoadMode(), () => {
    if (isScrollMode.value) {
        resetScrollState()
    }
    initLoadArticles()
})

watch(() => currentPageSize.value, () => {
    initLoadArticles()
}) */

</script>

<style scoped lang="scss">
:deep(.pagination-full-width .v-pagination__list) {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

:deep(.full-width-pagination .v-pagination__item,
.full-width-pagination .v-pagination__navigation ){
  flex: 1;  /* 让所有项均匀分配剩余空间 */
  max-width: calc(100% / 8); /* 根据 total-visible 调整 */
  margin: 0 !important; /* 移除默认外边距 */
}

.loading-wrapper {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    z-index: 9999;
}

.loading-bar {
    position: relative;  /* 相对于 wrapper 定位 */
}

</style>