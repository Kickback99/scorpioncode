<template>
    <v-container :style="{ '--empty-state-scale': scale }">
          <!-- ===== 加载中：进度条 + 骨架屏同时显示 ===== -->
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
             <AppArticleItemSkeleton
               v-for="n in currentPageSize"
               :key="n"
               :class="{ 'mt-5': n !== 1 }"
             />
           </div>
         </template>

          <!-- ===== 正常文章列表 ===== -->
          <template v-else-if="articleList.length > 0">
            <!-- 滚动加载模式 -->
            <template v-if="isScrollMode">
              <v-infinite-scroll
                  :height="'auto'"
                  :loading="scrollLoading"
                  @load="loadMoreArticles"
              >
                <AppArticleItem v-for="(item,index) in articleList" :key="item.id"
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
                </AppArticleItem>

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
              <AppArticleItem
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

            <!-- ===== 空状态显示 ===== -->
             <v-card v-else class="pa-6">
              <v-empty-state
                  icon="mdi-file-document-outline"
                  headline="暂无文章"
                  text="当前没有找到任何文章内容"
                  class="custom-empty-state"
              >
              </v-empty-state>
            </v-card>
    </v-container>
</template>

<script setup>
import { articleListApi } from '@/api/article';
import AppArticleItem from './components/AppArticleItem.vue';
import AppArticleItemSkeleton from './components/AppArticleItemSkeleton.vue';
import { ref,onMounted,watch, provide, computed } from 'vue'
import { useDisplay } from 'vuetify';
import { mdToPlainText } from '@/utils/useExtractText'
import { useConfigStore } from '@/store/config';
import { useDialogFontScale } from '@/composables/useDialogFontScale';

// ============================================================
// 数据
// ============================================================
const configStore = useConfigStore()


const {smAndUp} = useDisplay()

// 空状态字号缩放（移动端 0.8）
const scale = useDialogFontScale()


const isLoading = ref(false)
const scrollLoading = ref(false) // 滚动加载状态

import { useRoute, useRouter } from 'vue-router';


const route = useRoute()
const router = useRouter()

// ============================================================
// 计算属性
// ============================================================
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


// ============================================================
// 列表状态
// ============================================================
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


// 请求代次：回退/前进连续切换时会有多个请求同时在飞，只有最新一次的结果可被采纳
let requestSeq = 0

// ============================================================
// 列表渲染
// ============================================================
const renderArticleList = async() => {
    const seq = ++requestSeq
    isLoading.value = true
    try {
      const res = await articleListApi({
        pageNum: params.value.pageNum,
        pageSize: currentPageSize.value,
        searchData: searchData.value
      })
      // 过期响应：期间已发起更新的请求，丢弃结果，避免列表停在错误的筛选上
      if (seq !== requestSeq) return
      articleList.value = res.data.items.map(item => ({
        ...item,
        displayDescription: handleAutoDescription(item)
      }))
      total.value = res.data.total
    }finally {
      // 数据加载完成后，标记首次加载结束（过期响应不得提前收起骨架屏）
      if (seq === requestSeq) {
        isLoading.value = false
      }
    }
}

// ============================================================
// 滚动加载
// ============================================================
// 加载更多（无限滚动）- 仿照评论组件
const loadMoreArticles = async ({ done }) => {
    if (!hasMore.value) {
        done('empty')
        return
    }

    scrollLoading.value = true
    const nextPage = params.value.pageNum + 1
    const pageSize = currentPageSize.value
    const seq = requestSeq // 记录发起时的请求代次

    try {
        const res = await articleListApi({
            pageNum: nextPage,
            pageSize: pageSize,
            searchData: searchData.value
        })

        // 期间筛选条件已切换（renderArticleList 发起了新请求）：本次追加作废，避免混入旧筛选的文章
        if (seq !== requestSeq) {
            done('ok')
            return
        }

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

// ============================================================
// 搜索处理
// ============================================================
/**
 * 更新搜索状态
 * @param {{type: string, param: string}|null} data 路由筛选参数；传 null 表示无筛选条件
 */
const updateSearchState = (data) => {
  params.value.pageNum = 1

  // 滚动模式需要重置状态
  if (isScrollMode.value) {
      resetScrollState()
  }

  // 更新当前搜索参数
  searchData.value = {
    keyword: data?.type === 'keyword' ? data.param : '',
    categoryId: data?.type === 'cate' ? Number(data.param) : null,
    tagId: data?.type === 'tag' ? Number(data.param) : null
  }
}

// ============================================================
// 路由监听
// ============================================================
onMounted(() => {
  // 监听路由变化处理参数（列表数据始终以 URL query 为准，浏览器回退/前进同样生效）
  watch(() => route.query, (newQuery) => {
    if (newQuery.type && newQuery.param) {
      // console.log('query参数路由执行...')
      updateSearchState({
        type: newQuery.type,
        param: newQuery.param
      })
    } else {
      // 回到无筛选条件的首页（含回退/前进）——必须重置筛选，否则会沿用上一次的搜索结果
      updateSearchState(null)
    }
    // 根据模式决定是否重置滚动状态
    if (isScrollMode.value) {
        resetScrollState()
    }
    renderArticleList()
  }, { immediate: true })
})

// ============================================================
// 描述处理
// ============================================================
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
</script>

<style scoped lang="scss">
// ============================================================
// 分页
// ============================================================
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

// ============================================================
// 加载状态
// ============================================================
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