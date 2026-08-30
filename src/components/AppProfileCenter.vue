<template>
  <v-container class="profile-center py-6" :style="{ '--profile-center-scale': handleFontScale }">
      <div>
        <!-- 使用动态 direction 属性 -->
        <v-sheet>
          <v-tabs 
          v-model="tab" 
          color="primary"
          direction="horizontal"
          grow
          class="mb-4"
        >
          <v-tab value="profile">
            <v-icon left class="mr-2">mdi-account-circle</v-icon>
            个人资料
          </v-tab>
          <v-tab v-if="configStore.isMyFeedbackEnabled" value="feedback">
            <v-icon left class="mr-2">mdi-message-text</v-icon>
            我的反馈
          </v-tab>
          <v-tab v-if="configStore.isMyPublishesEnabled" value="posts">
            <v-icon left class="mr-2">mdi-file-document</v-icon>
            我的发布
          </v-tab>
          <v-tab v-if="configStore.isMyCommentsEnabled" value="comments">
            <v-icon left class="mr-2">mdi-comment</v-icon>
            我的评论
          </v-tab>
          <v-tab v-if="configStore.isMyFavoritesEnabled" value="favorites">
            <v-icon left class="mr-2">mdi-heart</v-icon>
            我的收藏
          </v-tab>
          </v-tabs>
        </v-sheet>

        <v-divider></v-divider>

        <v-sheet elevation="2" rounded="lg"
         style="overflow: hidden; min-width: 0;"
        >
        <v-tabs-window v-model="tab">
          <!-- 个人资料 Tab -->
          <v-tabs-window-item value="profile">
              <AppProfile @profile-saved="handleProfileSaved" ref="profileRef" />
          </v-tabs-window-item>

          <!-- 我的反馈 Tab -->
          <v-tabs-window-item v-if="configStore.isMyFeedbackEnabled" value="feedback">
            <v-sheet class="pa-6">
              <v-data-table
                :headers="feedbackHeaders"
                :items="feedbackList"
                :loading="feedbackLoading"
                hover
              >
                <template v-slot:item.status="{ item }">
                  <v-chip :color="getStatusColor(item.status)" size="small">
                    {{ item.status }}
                  </v-chip>
                </template>
                <template v-slot:item.createdAt="{ item }">
                  {{ formatDate(item.createdAt) }}
                </template>
                <template v-slot:no-data>
                  <v-empty-state
                    headline="暂无反馈"
                    text="你还没有提交过任何反馈"
                    icon="mdi-message-text-outline"
                  ></v-empty-state>
                </template>
              </v-data-table>
            </v-sheet>
          </v-tabs-window-item>

          <!-- 我的发布 Tab -->
          <v-tabs-window-item v-if="configStore.isMyPublishesEnabled" value="posts">
            <AppContentList
              ref="postListRef"
              content-type="table"
              :load-data-api="articleListApi"
              :delete-api="articleDetailApi"
              :table-headers="postHeaders"
              :enable-search="true"
              search-label="搜索发布的文章"
              search-placeholder="输入文章标题关键词"
              :hide-default-footer="false"
              :hide-default-header="false"
              empty-icon="mdi-file-document-outline"
              empty-headline="暂无发布"
              empty-text="你还没有发布过任何内容"
              :get-item-id="(item) => item.id"
            >
              <template #column-title="{ item }">
                <router-link :to="`/detail/${item.id}`" 
                class="text-decoration-none text-primary"
                    style="display: inline-block; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                >
                  {{ item.title }}
                </router-link>
              </template>

              <template #column-cateName="{ item }">
                {{ item.cateName || '未分类' }}
              </template>

              <template #column-viewCount="{ item }">
                {{ item.viewCount || 0 }}
              </template>

              <template #column-createTime="{ item }">
                <!-- {{ formatDate(item.createTime) }} -->
                {{ item.createTime }}
              </template>

              <template #column-actions="{ item }">
                <v-btn icon variant="text" size="small" color="red" @click="postListRef?.deleteItem?.(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </AppContentList>
          </v-tabs-window-item>

          <!-- 我的评论 Tab -->
          <v-tabs-window-item v-if="configStore.isMyCommentsEnabled" value="comments">
            <AppContentList
              ref="commentListRef"
              content-type="card"
              :load-data-api="getUserCommentsApi"
              :pagination="false"
              :delete-api="deleteCommentApi"
              :table-headers="commentHeaders"
              :enable-search="true"
              search-label="搜索发布的评论"
              search-placeholder="输入文章标题关键词"
              :search-fields="['content']"
              empty-icon="mdi-comment-outline"
              empty-headline="暂无评论"
              empty-text="你还没有发表过任何评论"
              :get-item-id="(item) => item.commentId || item.id"
            >
                <!-- 自定义前置图标 -->
              <template #card-prepend="{ item }">
                <v-avatar size="40" color="grey-lighten-2">
                  <v-icon>mdi-comment</v-icon>
                </v-avatar>
              </template>

              <!-- 自定义标题（评论内容） -->
              <template #card-title="{ item }">
                <router-link 
                  :to="item.type === '0' ? `/detail/${item.articleId}` : '/friendLink'"
                  class="text-decoration-none text-primary font-weight-medium"
                >
                  {{ item.content }}
                </router-link>
              </template>

              <!-- 自定义副标题（时间 + 文章信息） -->
              <template #card-subtitle="{ item }">
                发布于 {{ formatDate(item.createTime) }} · {{ item.type === '0' ? '文章' : '友链' }}
              </template>

              <!-- 自定义操作按钮 -->
              <template #card-append="{ item }">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="red"
                  @click="commentListRef?.deleteItem?.(item)"
                >
                  <v-icon size="18">mdi-delete</v-icon>
                </v-btn>
              </template>

                <!-- 可选：自定义空状态插槽 -->
              <template #empty="{ searchKeyword }">
                <v-empty-state
                  headline="暂无评论"
                  :text="`没有找到包含 “${searchKeyword}” 的评论`"
                  icon="mdi-comment-outline"
                  class="custom-empty-state"
                />
              </template>
            </AppContentList>
          </v-tabs-window-item>

          <!-- 我的收藏 Tab -->
          <v-tabs-window-item v-if="configStore.isMyFavoritesEnabled" value="favorites">
            <AppContentList
              ref="favoriteListRef"
              content-type="grid"
              :load-data-api="userFavoritesApi"
              :delete-api="deleteFavoriteApi"
              :table-headers="favoriteHeaders"
              :hideDefaultHeader="true"
              :enable-search="true"
              search-label="搜索收藏的文章"
              search-placeholder="输入文章标题关键词"
              :search-fields="['title']"
              empty-icon="mdi-heart-outline"
              empty-headline="暂无收藏"
              empty-text="你还没有收藏任何内容"
              :get-item-id="(item) => item.articleId"
            >
              <!-- 自定义标题列 -->
              <template #column-title="{ item }">
                <router-link 
                  :to="`/detail/${item.articleId}`"
                  class="text-decoration-none text-primary"
                >
                  {{ item.title }}
                </router-link>
              </template>

              <!-- 自定义作者列 -->
              <!-- <template #column-author="{ item }">
                {{ item.create_by || '蝎子' }}
              </template> -->

              <!-- 自定义时间列 -->
              <!-- <template #column-createdAt="{ item }">
                {{ formatDate(item.createTime) }}
              </template> -->

              <!-- 自定义操作列 -->
              <template #column-actions="{ item }">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="red"
                  @click="favoriteListRef?.deleteItem?.(item)"
                >
                  <v-icon>mdi-heart-broken</v-icon>
                </v-btn>
              </template>
            </AppContentList>
          </v-tabs-window-item>
        </v-tabs-window>
        </v-sheet>
      </div>
      
  </v-container>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'
import { watch } from 'vue'
import { deleteFavoriteApi, userFavoritesApi, getUserCommentsApi,deleteCommentApi } from '@/api/user'
import AppContentList from './AppContentList.vue'
import { articleDetailApi, articleListApi } from '@/api/article'
import { useConfigStore } from '@/store/config.js'
import AppProfile from './AppProfile.vue'

const configStore = useConfigStore()

const display = useDisplay()

// 移动端字号缩放系数（动态 rem 适配）
const handleFontScale = computed(() => (display.mobile.value ? 0.8 : 1))

// ==================== 个人资料 ====================
// 组件引用
const profileRef = ref(null)

// 处理保存事件
const handleProfileSaved = (data) => {
  console.log('个人资料已保存:', data)
  // 可以在这里做其他处理，比如刷新其他 tab 的数据
}

// 定义评论相关的配置和删除方法
const commentHeaders = [
  { title: '评论内容', key: 'content', align: 'start' },
  { title: '评论时间', key: 'createTime' },
  { title: '操作', key: 'actions', sortable: false, align: 'end' }
]

// Tab 值
const tab = ref('profile')

// 反馈数据
const feedbackHeaders = [
  { title: '标题', key: 'title', align: 'start' },
  { title: '内容', key: 'content' },
  { title: '状态', key: 'status' },
  { title: '提交时间', key: 'createdAt' }
]
const feedbackList = ref([])
const feedbackLoading = ref(false)

// 发布数据
const postHeaders = [
  { title: '标题', key: 'title', align: 'start', width: '220px' },
  { title: '分类', key: 'cateName', width: '100px' },
  { title: '阅读量', key: 'viewCount', width: '80px' },
  { title: '发布时间', key: 'createTime', width:'160px' }
]
const postList = ref([])
const postLoading = ref(false)

// 收藏数据
const favoriteHeaders = [
  { title: '标题', key: 'title', align: 'start' },
  // { title: '作者', key: 'author' },
  // { title: '收藏时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false,align: 'end'  }
]

const getStatusColor = (status) => {
  const colors = {
    '待处理': 'warning',
    '处理中': 'info',
    '已解决': 'success',
    '已关闭': 'grey'
  }
  return colors[status] || 'default'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// TODO: 加载各 tab 数据的方法
const loadFeedback = async () => {
  feedbackLoading.value = true
  try {
    // TODO: 调用接口获取数据
    feedbackList.value = [
      { id: 1, title: '建议增加Python课程', content: '希望增加更多Python实战内容', status: '待处理', createdAt: '2024-01-15' }
    ]
  } finally {
    feedbackLoading.value = false
  }
}

/* const loadPosts = async () => {
  postLoading.value = true
  try {
    postList.value = [
      { id: 1, title: 'Vue3入门教程', category: '前端开发', views: 1234, createdAt: '2024-01-10' }
    ]
  } finally {
    postLoading.value = false
  }
} */

// 组件引用
const postListRef = ref(null)
const commentListRef = ref(null)
const favoriteListRef = ref(null)


// 监听 tab 切换，加载数据
watch(tab, (newTab) => {
  switch (newTab) {
    case 'feedback':
      if (feedbackList.value.length === 0) loadFeedback()
      break
    case 'posts':
      if (configStore.isMyPublishesEnabled) {
        postListRef.value?.loadData()
      }
      break
    case 'comments':
      if (configStore.isMyCommentsEnabled) {
        commentListRef.value?.loadData()
      }
      break
    case 'favorites':
      if (configStore.isMyFavoritesEnabled) {
        favoriteListRef.value?.loadData()
      }
      break
  }
})
</script>

<style scoped>
.profile-center {
  --profile-center-scale: 1;
  max-width: 75%;
  margin: 0 auto;

  h2 {
    font-size: calc(1.5rem * var(--profile-center-scale)) !important;
  }

  h3 {
    font-size: calc(1.25rem * var(--profile-center-scale)) !important;
  }

  .text-caption {
    font-size: calc(0.75rem * var(--profile-center-scale)) !important;
  }

  /* 表单整块缩放：input 经 font:inherit 继承、图标经 em 等比缩放 */
  :deep(.v-field) {
    font-size: calc(1rem * var(--profile-center-scale)) !important;
  }

  /* 浮动 label 固定 1rem，需单独命中（未聚焦时它看起来就是"占位符"） */
  :deep(.v-field .v-label) {
    font-size: calc(1rem * var(--profile-center-scale)) !important;
  }

  /* 按钮字号（Vuetify 经 --v-btn-size 控制） */
  :deep(.v-btn) {
    --v-btn-size: calc(0.875rem * var(--profile-center-scale)) !important;
  }

  /* tab 文字字号 */
  :deep(.v-tab) {
    font-size: calc(0.875rem * var(--profile-center-scale)) !important;
  }
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: white;
}

.comment-item {
  border-bottom: 1px solid #e0e0e0;
}

.comment-item:last-child {
  border-bottom: none;
}

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

/* --------------- 自定义空状态文字大小 --------------- */
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

/* 移动端更小 */
@media (max-width: 600px) {
  .empty-state-container {
    min-height: 150px;
    padding: 16px;
  }
  
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
