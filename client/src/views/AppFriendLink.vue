<template>
  <v-container>

      <!-- 顶部进度条 -->
    <div v-if="loading" class="loading-wrapper">
      <v-progress-linear
        indeterminate
        color="warning"
        height="2"
        class="loading-bar"
      />
    </div>

    <v-sheet class="mx-auto" :width="sheetWidth">
      <!-- 友链网格 - 响应式布局：屏幕有多宽就显示多少列 -->
      <template v-if="friendLinkList.length > 0">
        <v-row dense>
          <v-col
            v-for="item in friendLinkList"
            :key="item.id"
            :cols="cols"
            :sm="sm"
            :md="md"
            :lg="lg"
            :xl="xl"
            class="d-flex"
          >
            <v-card
              :href="item.address"
              target="_blank"
              rel="noopener noreferrer"
              class="friend-link-card w-100"
              variant="outlined"
              rounded="lg"
            >
              <div class="d-flex align-center pa-4">
                <!-- 头像/Logo -->
                <v-avatar size="50" class="mr-3">
                  <v-img :src="item.logo" :alt="item.name" cover />
                </v-avatar>

                <!-- 名称和描述 -->
                <div class="flex-grow-1 overflow-hidden">
                  <div class="font-weight-medium text-truncate">{{ item.name }}</div>
                  <div class="text-caption text-grey text-truncate">{{ item.description }}</div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- 无限滚动加载 -->
        <v-infinite-scroll
          :status="scrollStatus"
          @load="loadMore"
        >
          <template v-slot:loading>
            <div class="text-center py-4">
              <v-progress-circular indeterminate size="32" color="primary" />
              <div class="text-caption text-grey mt-2">加载更多友链中...</div>
            </div>
          </template>

          <template v-slot:empty>
            <div class="text-center py-4 text-grey">
              <div class="text-caption">已经到底了~</div>
            </div>
          </template>
        </v-infinite-scroll>
      </template>

      <!-- 空状态 -->
      <v-card v-else-if="!loading && friendLinkList.length === 0">
        <v-empty-state
          icon="mdi-link-variant-off"
          title="暂无友链"
          text="当前没有任何友情链接"
        />
      </v-card>

      <div class="mt-5" v-if="configStore.getFriendLinkCommentEnabled()">
        <!-- 复用 AppComment 组件，传入友链ID和API类型 -->
        <AppComment 
          :articleId="null" 
          :totalCount="totalCount"
          commentType="friendLink"
          @comment-deleted="handleCommentCountChange"
        />
      </div>
    </v-sheet>
  </v-container>
</template>

<script setup>
import { ref, computed  } from 'vue'
import AppComment from '@/components/AppComment.vue'
import { getFriendLinkCommentCountApi } from '@/api/comment'
import { useConfigStore } from '@/store/config'
const configStore = useConfigStore()
import { useDisplay } from 'vuetify'
import { getClientFriendLinkListApi } from '@/api/friendLink'

// 响应式断点
const { name: breakpointName } = useDisplay()

// 计算 sheet 的宽度（基于栅格系统的9格）
const sheetWidth = computed(() => {
  const bp = breakpointName.value
  // 9/12 = 75%，这里用百分比
  if (bp === 'xs') return '100%'   //  手机屏幕占100%
  if (bp === 'sm') return '90%'    //  小屏幕占90%
  if (bp === 'md') return '85%'    //  中等屏幕占85%
  if (bp === 'lg') return '75%'    //  大屏幕占75%（9/12）
  if (bp === 'xl') return '70%'    //  超大屏幕占70%
  return '75%'                     //  xxl 占75%
})

// 根据屏幕宽度动态计算每行列数
// xs: 1列, sm: 2列, md: 3列, lg: 4列, xl: 5列, xxl: 6列
const cols = computed(() => {
  const bp = breakpointName.value
  if (bp === 'xs') return 12      // 1列
  if (bp === 'sm') return 6       // 2列
  if (bp === 'md') return 4       // 3列
  if (bp === 'lg') return 3       // 4列
  if (bp === 'xl') return 2.4     // 5列 (12/5)
  return 2                        // xxl: 6列 (12/6)
})

const sm = computed(() => {
  const bp = breakpointName.value
  if (bp === 'xs') return 12
  return undefined
})

const md = computed(() => {
  const bp = breakpointName.value
  if (bp === 'sm') return 6
  if (bp === 'md') return 4
  return undefined
})

const lg = computed(() => {
  const bp = breakpointName.value
  if (bp === 'lg') return 3
  return undefined
})

const xl = computed(() => {
  const bp = breakpointName.value
  if (bp === 'xl') return 2.4
  if (bp === 'xxl') return 2
  return undefined
})

// 数据状态
const loading = ref(true)
const friendLinkList = ref([])
const params = ref({
  pageNum: 1,
  pageSize: 12
})
const total = ref(0)
const hasMore = ref(true)  // 是否还有更多数据
const scrollStatus = ref('') // 滚动状态: '', 'loading', 'empty'

// 友链评论总数
const totalCount = ref(0)

// 获取友链列表
const fetchFriendLinks = async (isLoadMore = false) => {
  try {
    const res = await getClientFriendLinkListApi(params.value.pageNum, params.value.pageSize)
    if (res.code === 200 && res.data) {
      const newList = res.data.items || []
      if (isLoadMore) {
        friendLinkList.value = [...friendLinkList.value, ...newList]
      } else {
        friendLinkList.value = newList
      }
      total.value = res.data.total || 0
      
      // 判断是否还有更多数据
      hasMore.value = friendLinkList.value.length < total.value

      // 根据是否还有更多数据设置滚动状态
      if (!hasMore.value) {
        scrollStatus.value = 'empty'
      } else {
        scrollStatus.value = ''
      }
    }
  } catch (error) {
    console.error('获取友链列表失败:', error)
  }
}

// 滚动加载更多
const loadMore = async ({ done }) => {
  // 如果没有更多数据，直接完成
  if (!hasMore.value) {
    done('empty')
    return
  }
  
  // 增加页码
  params.value.pageNum++
  
  try {
    const res = await getClientFriendLinkListApi(params.value.pageNum, params.value.pageSize)
    if (res.code === 200 && res.data) {
      const newList = res.data.items || []
      friendLinkList.value = [...friendLinkList.value, ...newList]

      // 重新判断是否还有更多数据
      hasMore.value = friendLinkList.value.length < total.value
      
      if (!hasMore.value) {
        done('empty')
      } else {
        done('ok')
      }
    } else {
      done('error')
    }
  } catch (error) {
    console.error('加载更多友链失败:', error)
    params.value.pageNum-- // 回滚页码
    done('error')
  }
}


// 获取友链评论总数
const fetchLinkCommentCount = async () => {
  try {
    const res = await getFriendLinkCommentCountApi()
    if (res.code === 200 && res.data) {
      totalCount.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取友链评论总数失败:', error)
  }
}

// 处理评论删除后刷新总数
const handleCommentCountChange = async () => {
  await fetchLinkCommentCount()
}

// 初始化加载
const init = async () => {
  loading.value = true
  params.value.pageNum = 1
  friendLinkList.value = []
  
  await fetchFriendLinks(false)
  await fetchLinkCommentCount()
  
  loading.value = false
}

init()
</script>

<style scoped lang="scss">
.loading-wrapper {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  z-index: 9999;
}

.loading-bar {
  position: relative;
}

.friend-link-card {
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.05);
    border-color: rgba(var(--v-theme-primary), 0.5);
  }
}
</style>