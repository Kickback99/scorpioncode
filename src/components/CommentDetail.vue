<!--
评论详情组件
功能：根据评论类型展示不同的详情内容
类型：
  1. 根评论 - 展示父评论 + 所有子评论
  2. 子评论（回复父评论）- 展示父评论 + 当前子评论（当前高亮）
  3. 嵌套评论（回复子评论）- 展示父评论 + 被回复评论 + 当前评论（当前高亮）
-->
<template>
  <div class="comment-detail-container">
    <!-- 情况1：根评论 - 展示所有子评论 -->
    <div v-if="detailMode === 'parent'" class="detail-box">
      <!-- 父评论（当前评论） -->
      <div class="comment-card">
        <div class="comment-card-header">
          <el-avatar :size="32" :src="comment.userAvatar || defaultAvatar" />
          <div class="comment-card-info">
            <span class="username">{{ comment.username }}</span>
            <span class="time">{{ comment.createTime }}</span>
          </div>
        </div>
        <div class="comment-card-content">{{ comment.content }}</div>
      </div>

      <!-- 子评论列表 -->
      <div class="sub-title">子评论 ({{ children.length }})</div>
      <div class="children-list">
        <div 
          v-for="child in children" 
          :key="child.id" 
          class="comment-card child-card"
          :class="{ 'direct-reply': child.toCommentId === child.rootId }"
        >
          <div class="comment-card-header">
            <el-avatar :size="28" :src="child.userAvatar || defaultAvatar" />
            <div class="comment-card-info">
              <span class="username">{{ child.username }}</span>
              <span class="time">{{ child.createTime }}</span>
            </div>
          </div>
          <div class="comment-card-content">
            <!-- 嵌套回复时显示回复目标 -->
            <span v-if="child.toCommentId !== child.rootId && child.toCommentUserName" class="reply-tag">
              @{{ child.toCommentUserName }}
            </span>
            {{ child.content }}
          </div>
        </div>
        <div v-if="children.length === 0" class="empty-tip">暂无子评论</div>
      </div>
      <!-- 滚动到底自动加载更多子评论 -->
      <div ref="loadMoreRef" v-if="hasMoreChildren" class="load-more-tip">
        {{ childrenLoading ? '加载中...' : '下滑加载更多' }}
      </div>
      <div v-else-if="children.length > 0" class="load-more-tip">没有更多了</div>
    </div>

    <!-- 情况2：子评论（直接回复父评论）- 展示父评论 + 当前子评论（当前高亮） -->
    <div v-else-if="detailMode === 'childReply'" class="detail-box">
      <!-- 父评论（普通样式） -->
      <div class="sub-title">父评论</div>
      <div class="comment-card">
        <div class="comment-card-header">
          <el-avatar :size="32" :src="parentComment?.userAvatar || defaultAvatar" />
          <div class="comment-card-info">
            <span class="username">{{ parentComment?.username || '未知用户' }}</span>
            <span class="time">{{ parentComment?.createTime || '未知时间' }}</span>
          </div>
        </div>
        <div class="comment-card-content">{{ parentComment?.content || '无内容' }}</div>
      </div>

      <!-- 当前子评论（高亮 + 绿色边框） -->
      <div class="sub-title">当前回复</div>
      <div class="comment-card current-card">
        <div class="comment-card-header">
          <el-avatar :size="32" :src="comment.userAvatar || defaultAvatar" />
          <div class="comment-card-info">
            <span class="username">{{ comment.username }}</span>
            <span class="time">{{ comment.createTime }}</span>
          </div>
        </div>
        <div class="comment-card-content">{{ comment.content }}</div>
      </div>

      <!-- 谁回复了我 -->
      <div class="sub-title">谁回复了我 ({{ whoRepliedToMe.length }})</div>
      <div class="reply-group" v-if="whoRepliedToMe.length > 0">
          <div v-for="reply in whoRepliedToMe" :key="reply.id" class="comment-card">
              <div class="comment-card-header">
                  <el-avatar :size="28" :src="reply.userAvatar || defaultAvatar" />
                  <div class="comment-card-info">
                      <span class="username">{{ reply.username }}</span>
                      <span class="time">{{ reply.createTime }}</span>
                  </div>
              </div>
              <div class="comment-card-content">
                  <span v-if="reply.toCommentId !== reply.rootId && reply.toCommentUserName" class="reply-tag">
                      @{{ reply.toCommentUserName }}
                  </span>
                  {{ reply.content }}
              </div>
          </div>
      </div>
      <div v-else class="empty-tip">暂无回复</div>
    </div>

    <!-- 情况3：嵌套评论（回复子评论）- 展示父评论 + 被回复评论 + 当前评论（当前高亮） -->
    <div v-else-if="detailMode === 'nestedReply'" class="detail-box">
        <!-- 父评论 -->
        <div class="sub-title">父评论</div>
        <div class="comment-card">
            <div class="comment-card-header">
                <el-avatar :size="32" :src="parentComment?.userAvatar || defaultAvatar" />
                <div class="comment-card-info">
                    <span class="username">{{ parentComment?.username || '未知用户' }}</span>
                    <span class="time">{{ parentComment?.createTime || '未知时间' }}</span>
                </div>
            </div>
            <div class="comment-card-content">{{ parentComment?.content || '无内容' }}</div>
        </div>

        <!-- 回复关联：被回复评论 + 当前回复（在同一个容器内） -->
        <div class="sub-title">回复关联</div>
        <div class="reply-group">
            <!-- 被回复的评论 -->
            <div class="comment-card replied-card">
                <div class="comment-card-header">
                    <el-avatar :size="28" :src="replyToComment?.userAvatar || defaultAvatar" />
                    <div class="comment-card-info">
                        <span class="username">{{ replyToComment?.username || '未知用户' }}</span>
                        <span class="time">{{ replyToComment?.createTime || '未知时间' }}</span>
                    </div>
                </div>
                <div class="comment-card-content">
                    <span v-if="replyToComment?.toCommentId !== replyToComment?.rootId && replyToComment?.toCommentUserName" class="reply-tag">
                        @{{ replyToComment.toCommentUserName }}
                    </span>
                    {{ replyToComment?.content || '无内容' }}
                </div>

            <!-- 当前嵌套评论（左边距 + 高亮） -->
            <div class="comment-card current-card current-reply">
                <div class="comment-card-header">
                    <el-avatar :size="28" :src="comment.userAvatar || defaultAvatar" />
                    <div class="comment-card-info">
                        <span class="username">{{ comment.username }}</span>
                        <span class="time">{{ comment.createTime }}</span>
                    </div>
                </div>
                <div class="comment-card-content">
                    <span class="reply-tag">@{{ replyToComment?.username }}</span>
                    {{ comment.content }}
                </div>
            </div>
            </div>
        </div>

        <!-- 谁回复了我 -->
        <div class="sub-title">谁回复了我 ({{ whoRepliedToMe.length }})</div>
        <div class="reply-group" v-if="whoRepliedToMe.length > 0">
            <div v-for="reply in whoRepliedToMe" :key="reply.id" class="comment-card">
                <div class="comment-card-header">
                    <el-avatar :size="28" :src="reply.userAvatar || defaultAvatar" />
                    <div class="comment-card-info">
                        <span class="username">{{ reply.username }}</span>
                        <span class="time">{{ reply.createTime }}</span>
                    </div>
                </div>
                <div class="comment-card-content">
                    <span v-if="reply.toCommentId !== reply.rootId && reply.toCommentUserName" class="reply-tag">
                        @{{ reply.toCommentUserName }}
                    </span>
                    {{ reply.content }}
                </div>
            </div>
        </div>
        <div v-else class="empty-tip">暂无回复</div>
    </div>

    <!-- 加载中 -->
    <div v-else-if="loading" class="loading-box">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { getCommentsApi, getCommentByIdApi } from '@/api/comment'
import { Loading } from '@element-plus/icons-vue'

// 子评论滚动分页：每页条数
const CHILDREN_PAGE_SIZE = 10

// Props
const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  autoLoad: {
    type: Boolean,
    default: true
  },
  // 新增：排序参数
  sortField: {
      type: String,
      default: 'create_time'
  },
  sortOrder: {
      type: String,
      default: 'DESC'
  }
})

// Emits
const emit = defineEmits(['loaded', 'error'])

// 数据
const loading = ref(false)
const detailMode = ref(null)  // 'parent', 'childReply', 'nestedReply'
const children = ref([])      // 子评论列表（情况1使用）
// 子评论滚动分页状态
const childrenPage = ref(0)          // 已加载页码
const childrenLoading = ref(false)   // 加载中
const hasMoreChildren = ref(true)    // 是否还有更多
const loadMoreRef = ref(null)        // 滚动触底哨兵元素
const parentComment = ref(null)  // 父评论信息（情况2、3使用）
const replyToComment = ref(null)  // 被回复的评论（情况3使用）
// 谁回复了我
const whoRepliedToMe = ref([])

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'


// 评论查询失败时的降级兜底数据
const fallbackComment = (comment) => {
    return {
        username: comment.toCommentUserName || '用户已注销',
        content: '该评论已被删除',
        createTime: '',
        userAvatar: comment.toCommentUserAvatar || null
    }
}


/**
 * 加载子评论（滚动分页：每次请求 CHILDREN_PAGE_SIZE 条，滚动到底自动加载下一页）
 * @param {Number} page 页码（从 1 开始）
 */
const loadChildren = async (page) => {
  if (childrenLoading.value) return
  childrenLoading.value = true
  try {
    const res = await getCommentsApi(page, CHILDREN_PAGE_SIZE, {
      rootId: props.comment.id,
      sortField: props.sortField,
      sortOrder: props.sortOrder
    })
    // 后端第一页会把父评论放在首位，需过滤掉
    const items = (res.data.items || []).filter(item => item.id !== props.comment.id)
    children.value = page === 1 ? items : [...children.value, ...items]
    childrenPage.value = page
    // 返回数量不足一页说明已全部加载完
    hasMoreChildren.value = items.length === CHILDREN_PAGE_SIZE
  } finally {
    childrenLoading.value = false
  }
}

// 滚动到底自动加载更多子评论（哨兵元素进入视口即触发）
let loadMoreObserver = null
watch(loadMoreRef, (el) => {
  loadMoreObserver?.disconnect()
  if (el) {
    loadMoreObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreChildren.value && !childrenLoading.value) {
        loadChildren(childrenPage.value + 1)
      }
    })
    loadMoreObserver.observe(el)
  }
}, { flush: 'post' })

onBeforeUnmount(() => {
  loadMoreObserver?.disconnect()
})

/**
 * 加载详情
 * 后端返回的评论数据已包含 username、userAvatar、toCommentUserName 等字段
 * 无需重复请求用户信息
 */
const loadDetail = async () => {
  if (!props.comment) return

  loading.value = true

  try {
    resetState()

    const comment = props.comment

    // 评论类型判断：
    // 1. rootId === -1 : 根评论
    // 2. toCommentUserId !== -1 && toCommentId === rootId : 子评论（回复父评论）
    // 3. toCommentUserId !== -1 && toCommentId !== rootId : 嵌套评论（回复子评论）

    if (comment.rootId === -1) {
      // 情况1：根评论 - 查询子评论列表（滚动分页）
      detailMode.value = 'parent'
      await loadChildren(1)
    } else {
        // 情况2和3：先查询父评论
        let parentData = null
        try {
          const parentRes = await getCommentByIdApi(comment.rootId)
          parentData = parentRes.data
        } catch (error) {
          parentData = null
        }
        parentComment.value = parentData || fallbackComment(comment)
        const res = await getCommentsApi(1, 999, { 
            rootId: comment.rootId,
            toCommentId: comment.id  // 后端支持这个参数
        })
        // 前端过滤：谁回复了我（toCommentId === comment.id）
        whoRepliedToMe.value = (res.data.items || []).filter(item => item.toCommentId === comment.id)
        // ====================================================

        // 判断当前评论类型
        if (comment.toCommentUserId !== -1 && comment.toCommentId === comment.rootId) {
          detailMode.value = 'childReply'
        } else if (comment.toCommentUserId !== -1 && comment.toCommentId !== comment.rootId) {
          detailMode.value = 'nestedReply'
          // 查询被回复的评论
          let replyToData = null
          try {
            const replyToRes = await getCommentByIdApi(comment.toCommentId)
            replyToData = replyToRes.data
          } catch (error) {
            replyToData = null
          }
          replyToComment.value = replyToData || fallbackComment(comment)
        }
      }

      emit('loaded', { mode: detailMode.value, comment: props.comment })
  } catch (error) {
    console.error('加载详情失败:', error)
    emit('error', error)
  } finally {
    loading.value = false
  }
}

// 重置状态
const resetState = () => {
  detailMode.value = null
  children.value = []
  childrenPage.value = 0
  childrenLoading.value = false
  hasMoreChildren.value = true
  parentComment.value = null
  replyToComment.value = null
  whoRepliedToMe.value = []
}

// 监听comment变化
watch(
  () => props.comment,
  () => {
    if (props.autoLoad) {
      loadDetail()
    }
  },
  { immediate: true, deep: true }
)

// 暴露方法
defineExpose({
  loadDetail,
  resetState
})
</script>

<style scoped lang="scss">
.comment-detail-container {
  width: 100%;
}

.detail-box {
  padding: 8px 0;
}

.sub-title {
  font-size: 14px;
  // font-weight: 500;
  color: var(--el-text-color-regular);
  margin: 16px 0 12px 0;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-info);
}

.comment-card {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s;

  &:hover {
    box-shadow: var(--el-box-shadow-light);
  }
}

// 当前高亮评论（绿色边框 + 浅绿色背景）
.current-card {
  border-left-color: var(--el-color-success);
}

.comment-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.comment-card-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.username {
  // font-weight: bold;
  color: var(--el-color-primary);
  font-size: 14px;
}

.time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.comment-card-content {
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.5;
  word-break: break-all;
  padding-left: 42px;
}

.reply-tag {
  color: var(--el-color-danger);
  margin-right: 6px;
  // font-weight: 500;
}

.children-list {
  padding-left: 20px;
}

.child-card {
  margin-left: 20px;
}

.direct-reply {
  border-left-color: var(--el-color-success);
}

.empty-tip {
  text-align: center;
  padding: 32px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.load-more-tip {
  text-align: center;
  padding: 8px 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: var(--el-text-color-secondary);
}

// 回复关联容器样式
.reply-group {
    background-color: var(--el-fill-color-lighter);
    border-radius: 8px;
    padding: 12px;
}

// 关联容器内的当前回复（左上边距）
.reply-group .current-reply {
    margin-left: 24px;
    margin-top: 12px;
}
</style>