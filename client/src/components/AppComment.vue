<!-- components/AppComment.vue -->
<template>
  <v-card class="comment-container" variant="flat" :style="{ '--comment-scale': scale }">
    <v-card-title class="text-h6">
      <v-icon start>mdi-chat-outline</v-icon>
      评论区
      <span class="text-caption text-grey ml-2">({{ totalCount }}条评论)</span>
    </v-card-title>

    <v-divider></v-divider>

    <!-- 评论输入框 -->
    <v-card-text v-if="isLoggedIn">
      <v-textarea
        v-model="commentContent"
        label="写下你的评论..."
        rows="3"
        variant="outlined"
        hide-details
        counter
        maxlength="500"
      ></v-textarea>
      <div class="d-flex justify-end mt-2">
        <v-btn
          color="primary"
          :loading="submitLoading"
          :disabled="!commentContent.trim()"
          @click="submitComment"
          size="small"
        >
          发表评论
        </v-btn>
      </div>
    </v-card-text>

    <v-card-text v-else class="text-center py-4">
      <v-btn
        color="primary"
        variant="text"
        @click="showLoginDialog"
      >
        <v-icon left>mdi-login</v-icon>
        登录后参与评论
      </v-btn>
    </v-card-text>

    <v-divider></v-divider>

    <!-- 评论列表 -->
    <v-card-text v-if="loading && commentList.length === 0" class="text-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-card-text>

    <v-card-text v-else-if="commentList.length === 0" class="text-center py-8 text-grey">
      <v-icon size="48" icon="mdi-chat-outline"></v-icon>
      <div class="mt-2">暂无评论，快来抢沙发吧~</div>
    </v-card-text>

    <v-card-text v-else class="pa-0">
      <v-infinite-scroll
        :height="'auto'"
        :loading="scrollLoading"
        @load="loadMoreComments"
      >
        <v-list lines="two" class="bg-transparent">
          <template v-for="comment in commentList" :key="comment.id">
            <v-list-item class="comment-item">
              <template v-slot:prepend>
                <v-avatar size="35">
                  <!-- 优先显示真实头像，没有则显示图标 -->
                  <v-img 
                    v-if="comment.userAvatar" 
                    :src="comment.userAvatar"
                    :alt="comment.username"
                  ></v-img>
                  <v-icon v-else size="28" :color="getAvatarColor(comment.createBy)">
                    {{ getAvatarIcon(comment.createBy) }}
                  </v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="d-flex align-center">
                <div class="d-flex align-center">
                  <strong class="comment-username">{{ comment.username || '匿名用户' }}</strong>
                  <span class="text-caption text-grey ml-3">
                    {{ formatTime(comment.createTime) }}
                  </span>
                </div>
                <div class="d-flex align-center">
                  <!-- 回复按钮 -->
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="startReply(comment)"
                    :title="`回复${comment.username || '匿名用户'}`"
                  >
                    <v-icon size="18">mdi-reply</v-icon>
                  </v-btn>
                  <!-- 删除按钮 - 只有登录且是自己的评论才显示 -->
                  <v-btn
                    v-if="canDelete(comment)"
                    icon
                    size="x-small"
                    variant="text"
                    @click="deleteComment(comment)"
                    :loading="deletingCommentId === comment.id"
                    :title="'删除评论'"
                  >
                    <v-icon size="18">mdi-delete-outline</v-icon>
                  </v-btn>
                </div>
              </v-list-item-title>

              <v-list-item-title class="mt-1 comment-content">
                <template v-if="comment.status === 1">
                  <span class="text-grey">评论因违反社区规范已被屏蔽</span>
                </template>
                <template v-else>
                  {{ comment.content }}
                </template>
              </v-list-item-title>

            </v-list-item>

            <!-- 根评论回复输入框 -->
            <AppReplyInput
              v-if="replyTarget && replyTarget.id === comment.id"
              :targetUsername="comment.username"
              :isChildReply="false"
              :loading="replyLoading"
              v-model:content="replyContent"
              @submit="submitReply"
              @cancel="cancelReply"
            />

            <!-- 子评论区域（整合v1逻辑） -->
            <div v-if="comment.children?.length > 0 || comment.childTotal > 0">
              <!-- 子评论列表容器 -->
              <div class="children-list">
                <template v-for="child in comment.displayChildren" :key="child.id">
                  <v-list-item class="child-comment-item">
                    <template v-slot:prepend>
                      <v-avatar size="27">
                        <!-- 优先显示真实头像，没有则显示图标 -->
                        <v-img 
                          v-if="child.userAvatar" 
                          :src="child.userAvatar"
                          :alt="child.username"
                        ></v-img>
                        <v-icon v-else size="20" :color="getAvatarColor(child.createBy)">
                          {{ getAvatarIcon(child.createBy) }}
                        </v-icon>
                      </v-avatar>
                    </template>

                    <v-list-item-title class="text-body-2">
                      <div class="d-flex align-center mb-1">
                        <strong class="comment-username">{{ child.username || '匿名用户' }}</strong>
                        <span 
                          v-if="child.toCommentUserName && child.toCommentUserId !== -1 && child.toCommentId !== child.rootId" 
                          class="text-caption ms-1">
                          <strong class="comment-username">@ {{ child.toCommentUserName }}</strong>
                        </span>
                      </div>
                      <div class="comment-content">
                        <template v-if="child.status === 1">
                          <span class="text-grey">评论因违反社区规范已被屏蔽</span>
                        </template>
                        <template v-else>
                          {{ child.content }}
                        </template>
                      </div>
                    </v-list-item-title>

                    <v-list-item-title class="text-body-2">
                        <div class="d-flex align-center">
                          <!-- 日期 -->
                          <span class="text-caption text-grey">{{ formatTime(child.createTime) }}</span>

                          <!-- 回复按钮 -->
                          <v-btn
                            icon
                            size="x-small"
                            variant="text"
                            @click="startReply(child)"
                            title="回复"
                          >
                            <v-icon size="16">mdi-reply</v-icon>
                          </v-btn>

                          <!-- 子评论删除按钮 -->
                          <v-btn
                            v-if="canDelete(child)"
                            icon
                            size="x-small"
                            variant="text"
                            @click="deleteComment(child)"
                            :loading="deletingCommentId === child.id"
                            :title="'删除评论'"
                          >
                            <v-icon size="16">mdi-delete-outline</v-icon>
                          </v-btn>
                        </div>
                    </v-list-item-title>

                  </v-list-item>

                  <AppReplyInput
                    v-if="replyTarget && replyTarget.id === child.id"
                    :targetUsername="child.username"
                    :isChildReply="true"
                    :loading="replyLoading"
                    v-model:content="replyContent"
                    @submit="submitReply"
                    @cancel="cancelReply"
                  />
                </template>
              </div>

              <!-- 底部操作按钮 -->
              <div class="child-actions-wrapper" v-if="shouldShowChildActions(comment)">
                <!-- 展开状态 -->
                <template v-if="comment.isChildExpanded">
                  <v-btn
                    v-if="comment.hasMoreChild"
                    variant="text"
                    size="small"
                    color="primary"
                    :loading="comment.childLoading"
                    @click="loadMoreChildren(comment)"
                    class="mx-1"
                  >
                    <v-icon left size="16">mdi-chevron-down</v-icon>
                    查看更多
                  </v-btn>
                  
                  <v-btn
                    variant="text"
                    size="small"
                    color="primary"
                    @click="collapseChildren(comment)"
                    class="mx-1"
                  >
                    <v-icon left size="16">mdi-chevron-up</v-icon>
                    收起
                  </v-btn>
                </template>
                
                <!-- 收起状态 -->
                <v-btn
                  v-else
                  variant="text"
                  size="small"
                  color="primary"
                  @click="expandChildren(comment)"
                >
                  <v-icon left size="16">mdi-chevron-down</v-icon>
                  查看剩余 {{ getRemainingCount(comment) }} 条回复
                </v-btn>
              </div>
            </div>

            <v-divider v-if="comment !== commentList[commentList.length-1]"></v-divider>
          </template>
        </v-list>

        <template v-slot:loading>
          <div class="text-center py-4">
            <v-progress-circular indeterminate size="32" color="primary"></v-progress-circular>
            <div class="text-caption text-grey mt-2">加载更多评论中...</div>
          </div>
        </template>

        <template v-slot:empty>
          <div class="text-center py-4 text-grey">
            <div class="text-caption">已经到底了~</div>
          </div>
        </template>
      </v-infinite-scroll>
    </v-card-text>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialogVisible" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="error" start>mdi-delete-outline</v-icon>
          确认删除
        </v-card-title>
        
        <v-card-text class="pt-4">
          <div class="text-body-1 mb-2">确定要删除这条评论吗？</div>
          <div class="text-caption text-grey">
            <v-icon size="16" color="warning">mdi-alert</v-icon>
            删除评论后，评论下所有回复都会被删除
          </div>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="cancelDelete"
            :disabled="isDeleting"
          >
            取消
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="isDeleting"
            @click="confirmDelete"
          >
            确认删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-card>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useConfigStore } from '@/store/config'
import emitter from '@/utils/event-bus.js'

import { getCommentsApi, addCommentApi, getChildCommentsApi, deleteCommentApi, getFriendLinkCommentApi } from '@/api/comment'
import AppReplyInput from './AppReplyInput.vue'
import { useDialogFontScale } from '@/composables/useDialogFontScale'

const props = defineProps({
  articleId: {
    type: [Number, String],
    required: true
  },
  isComment: {
    type: [Number, String],
  },
  totalCount: {
    type: Number,
    default: 0
  },
  // 评论类型，'article' 为文章评论，'link' 为友链评论
  commentType: {
    type: String,
    default: 'article'
  }
})

const emit = defineEmits(['comment-deleted'])

const userStore = useUserStore()
const configStore = useConfigStore()
const scale = useDialogFontScale()

// 子评论显示限制数量（默认3条）
const childCommentLimit = ref(3)

// 子评论分页大小（默认10条）
const childPageSize = ref(10)

const isLoggedIn = ref(false)
const loading = ref(false)
const scrollLoading = ref(false)
const commentList = ref([])
const total = ref(0)
const pageSize = computed(() => configStore.parentPageSize)
const currentPage = ref(1)
const hasMore = ref(true)

const commentContent = ref('')
const submitLoading = ref(false)

const replyTarget = ref(null)
const replyContent = ref('')
const replyLoading = ref(false)

// 根据评论类型动态获取评论是否启用（使用 configStore 的方法）
const isCommentTypeEnabled = () => {
  return configStore.isCommentTypeEnabledWithExtra(props.commentType, props.isComment)
}

const checkLogin = () => {
  // 登录态判定统一走 store getter（cookie 模式看 user 展示缓存，jwt 模式看 token+user）
  isLoggedIn.value = userStore.isLoggedIn
}

// 判断是否显示操作按钮
const shouldShowChildActions = (comment) => {
  if (comment.childTotal === 0) return false
  
  if (childCommentLimit.value === 0) {
    return comment.childTotal > 0
  }
  
  return comment.childTotal > childCommentLimit.value
}

// 初始化配置
const initConfig = () => {
  // 从配置中获取子评论显示数量(使用 getter)
  childCommentLimit.value = configStore.childCommentLimit
  // 从配置中获取子评论分页大小(使用 getter)
  childPageSize.value = configStore.childPageSize
}

// 获取剩余回复数量
const getRemainingCount = (comment) => {
  if (!comment.childTotal) return 0
  const displayedCount = comment.displayChildren?.length || 0
  const remaining = comment.childTotal - displayedCount
  return remaining > 0 ? remaining : 0
}

// 初始化评论的子评论状态（整合v1逻辑）
const initCommentChildren = (comment) => {
  comment.childLoading = false
  comment.originalChildren = [...(comment.children || [])]
  comment.childTotal = comment.childTotal || 0

    // 初始化缓存字段
  comment.cachedChildren = null
  comment.cachedHasMore = false
  
  if (childCommentLimit.value === 0) {
    // 打底为0：不显示任何子评论
    comment.displayChildren = []
    comment.isChildExpanded = false
    comment.hasMoreChild = comment.hasMoreChild || false
  } else {
    // 打底 > 0
    if (comment.childTotal <= childCommentLimit.value) {
      // 总数不超过打底数量，直接显示全部
      comment.displayChildren = comment.children || []
      comment.isChildExpanded = true
      comment.hasMoreChild = false
    } else {
      // 总数超过打底数量，只显示打底数量
      comment.displayChildren = (comment.children || []).slice(0, childCommentLimit.value)
      comment.isChildExpanded = false
    }
  }
}

// 重置滚动状态
const resetScrollState = () => {
  commentList.value = []
  currentPage.value = 1
  total.value = 0
  hasMore.value = true
}

// 初始化加载第一页
const initLoadComments = async () => {
  if (!isCommentTypeEnabled()) return
  
  loading.value = true
  resetScrollState()
  
  try {
    let res
    // 根据评论类型调用不同API
    if (props.commentType === 'friendLink') {
      res = await getFriendLinkCommentApi(currentPage.value, pageSize.value)
    } else {
      res = await getCommentsApi(currentPage.value, pageSize.value, props.articleId)
    }
    if (res.code === 200 && res.data) {
      const newComments = res.data.items || []
      commentList.value = newComments
      total.value = res.data.total || 0
      
      hasMore.value = newComments.length >= pageSize.value && commentList.value.length < total.value
      
      // 初始化每个评论的子评论状态
      commentList.value.forEach(comment => {
        initCommentChildren(comment)
      })
    }
  } catch (error) {
    console.error('加载评论失败:', error)
    window.$snackbar?.error('加载评论失败')
  } finally {
    loading.value = false
  }
}

// 加载更多（无限滚动）
const loadMoreComments = async ({ done }) => {
  if (!isCommentTypeEnabled() || !hasMore.value) {
    done('empty')
    return
  }
  
  scrollLoading.value = true
  const nextPage = currentPage.value + 1
  
  try {
    let res
    if (props.commentType === 'friendLink') {
      res = await getFriendLinkCommentApi(nextPage, pageSize.value)
    } else {
      res = await getCommentsApi(nextPage, pageSize.value, props.articleId)
    }
    if (res.code === 200 && res.data) {
      const newComments = res.data.items || []
      
      if (newComments.length === 0) {
        hasMore.value = false
        done('empty')
        return
      }
      
      // 初始化新评论的子评论状态
      newComments.forEach(comment => {
        initCommentChildren(comment)
      })
      
      commentList.value.push(...newComments)
      currentPage.value = nextPage
      hasMore.value = commentList.value.length < total.value
      
      done(hasMore.value ? 'ok' : 'empty')
    } else {
      hasMore.value = false
      done('empty')
    }
  } catch (error) {
    console.error('加载更多评论失败:', error)
    window.$snackbar?.error('加载更多评论失败')
    done('error')
  } finally {
    scrollLoading.value = false
  }
}

// 加载评论（用于刷新）
const loadComments = async () => {
  await initLoadComments()
}

// 展开子评论
const expandChildren = async (comment) => {
  // 如果已经显示了全部子评论，不需要再加载
  if (comment.displayChildren.length >= comment.childTotal) {
    comment.isChildExpanded = true
    return
  }

  comment.isChildExpanded = true

  // 优先使用缓存数据
  if (comment.cachedChildren && comment.cachedChildren.length > 0) {
    console.log(`🎯 使用缓存数据恢复评论 ${comment.id}，共 ${comment.cachedChildren.length} 条`)
    comment.displayChildren = [...comment.cachedChildren]
    comment.hasMoreChild = comment.cachedHasMore || false
    return
  }

  // 计算需要加载的数量：使用 childPageSize
  const needLoadCount = childPageSize.value
  
  comment.childLoading = true
  try {
    const res = await getChildCommentsApi(comment.id, 1, needLoadCount)
    if (res.code === 200 && res.data) {
      const { children, total, hasMore } = res.data
      comment.displayChildren = children || []
      comment.childTotal = total
      comment.hasMoreChild = hasMore

      // 保存第一页数据到缓存
      comment.cachedChildren = [...comment.displayChildren]
      comment.cachedHasMore = hasMore

    }
  } catch (error) {
    console.error('加载子评论失败:', error)
    window.$snackbar?.error('加载回复失败')
    comment.isChildExpanded = false
  } finally {
    comment.childLoading = false
  }
}

// 收起子评论
const collapseChildren = (comment) => {

  // 保存当前显示的数据到缓存（用于后续恢复）
  if (comment.displayChildren && comment.displayChildren.length > 0) {
    comment.cachedChildren = [...comment.displayChildren]
    comment.cachedHasMore = comment.hasMoreChild
  }

  if (childCommentLimit.value === 0) {
    comment.displayChildren = []
  } else {
    if (comment.childTotal <= childCommentLimit.value) {
      comment.displayChildren = comment.originalChildren || comment.children || []
    } else {
      comment.displayChildren = (comment.originalChildren || comment.children || []).slice(0, childCommentLimit.value)
    }
  }
  comment.isChildExpanded = false
}

// 加载更多子评论
const loadMoreChildren = async (comment) => {
  if (comment.childLoading) return
  
  const currentDisplayCount = comment.displayChildren.length
  const nextPageNum = Math.ceil(currentDisplayCount / childPageSize.value) + 1
  
  comment.childLoading = true
  try {
    const res = await getChildCommentsApi(comment.id, nextPageNum, childPageSize.value)
    if (res.code === 200 && res.data) {
      const { children, total, hasMore } = res.data
      if (children && children.length > 0) {
        comment.displayChildren.push(...children)

        // 更新缓存（追加新数据）
        comment.cachedChildren = [...comment.displayChildren]
        comment.cachedHasMore = hasMore
      }
      comment.childTotal = total
      comment.hasMoreChild = hasMore
    }
  } catch (error) {
    console.error('加载子评论失败:', error)
    window.$snackbar?.error('加载更多回复失败')
  } finally {
    comment.childLoading = false
  }
}

// 发表评论
const submitComment = async () => {
  if (!commentContent.value.trim()) return
  
  submitLoading.value = true
  try {
    // 根据评论类型设置不同的 type 值（0为文章评论，1为友链评论）
    const commentTypeValue = props.commentType === 'friendLink' ? '1' : '0'

    const res = await addCommentApi({
      articleId: props.articleId,
      content: commentContent.value,
      type: commentTypeValue
    })
    if (res.code === 200) {
      window.$snackbar?.success('评论发表成功')
      commentContent.value = ''
      // await loadComments()
    }
  } catch (error) {
    console.error('发表评论失败:', error)
    if (error.response?.status === 401) {
      window.$snackbar?.error('请先登录')
      emitter.emit('loginDialogVisible', true)
    } else {
      window.$snackbar?.error('发表评论失败')
    }
  } finally {
    submitLoading.value = false
  }
}

// 开始回复
const startReply = (comment) => {
  if(!isLoggedIn.value){
    window.$snackbar?.error('请登录','')
    emitter.emit('loginDialogVisible', true);
    return;
  }
  
  if (replyTarget.value && replyTarget.value.id === comment.id) {
    cancelReply()
    return
  }
  
  replyTarget.value = {
    id: comment.id,
    rootId: comment.rootId === -1 ? comment.id : comment.rootId,
    createBy: comment.createBy,
    username: comment.username,
    content: comment.content
  }
  replyContent.value = ''
}

const cancelReply = () => {
  replyTarget.value = null
  replyContent.value = ''
}

const submitReply = async () => {
  if (!replyContent.value.trim() || !replyTarget.value) return
  
  replyLoading.value = true
  try {
    // 根据评论类型设置不同的 type 值（0为文章评论，1为友链评论）
    const commentTypeValue = props.commentType === 'friendLink' ? '1' : '0'
    const res = await addCommentApi({
      articleId: props.articleId,
      content: replyContent.value,
      type: commentTypeValue,
      rootId: replyTarget.value.rootId,
      toCommentId: replyTarget.value.id,
      toCommentUserId: replyTarget.value.createBy
    })
    if (res.code === 200) {
      window.$snackbar?.success('回复成功')
      cancelReply()
      await loadComments()
    }
  } catch (error) {
    console.error('回复失败:', error)
    if (error.response?.status === 401) {
      window.$snackbar?.error('请先登录')
      emitter.emit('loginDialogVisible', true)
    } else {
      window.$snackbar?.error('回复失败')
    }
  } finally {
    replyLoading.value = false
  }
}

const showLoginDialog = () => {
  emitter.emit('loginDialogVisible', true)
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / (60 * 1000))
  const hours = Math.floor(diff / (60 * 60 * 1000))
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))

  if (minutes < 1) return '刚刚'
  if (minutes >= 1 && minutes < 60) return `${minutes}分钟前`
  if (hours >= 1 && hours < 24) return `${hours}小时前`
  if (days >= 1 && days <= 3) return `${days}天前`
  return time
}

const getAvatarColor = (userId) => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'purple', 'orange']
  const index = (userId || 1) % colors.length
  return colors[index]
}

const getAvatarIcon = (userId) => {
  const icons = [
    'mdi-account-circle',
    'mdi-account-cowboy-hat',
    'mdi-account-star',
    'mdi-account-music',
    'mdi-account-badge',
    'mdi-account-crown'
  ]
  const index = (userId || 1) % icons.length
  return icons[index]
}

// 删除相关状态
const deleteDialogVisible = ref(false)
const deletingCommentId = ref(null)
const isDeleting = ref(false) // 新增：控制删除过程中的 loading 状态

// 判断是否可以删除
const canDelete = (comment) => {
  if (!isLoggedIn.value) return false
  const currentUserId = userStore.user?.id
  return comment.createBy === currentUserId
}

// 打开删除确认对话框
const deleteComment = (comment) => {
  deletingCommentId.value = comment.id
  deleteDialogVisible.value = true
}

// 取消删除
const cancelDelete = () => {
  deleteDialogVisible.value = false
  deletingCommentId.value = null
  isDeleting.value = false
}

// 确认删除
const confirmDelete = async () => {
  if (!deletingCommentId.value) return

   isDeleting.value = true
  
  try {
    const res = await deleteCommentApi(deletingCommentId.value)
    window.$snackbar?.success(res.message || '删除成功')
    await loadComments() // 刷新评论列表
    emit('comment-deleted')
  } catch (error) {
    console.error('删除评论失败:', error)
    if (error.response?.status === 401) {
      window.$snackbar?.error('请先登录')
      emitter.emit('loginDialogVisible', true)
    } else {
      window.$snackbar?.error(error.response?.data?.message || '删除失败')
    }
  } finally {
    isDeleting.value = false
    deletingCommentId.value = null
    deleteDialogVisible.value = false
  }
}

// 监听用户登录状态变化
watch(() => userStore.token, () => {
  checkLogin()
})

watch(() => props.articleId, () => {
  if (isCommentTypeEnabled()) {
    loadComments()
  }
})

// 监听文章评论变化
/* watch(() => configStore.comment?.article.comment_enabled, (newVal) => {
  if (props.commentType === 'article' && newVal && props.articleId) {
    loadComments()
  }
}) */

// 监听友链评论变化
/* watch(() => configStore.comment?.friend_link_comment_enabled, (newVal) => {
  if (props.commentType === 'friendLink' && newVal) {
    loadComments()
  }
}) */

// 监听配置变化，重新加载
/* watch(() => configStore.comment?.child_comment_limit, (newVal, oldVal) => {
  if (newVal !== undefined && newVal !== null && props.articleId && isCommentTypeEnabled()) {
    loadComments()
  }
}) */

// 监听子评论分页大小变化
/* watch(() => configStore.comment.child_page_size, (newVal) => {
  if (newVal !== undefined && newVal !== null) {
    childPageSize.value = newVal
  }
}) */

onMounted(() => {
  checkLogin()
  initConfig()
  if (isCommentTypeEnabled() && (props.commentType === 'friendLink' || props.articleId)) {
    loadComments()
  }
})
</script>

<style scoped>
.comment-container {
  background-color: rgba(var(--v-theme-surface), 0.5);
  backdrop-filter: blur(2px);
}

.comment-item {
  padding: 12px 16px !important;
}

.comment-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.03);
}

.child-comment-item {
  padding: 8px 12px 8px 56px !important;
}

.children-list {
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 12px;
  margin: 4px 12px 4px 44px;
}

.comment-username {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.comment-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.87);
}

.child-actions-wrapper {
  padding: 8px 16px 12px 56px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-top: 1px dashed rgba(var(--v-theme-primary), 0.15);
  margin-top: 4px;
}

@media (max-width: 600px) {
  .children-list {
    margin-left: 8px;
    margin-right: 8px;
  }
  
  .child-comment-item {
    padding-left: 40px !important;
  }

  .child-actions-wrapper {
    padding-left: 40px;
    padding-right: 8px;
  }
}

:deep(.v-list-item__prepend) {
  align-self: start !important;
}
</style>

<style scoped lang="scss">
// ============================================================
// 移动端字号缩放
// ============================================================
.comment-container {
  --comment-scale: 1;

  // 标题：评论区
  :deep(.v-card-title) {
    font-size: calc(1.25rem * var(--comment-scale)) !important;
  }

  // 辅助说明文字：条数 / 时间 / @回复对象 / 加载提示等
  .text-caption {
    font-size: calc(0.75rem * var(--comment-scale)) !important;
  }

  // 评论输入框文字与占位符
  :deep(.v-field),
  :deep(.v-field .v-label) {
    font-size: calc(1rem * var(--comment-scale)) !important;
  }

  // 按钮：发表评论 / 登录后参与评论 / 查看更多 / 收起等
  :deep(.v-btn) {
    --v-btn-size: calc(0.875rem * var(--comment-scale)) !important;
  }

  // 空状态文字：暂无评论，快来抢沙发吧~
  :deep(.v-card-text.text-grey) {
    font-size: calc(0.875rem * var(--comment-scale)) !important;
  }

  // 根评论正文与用户名（body-1 = 1rem）
  .comment-item {
    :deep(.v-list-item-title) {
      font-size: calc(1rem * var(--comment-scale)) !important;
    }
  }

  // 子评论正文与用户名（text-body-2 = 0.875rem）
  .child-comment-item {
    :deep(.v-list-item-title) {
      font-size: calc(0.875rem * var(--comment-scale)) !important;
    }
  }
}
</style>