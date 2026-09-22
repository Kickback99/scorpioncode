<!-- components/AppComment.vue -->
<template>
  <v-card class="comment-container" variant="flat" :style="{ '--comment-scale': scale }">
    <v-card-title class="text-h6">
      <v-icon start>mdi-chat-outline</v-icon>
      评论区
      <span class="text-caption text-grey ml-2">({{ totalCount }}条评论)</span>
    </v-card-title>

    <v-divider></v-divider>

    <!-- ===== 评论输入框 ===== -->
    <v-card-text v-if="isLoggedIn">
      <v-textarea
        v-model="commentContent"
        ref="commentInputRef"
        label="写下你的评论..."
        rows="3"
        variant="outlined"
        hide-details
        counter
        maxlength="500"
      ></v-textarea>
      <div class="d-flex align-center mt-2">
        <AppEmojiPicker v-model="commentContent" :input-el="commentInputRef" />
        <v-btn
          class="ml-auto"
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
        <v-icon>mdi-login</v-icon>
        登录后参与评论
      </v-btn>
    </v-card-text>

    <v-divider></v-divider>

    <!-- ===== 评论列表 ===== -->
    <v-card-text v-if="loading && commentList.length === 0" class="text-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-card-text>

    <v-card-text v-else-if="commentList.length === 0" class="text-center py-8 text-grey">
      <!-- PC 固定 48，移动端随 --comment-scale 缩到 38.4 -->
      <v-icon :size="48 * scale" icon="mdi-chat-outline"></v-icon>
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
            <v-list-item class="comment-item" :data-comment-id="comment.id">
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
                    :loading="replyTarget?.id === comment.id"
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
                  <v-list-item class="child-comment-item" :data-comment-id="child.id">
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
                            :loading="replyTarget?.id === child.id"
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
                    <v-icon size="16">mdi-chevron-down</v-icon>
                    查看更多
                  </v-btn>
                  
                  <v-btn
                    variant="text"
                    size="small"
                    color="primary"
                    @click="collapseChildren(comment)"
                    class="mx-1"
                  >
                    <v-icon size="16">mdi-chevron-up</v-icon>
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
                  <v-icon size="16">mdi-chevron-down</v-icon>
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

    <!-- ===== 删除确认对话框 ===== -->
    <v-dialog v-model="deleteDialogVisible" max-width="400" persistent>
      <v-card class="delete-dialog-card" :style="{ '--dialog-scale': scale }">
        <v-card-title class="text-h6">
          <v-icon color="error" start>mdi-delete-outline</v-icon>
          确认删除
        </v-card-title>
        
        <v-card-text class="pt-4">
          <div class="text-body-1">确定要删除这条评论吗？</div>
        </v-card-text>
        
        <v-card-actions>
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
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useUserStore } from '@/store/user'
import { useConfigStore } from '@/store/config'
import emitter from '@/utils/event-bus.js'

import { getCommentsApi, addCommentApi, getChildCommentsApi, deleteCommentApi, getFriendLinkCommentApi } from '@/api/comment'
import AppEmojiPicker from './AppEmojiPicker.vue'
import AppReplyInput from './AppReplyInput.vue'
import { useDialogFontScale } from '@/composables/useDialogFontScale'

// ============================================================
// 数据
// ============================================================
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

// 登录态判定统一走 store getter（cookie 模式看 user 展示缓存，jwt 模式看 token+user）
const isLoggedIn = computed(() => userStore.isLoggedIn)
const loading = ref(false)
const scrollLoading = ref(false)
const commentList = ref([])
const total = ref(0)
const pageSize = computed(() => configStore.parentPageSize)
const currentPage = ref(1)
const hasMore = ref(true)

const commentContent = ref('')
// 仅用于交给 AppEmojiPicker 读光标位置与 maxlength，本文件不碰表情逻辑
const commentInputRef = ref(null)
const submitLoading = ref(false)

const replyTarget = ref(null)
const replyContent = ref('')
const replyLoading = ref(false)

// ============================================================
// 工具方法
// ============================================================
// 根据评论类型动态获取评论是否启用（使用 configStore 的方法）
const isCommentTypeEnabled = () => {
  return configStore.isCommentTypeEnabledWithExtra(props.commentType, props.isComment)
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

// ============================================================
// 评论列表
// ============================================================
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

// 逐页拉取子评论直到覆盖 targetCount：首页覆盖已有数据，后续页追加（保持分页对齐）
const loadChildrenUpTo = async (comment, targetCount) => {
  comment.childLoading = true
  try {
    const pages = Math.ceil(targetCount / childPageSize.value)
    for (let pageNum = 1; pageNum <= pages; pageNum++) {
      const res = await getChildCommentsApi(comment.id, pageNum, childPageSize.value)
      if (res.code !== 200 || !res.data) return
      const { children, total, hasMore } = res.data
      comment.childTotal = total
      comment.hasMoreChild = hasMore
      comment.displayChildren = pageNum === 1 ? (children || []) : comment.displayChildren.concat(children || [])
      // 子评论被删光了，或已到底
      if (!hasMore) return
    }
  } catch (error) {
    console.error('加载子评论失败:', error)
  } finally {
    comment.childLoading = false
  }
}

// 重载后恢复展开态：按展开时加载过的页数重新拉回。
// 传数组而不是直接读 commentList：新数据要装配完才整体替换，此时它还没进 commentList
const restoreExpandedChildren = async (expandedSnapshot, comments) => {
  const targets = comments.filter(comment => {
    const loadedCount = expandedSnapshot.get(comment.id)
    return loadedCount > (comment.displayChildren?.length || 0)
  })

  await Promise.all(targets.map(comment => {
    comment.isChildExpanded = true
    return loadChildrenUpTo(comment, expandedSnapshot.get(comment.id))
  }))
}

// 回复后定点刷新目标根评论的子评论：整体重载会清空列表，把视口钳到顶部并丢掉已加载的分页
const refreshCommentChildren = async (rootId) => {
  const comment = commentList.value.find(item => item.id === rootId)
  // 目标不在当前列表，退回整体刷新
  if (!comment) return loadComments()

  // 展开态：拉回原有条数，保持展开。
  // 下限取打底条数：这条原本 0 条子评论时 displayChildren 为空，页数算出来是 0，会一个请求都不发，
  // 刚发的回复永远不显示（childTotal 也停在 0，子评论区块整个不渲染）
  if (comment.isChildExpanded) {
    return loadChildrenUpTo(comment, Math.max(comment.displayChildren.length, childCommentLimit.value, 1))
  }

  // 收起态：只重装打底数据，展示结构不变（子评论倒序，新回复本就是打底第 1 条）
  const res = await getChildCommentsApi(comment.id, 1, Math.max(childCommentLimit.value, 1))
  if (res.code !== 200 || !res.data) return
  comment.children = res.data.children || []
  comment.childTotal = res.data.total
  comment.hasMoreChild = res.data.hasMore
  initCommentChildren(comment)
}

// 平滑滚到指定评论（根评论与子评论都带 data-comment-id 锚点，id 全表唯一）。
// block 默认居中；收起场景传 'nearest'，只做最小位移，配合 .comment-item 的 scroll-margin-top 避开吸顶导航
const scrollToComment = (commentId, block = 'center') => {
  document
    .querySelector(`[data-comment-id="${commentId}"]`)
    ?.scrollIntoView({ behavior: 'smooth', block })
}

// 回复后平滑滚到自己的那条回复：子评论倒序，新回复排在目标根评论的最前
const scrollToMyReply = async (rootId, content) => {
  await nextTick()
  const comment = commentList.value.find(item => item.id === rootId)
  const myId = userStore.user?.id
  const myReply = comment?.displayChildren?.find(
    child => child.createBy === myId && child.content === content
  )
  // 待审 / 被拦截 / 静默丢弃的回复不在列表里，找不到就不滚
  if (myReply) scrollToComment(myReply.id)
}

// 发表根评论后把新评论滚进视野：根评论倒序，新发的排在最前。
// 用 nearest 只做最小位移 —— 输入框就在列表上方，多数时候它本来就在视野里，不必强行居中
const scrollToMyComment = async (content) => {
  await nextTick()
  const myId = userStore.user?.id
  const myComment = commentList.value.find(
    comment => comment.createBy === myId && comment.content === content
  )
  // 待审 / 被拦截 / 静默丢弃的评论不在列表里，找不到就不滚
  if (myComment) scrollToComment(myComment.id, 'nearest')
}

// 重置分页状态。不清空 commentList：保留旧内容继续渲染到新数据就绪，
// 否则文档高度会瞬间塌到一屏高，整块闪一下、视口还会被钳到顶部
const resetScrollState = () => {
  currentPage.value = 1
  total.value = 0
  hasMore.value = true
}

// 初始化加载：按重载前已加载的页数逐页拉回
const initLoadComments = async () => {
  if (!isCommentTypeEnabled()) return

  // 重载前记录展开态：重载后只剩打底条数，用户看不到刚发的回复
  const expandedSnapshot = new Map(
    commentList.value
      .filter(comment => comment.isChildExpanded)
      .map(comment => [comment.id, comment.displayChildren?.length || 0])
  )
  // 用户已经翻到第几页。只拉第 1 页会把列表截短（翻到第 3 页删一条就被打回第 1 页）；
  // 换文章时由 watch 重置回 1
  const loadedPages = currentPage.value

  loading.value = true
  resetScrollState()

  try {
    const newComments = []
    let loadedTotal = 0
    let lastPage = 1
    let lastPageFull = false
    let anyPageLoaded = false

    for (let pageNum = 1; pageNum <= loadedPages; pageNum++) {
      // 根据评论类型调用不同API
      const res = props.commentType === 'friendLink'
        ? await getFriendLinkCommentApi(pageNum, pageSize.value)
        : await getCommentsApi(pageNum, pageSize.value, props.articleId)
      if (res.code !== 200 || !res.data) break

      anyPageLoaded = true
      const items = res.data.items || []
      newComments.push(...items)
      loadedTotal = res.data.total || 0
      lastPage = pageNum
      lastPageFull = items.length >= pageSize.value
      // 这一页没满说明已经到底，或已凑够总数，都不用再往下翻
      if (!lastPageFull || newComments.length >= loadedTotal) break
    }

    // 一页都没成功（接口异常）：保留旧列表，不把页面清空
    if (!anyPageLoaded) return

    // 先在新数组上装配好再一次性替换：中途不让 DOM 看到「打底态」，
    // 只有一次 patch，避免先塌回打底再展开的来回抖
    newComments.forEach(comment => {
      initCommentChildren(comment)
    })
    await restoreExpandedChildren(expandedSnapshot, newComments)

    commentList.value = newComments
    total.value = loadedTotal
    currentPage.value = lastPage
    hasMore.value = lastPageFull && newComments.length < loadedTotal
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

// ============================================================
// 子评论
// ============================================================
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
const collapseChildren = async (comment) => {

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

  // 子列表变矮不会自动补偿滚动，而收起按钮又在列表底部，这条评论常被甩出视口，滚回去。
  // nextTick 之后高度已经缩完，位置才是最终位置；'nearest' 只做最小位移，本来就在视野内就完全不动
  await nextTick()
  scrollToComment(comment.id, 'nearest')
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

// ============================================================
// 发表与回复
// ============================================================
// 发表评论
const submitComment = async () => {
  if (!commentContent.value.trim()) return
  
  // 清空输入框前先留住内容，用于刷新后定位自己刚发的那条
  const content = commentContent.value
  submitLoading.value = true
  try {
    // 根据评论类型设置不同的 type 值（0为文章评论，1为友链评论）
    const commentTypeValue = props.commentType === 'friendLink' ? '1' : '0'

    const res = await addCommentApi({
      articleId: props.articleId,
      content,
      type: commentTypeValue
    })
    if (res.code === 200) {
      // 口径同 submitReply：只承诺「已提交」，不承诺「已展示」
      window.$snackbar?.success('评论已提交')
      commentContent.value = ''
      // 未命中规则的评论已自动通过，刷新即可看到（与 submitReply 一致）；命中待审的不会出现在列表里
      await loadComments()
      await scrollToMyComment(content)
    }
  } catch (error) {
    // 401 及其余错误提示已由 http.js 拦截器统一处理，此处仅记录日志
    console.error('发表评论失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 开始回复
const startReply = (comment) => {
  if(!isLoggedIn.value){
    // 未登录，直接触发登录弹窗（不弹 snackbar，与「登录后参与评论」入口保持一致）
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

  // cancelReply 会清空 replyTarget 与 replyContent，先取出定位新回复所需的信息
  const rootId = replyTarget.value.rootId
  const content = replyContent.value

  replyLoading.value = true
  try {
    // 根据评论类型设置不同的 type 值（0为文章评论，1为友链评论）
    const commentTypeValue = props.commentType === 'friendLink' ? '1' : '0'
    const res = await addCommentApi({
      articleId: props.articleId,
      content,
      type: commentTypeValue,
      rootId: replyTarget.value.rootId,
      toCommentId: replyTarget.value.id,
      toCommentUserId: replyTarget.value.createBy
    })
    if (res.code === 200) {
      // 只承诺「已提交」：后端对已通过/待审/被拦截/高危静默都返回成功，
      // 承诺「已展示」会在后三种情况下落空（待审的连「我的评论」都查不到）
      window.$snackbar?.success('回复已提交')
      cancelReply()
      await refreshCommentChildren(rootId)
      await scrollToMyReply(rootId, content)
    }
  } catch (error) {
    // 401 及其余错误提示已由 http.js 拦截器统一处理，此处仅记录日志
    console.error('回复失败:', error)
  } finally {
    replyLoading.value = false
  }
}

const showLoginDialog = () => {
  emitter.emit('loginDialogVisible', true)
}

// ============================================================
// 展示辅助
// ============================================================
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
    'mdi-account',
    'mdi-account-cowboy-hat',
    'mdi-account-star',
    'mdi-account-music',
    'mdi-account-badge',
    'mdi-crown-outline'
  ]
  const index = (userId || 1) % icons.length
  return icons[index]
}

// ============================================================
// 删除评论
// ============================================================
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
    // 401 及其余错误提示已由 http.js 拦截器统一处理，此处仅记录日志
    console.error('删除评论失败:', error)
  } finally {
    isDeleting.value = false
    deletingCommentId.value = null
    deleteDialogVisible.value = false
  }
}

// ============================================================
// 监听
// ============================================================
watch(() => props.articleId, () => {
  if (isCommentTypeEnabled()) {
    // 换文章必须显式清空并回第 1 页：重载会按 currentPage 拉回已加载的页数，
    // 不清会把上一篇的评论和页数带过来
    commentList.value = []
    currentPage.value = 1
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

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
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

/* v-btn 的加载圈没传 size，吃的是 v-progress-circular 默认值（实测 21px），
   塞进 32px 的 x-small 图标按钮里比图标（18px）还大，统一收到 16px */
:deep(.v-btn__loader .v-progress-circular) {
  width: 16px;
  height: 16px;
}

.comment-item {
  padding: 12px 16px !important;
  /* 收起后按 'nearest' 对齐到视口顶部时，避开 64px 吸顶导航（+8px 间距） */
  scroll-margin-top: 72px;
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

// ============================================================
// 删除确认弹窗字号缩放
// 弹窗被 teleport 到 body，量不到 --comment-scale，需单独挂 --dialog-scale
// ============================================================
.delete-dialog-card {
  --dialog-scale: 1;

  // 标题：确认删除
  :deep(.v-card-title) {
    font-size: calc(1.25rem * var(--dialog-scale)) !important;
  }

  // 正文：确定要删除这条评论吗？
  :deep(.text-body-1) {
    font-size: calc(1rem * var(--dialog-scale)) !important;
  }

  // 按钮：取消 / 确认删除
  :deep(.v-btn) {
    --v-btn-size: calc(0.875rem * var(--dialog-scale)) !important;
  }
}
</style>