<template>
    <!-- 个人信息卡片 -->
    <!-- <v-card class="mb-4">
        <v-card-title>个人信息</v-card-title>
        <v-card-text>
            <p>用户名: {{ user.username }}</p>
            <p>邮箱: {{ user.email }}</p>
        </v-card-text>
    </v-card> -->

    <!-- <v-card class="mb-4">
        <v-card-title>公告消息</v-card-title>
        <v-card-text>
            {{ noticeContent }}
        </v-card-text>
    </v-card> -->

    <AppBlogBox title="文章搜索">
        <v-text-field
        v-model="keyword"
        full-width
        label="请输入标题/内容" 
        variant="outlined" 
        density="compact" 
        append-inner-icon="mdi-magnify"
        @click:append-inner="onSearch('keyword',keyword)"
        @keyup.enter="onSearch('keyword',keyword)"
        class="px-2"
        >
        </v-text-field>
    </AppBlogBox>

    <AppBlogBox title="公告消息" v-if="configStore.getNoticeEnabled()">
        <v-card-text>
            <!-- 普通消息显示在卡片内 -->
            <div v-if="normalNotice">{{ normalNotice }}</div>
            <div v-else-if="!hasLongTextNotice" style="color: #999;">暂无公告</div>
        </v-card-text>
    </AppBlogBox>

    <AppBlogBox :title="titles.tags">
        <v-chip-group column class="pa-2" mandatory>
        <v-chip label v-for="item in tagStore.list" :key="item.id" @click="onSearch('tag',item.id)"  density="comfortable" size="small" :value="item.id"
        base-color="primary"
        >{{ item.name }}</v-chip>
        </v-chip-group>
    </AppBlogBox>

    <!-- <AppBlogBox title="个人信息">
        <p>用户名: {{ user.username }}</p>
        <p>邮箱: {{ user.email }}</p>
    </AppBlogBox> -->

    <div ref="hotRef" class="hot-section" :class="{ 'is-fixed': isHotFixed }" :style="isHotFixed ? hotFixedStyle : {}">
    <AppBlogBox title="热门文章">
        <v-list color="primary">
            <v-list-item v-for="(item, index) in hotBlogs" :key="item.id"  :value="item.id" density=compact :to="{name:'detail',params:{id:item.id}}">
                <template v-slot:prepend>
                    <span class="v-theme--scorpion-light">
                        <v-icon color="primary">mdi-numeric-{{index+1}}-box</v-icon>
                    </span>
                </template>

                <v-list-item-title class="text-caption">{{ item.title }}</v-list-item-title>
            </v-list-item>
        </v-list>
    </AppBlogBox>
    </div>

    <div ref="recRef">
    <AppBlogBox :title="titles.articles">
        <!-- 骨架屏：加载中 -->
        <v-list v-if="latestLoading && latestBlogs.length === 0">
            <v-list-item v-for="n in 10" :key="n" class="sidebar-skeleton-item">
                <template v-slot:prepend>
                    <v-skeleton-loader type="image" width="90" height="50.625" class="sidebar-skeleton-img" />
                </template>
                <v-list-item-title>
                    <v-skeleton-loader type="subtitle" />
                </v-list-item-title>
                <v-list-item-subtitle>
                    <v-skeleton-loader type="subtitle" class="sidebar-skeleton-date" />
                </v-list-item-subtitle>
            </v-list-item>
        </v-list>

        <!-- 真实内容 -->
        <v-list v-else>
            <v-list-item
            v-for="(item, index) in latestBlogs"
            :key="item.id"
            :value="item.id"
            :to="{name:'detail',params:{id:item.id}}"
            >
                <template v-slot:prepend>
                    <v-img
                    class="customImg lazy-img"
                    :src="item.cover || coverRect"
                    :lazy-src="coverRect"
                    width="90"
                    height="50.625"
                    cover
                    >
                    </v-img>
                </template>
                <v-list-item-title class="text-caption">{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ item.createTime }}</v-list-item-subtitle>
            </v-list-item>
        </v-list>
    </AppBlogBox>
    </div>

    <!-- 富文本公告 Snackbar -->
    <AppNoticeSnackbar
      v-model="noticeSnackbarVisible"
      :title="longTextNotice?.title || '公告消息'"
      :content="longTextNotice?.content || ''"
      @action="handleNoticeAction"
      @dont-show-again="handleNoticeDontShowAgain"
    />

    <!-- 富文本公告 Dialog（Markdown 渲染） -->
    <AppNoticeDialog
      v-model="noticeDialogVisible"
      :title="longTextNotice?.title || '公告消息'"
      :content="longTextNotice?.content || ''"
      :push-time="longTextNotice?.pushTime || ''"
    />
</template>

<script setup>
import { nextTick, onMounted,onUnmounted,ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import AppBlogBox from './AppBlogBox.vue';
import AppNoticeSnackbar from './AppNoticeSnackbar.vue';
import AppNoticeDialog from './AppNoticeDialog.vue';
import { hotListApi, latestListApi, tagListApi } from '@/api/article';
const keyword = ref('')
// 全局总线
import emitter from '@/utils/event-bus.js'
import { useRoute } from 'vue-router';
import { useSearch } from '@/utils/useSearch';
import coverRect from '@/assets/images/cover-rect.png';
const route = useRoute()

const {triggerSearch} = useSearch()

// ============================================================
// 公告相关（新增）
// ============================================================
import { getCurrentNoticeListApi, connectNoticeSSE, disconnectNoticeSSE } from '@/api/notice'
import { StealthStorage } from '@/utils/stealthStorage'
import { useConfigStore } from '@/store/config'
import { useTagStore } from '@/store/tag'

const configStore = useConfigStore()
const tagStore = useTagStore()
const normalNotice = ref('')        // 普通消息内容
const longTextNotice = ref(null)    // 富文本消息对象 { id, title, content, type }
const hasLongTextNotice = ref(false)
const noticeSnackbarVisible = ref(false)
const noticeDialogVisible = ref(false)
// 记录已展示的富文本公告 ID，防止重复弹出
const shownLongTextIds = new Set()

/**
 * 渲染公告列表
 * @param {Array} list 公告列表
 * @param {Object} options 选项
 * @param {boolean} options.skipDontShowCheck 跳过"不再提示"检查（permanent 模式 SSE 推送时为 true）
 */
const renderNotices = (list, options = {}) => {
    const { skipDontShowCheck = false } = options
    let normalContent = ''
    let longTextItem = null

    list.forEach(item => {
        if (item.type === 0) {
            normalContent = item.content
        } else if (item.type === 1) {
            longTextItem = item
        }
    })

    // console.log('📢 短文本', normalContent)
    // console.log('📢 富文本', longTextItem)

    normalNotice.value = normalContent || '暂无公告'
    longTextNotice.value = longTextItem
    hasLongTextNotice.value = !!longTextItem

    // 弹出 Snackbar（有值显示，没值不显示）
    if (longTextItem) {
        if (!skipDontShowCheck) {
            const flag = StealthStorage.get('show_long_text_snackbar')
            if (flag === null) {
                // 首次访问：自动初始化为显示
                StealthStorage.set('show_long_text_snackbar', '1')
            } else if (flag === '0') {
                // console.log('📢 用户已选择"不再提示"，跳过弹窗')
                return
            }
            // flag === '1' → 显示
        }
        noticeSnackbarVisible.value = true
    }

}

/**
 * 获取当前展示的公告列表
 * @param {Object} options 选项，透传给 renderNotices
 */
const fetchCurrentNotices = async (options = {}) => {
    try {
        const res = await getCurrentNoticeListApi()
        const list = res.data || []
        renderNotices(list, options)
    } catch (error) {
        console.error('获取公告列表失败:', error)
        normalNotice.value = '暂无公告'
        longTextNotice.value = null
        hasLongTextNotice.value = false
    }
}

// SSE 连接标记：区分首次连接与自动重连（重连后补偿拉取断连期间错过的公告）
const sseConnectedOnce = ref(false)

/**
 * SSE 连接建立回调：首次连接不动作（onMounted 已拉取列表）；
 * 自动重连成功后先对齐后台 notice.sse_enabled 开关（关闭则断开），再补偿拉取公告列表
 */
const handleSseOpen = async () => {
    if (!sseConnectedOnce.value) {
        sseConnectedOnce.value = true
        return
    }
    // 重新拉取配置，与后台开关对齐
    await configStore.loadConfig()
    if (!configStore.getNoticeSseEnabled()) {
        // 后台已关闭公告 SSE：断开连接，不再补拉（页面重载前不再连接）
        disconnectNoticeSSE()
        return
    }
    fetchCurrentNotices()
}

/**
 * 处理收到的公告消息（SSE 推送）
 * dismissed_level=session（07a968e）：set 标记为 '1'，新公告弹出
 * dismissed_level=permanent（00d29ea）：绕过标记检查强制弹出，标记保留原值
 */
const handleNoticeMessage = (data) => {
    if (configStore.getNoticeDismissedLevel() === 'session') {
        // session 模式：set '1'，公告显示
        StealthStorage.set('show_long_text_snackbar', '1')
        fetchCurrentNotices()
    } else {
        // permanent 模式：绕过标记检查，强制弹出但保留原标记
        fetchCurrentNotices({ skipDontShowCheck: true })
    }
}

/**
 * 点击"不再提示"：写入 StealthStorage 标记
 */
const handleNoticeDontShowAgain = () => {
    StealthStorage.set('show_long_text_snackbar', '0')
    // console.log('📢 用户选择不再提示富文本公告')
}

/**
 * 点击"查看详情"：打开 Dialog（Markdown 渲染）
 */
const handleNoticeAction = () => {
    // console.log('📢 点击查看详情，打开 Dialog')
    noticeSnackbarVisible.value = false
    noticeDialogVisible.value = true
}

const user = ref({
    username: 'JohnDoe',
    email: 'johndoe@example.com',
});

const hotBlogs = ref([])
const latestBlogs = ref([])
const latestLoading = ref(false)

// 搜索功能
const onSearch = (type,param) => {
    // alert(123)
    // emitter.emit('search',{type,param})
    if(type === 'keyword'){
        if(!param.trim()){
            return
        }
    }
    triggerSearch(type,param)
    keyword.value = ''
}

/* const hotBlogs =[
    {id:1,text: '考前50分-四六级必考词汇预测'},
    {id:2,text: '魔导国东征记-世界守护突破(622~624)三更·0VERLORD'},
    {id:3,text: 'FGo国服《妖精圆桌领域阿瓦隆·勒·菲星辰诞生之刻》2.6前篇主线根'},
    {id:4,text: '1999元的miniLEDHDR1000显示器HKCPG271Q简评'},
    {id:5,text: '22年四六级翻译预测--共青团'},
    {id:6,text: '四六级翻译预测--冬奥会'},
    {id:7,text: '兵装榜2全面推荐泛用兵装，斩击实战检验后'},
    {id:8,text: '为了实现游戏里的二段跳，人类到底能多拼命？'},
    {id:9,text: '2022上半年四级真题--提案，给学校图书馆，学校医院，学生会'},
    {id:10,text: '关于2022年高考数学试题的一点点想法'}
] */

// 动态标题状态
const titles = ref({
    articles:'最新发布',
    tags:'文章标签'
})

const renderHotList = async() => {
    const res = await hotListApi()
    hotBlogs.value =  res.data
}

const renderLatestList = async() => {
    latestLoading.value = true
    try {
        const res = await latestListApi()
        titles.value.articles = '最新发布'
        latestBlogs.value = res.data
    } finally {
        latestLoading.value = false
    }
}



const renderTagList = async() =>{
    const res = await tagListApi()
    titles.value.tags = '文章标签'
    tagStore.list = res.data
}


// 处理详情页数据
const handleDetailData = (data) => {
    // 如果有分类文章数据，更新分类文章
    if (data.cateArticles && data.cateArticles.length > 0) {
        titles.value.articles = '相关文章'
        latestBlogs.value = data.cateArticles
    } 
    // 如果有标签数据，更新标签数据
    if (data.tags && data.tags.length > 0) {
        titles.value.tags = '标签'
        tagStore.list = data.tags
    }
}

onMounted(()=>{
    if (configStore.getNoticeSseEnabled()) {
      // 1. 获取当前公告列表
      fetchCurrentNotices()
      // 2. 建立 SSE 连接，接收实时推送
      connectNoticeSSE(handleNoticeMessage, null, handleSseOpen)
    }

    // 次要数据（热门/最新/标签）延后到浏览器空闲时加载，避免与首屏关键请求（分类+文章）抢带宽
    const loadSecondary = () => {
      renderHotList()
      renderLatestList()
      renderTagList()
    }
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadSecondary)
    } else {
      setTimeout(loadSecondary, 0)
    }

    emitter.on('detail-data',handleDetailData)
})

onUnmounted(() => {
  // 断开 SSE 连接
  disconnectNoticeSSE()
  emitter.off('detail-data', handleDetailData)
})

// 监听路由地址变化
watch(() => route.path,(newPath) => {
    if(!newPath.includes('/detail')){
        renderHotList()
        renderLatestList()
        renderTagList()
    }
})

// -- 热门文章滚动跟随（今日头条式） --
const { mobile } = useDisplay()

const hotRef = ref(null)
const recRef = ref(null)
const isHotFixed = ref(false)
const hotFixedStyle = ref({})

let originalRecBottom = 0
let flipTimer = null
let sidebarNaturalTop = 0 // v-col 顶部的文档坐标，用于 fixed 时对齐「文章搜索」间距

const animateFlip = (toFixed) => {
    const el = hotRef.value
    if (!el) return

    // 取消进行中的动画
    clearTimeout(flipTimer)
    el.style.transition = 'none'

    // FIRST — 记录当前位置
    const first = el.getBoundingClientRect()

    // 切换状态
    if (toFixed) {
        // 测量 v-col 内容区顶部文档坐标（含 padding），保证与「文章搜索」位置一致
        if (!sidebarNaturalTop) {
            const vCol = el.closest('.v-col')
            if (vCol) {
                const r = vCol.getBoundingClientRect()
                const s = getComputedStyle(vCol)
                const padTop = parseFloat(s.paddingTop) || 0
                sidebarNaturalTop = r.top + (window.pageYOffset || document.documentElement.scrollTop) + padTop
            }
        }
        hotFixedStyle.value = {
            position: 'fixed',
            top: (sidebarNaturalTop || 64) + 'px',
            left: first.left + 'px',
            width: first.width + 'px',
            zIndex: 10,
        }
        isHotFixed.value = true
    } else {
        isHotFixed.value = false
        hotFixedStyle.value = {}
    }

    // LAST — 记录新位置 & INVERT
    requestAnimationFrame(() => {
        const last = el.getBoundingClientRect()
        const deltaY = first.top - last.top
        const deltaX = first.left - last.left

        if (Math.abs(deltaY) < 1 && Math.abs(deltaX) < 1) {
            el.style.transform = ''
            el.style.transition = ''
            return
        }

        // 反偏移：视觉上留在原位
        el.style.transform = `translate(${deltaX}px, ${deltaY}px)`
        el.offsetHeight // 强制回流

        // PLAY — 动画归零
        el.style.transition = 'transform 0.5s ease-out'
        el.style.transform = 'translate(0, 0)'

        flipTimer = setTimeout(() => {
            el.style.transition = ''
            el.style.transform = ''
        }, 520)
    })
}

const updateFixedStyle = () => {
    const el = hotRef.value
    if (!el) return

    const vCol = el.closest('.v-col')
    if (!vCol) return

    const r = vCol.getBoundingClientRect()
    const s = getComputedStyle(vCol)
    const padTop = parseFloat(s.paddingTop) || 0
    const padLeft = parseFloat(s.paddingLeft) || 0
    const padRight = parseFloat(s.paddingRight) || 0
    sidebarNaturalTop = r.top + (window.pageYOffset || document.documentElement.scrollTop) + padTop

    hotFixedStyle.value = {
        position: 'fixed',
        top: sidebarNaturalTop + 'px',
        left: (r.left + padLeft) + 'px',
        width: (r.width - padLeft - padRight) + 'px',
        zIndex: 10,
    }
}

const handleResize = () => {
    if (!isHotFixed.value) return
    updateFixedStyle()
}

const handleHotScroll = () => {
    if (!hotRef.value || !recRef.value) return
    if (mobile.value) return

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    // 静态时持续更新「文章推荐」底部的文档坐标
    if (!isHotFixed.value) {
        const recRect = recRef.value.getBoundingClientRect()
        originalRecBottom = recRect.bottom + scrollTop
    }

    if (scrollTop > originalRecBottom) {
        if (!isHotFixed.value) animateFlip(true)
    } else {
        if (isHotFixed.value) animateFlip(false)
    }
}

const bindScroll = () => {
    if (!mobile.value) {
        window.addEventListener('scroll', handleHotScroll, { passive: true })
        window.addEventListener('resize', handleResize)
        // 从移动端切回桌面端：等 DOM 更新后再检查，避免 v-col 仍为 display:none 导致测量为 0
        nextTick(() => handleHotScroll())
    } else {
        window.removeEventListener('scroll', handleHotScroll)
        window.removeEventListener('resize', handleResize)
        // 清理 FLIP 动画残留
        clearTimeout(flipTimer)
        if (hotRef.value) {
            hotRef.value.style.transition = ''
            hotRef.value.style.transform = ''
        }
        // 移动端还原状态
        isHotFixed.value = false
        hotFixedStyle.value = {}
        originalRecBottom = 0
        sidebarNaturalTop = 0
    }
}

onMounted(() => {
    bindScroll()
    watch(mobile, bindScroll)
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleHotScroll)
    window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
// == Sidebar skeleton: aggressive bone margin reset ==
.sidebar-skeleton-item {
  :deep(.v-skeleton-loader__image) {
    margin: 0;
    height: 100%; // fill explicit height from props (50px), override default 150px
  }

  :deep(.v-skeleton-loader__text) {
    margin: 1px 0;
  }
}

// Date subtitle narrower than title
.sidebar-skeleton-date :deep(.v-skeleton-loader__text) {
  max-width: 50%;
}

// 最新文章封面图 & 骨架屏统一圆角
.customImg {
  border-radius: var(--article-cover-radius);
}

.sidebar-skeleton-img {
  border-radius: var(--article-cover-radius);
}

.hot-section {
    transition: none; // FLIP 自行管理动画，不靠 CSS transition
}

/* .hot-section.is-fixed {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
} */

/* 使用深度选择器 */
:deep(.v-list-item__spacer) {
  width: 16px !important; /* 调整为更小的值 */
}

:deep(.customImg+.v-list-item__spacer){
    width: 10px !important; /* 调整为更小的值 */
}

:deep(.v-text-field .v-label) {
  font-size: 10px !important;
}

/* 彻底移除 hover、focus 等所有交互效果 */
/* 强制保持默认边框颜色 */
/* :deep(.v-field__outline) {
  color: rgba(0, 0, 0, 0.38) !important; 
} */

/* 禁用 hover 变色 */
:deep(.v-field:hover .v-field__outline) {
  color: rgba(0, 0, 0, 0.38) !important; 
}

/* 聚焦时使用 primary 颜色（含聚焦时悬停，避免反跳） */
:deep(.v-field--focused .v-field__outline),
:deep(.v-field--focused:hover .v-field__outline) {
  color: rgb(var(--v-theme-primary)) !important;
}

:deep(.v-field__input) {
  font-size: 12px !important;
}

/* 富文本内容样式 */
.long-text-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.8;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 4px;
  font-size: 14px;
}

</style>
