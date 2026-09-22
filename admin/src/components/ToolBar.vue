<template>
    <div class="left">
        <!-- 折叠 -->
        <el-icon style="margin-right: 10px;" @click="handleToggleCollapse">
            <component :is="userConfigStore.getCollapseEnabled() ?'Expand':'Fold'"></component>
        </el-icon>
        <!-- 面包屑 -->
        <el-breadcrumb v-show="!isMediumDown" separator-icon="ArrowRight">
            <el-breadcrumb-item v-for="(item, index) in route.matched" :key="index" v-show="!item.meta.hidden"
                :to="item.path" class="breadcrumb">
                <el-icon>
                    <OfflineIcon :icon="item.meta.icon || Home" :isCollect="false"></OfflineIcon>
                </el-icon>
                <span>{{ item.meta.title }}</span>
                <!-- <button @click="queryRouter(item)">查看当前路由</button> -->
            </el-breadcrumb-item>
        </el-breadcrumb>
        <br>
    </div>
    <div class="right">
        <div class="buttons">
            <el-button class="toolbar-btn-anim toolbar-icon-btn" v-show="!isMinScreenHidden('Refresh')" size="small" circle icon="Refresh" @click="modifyRefresh" plain></el-button>
            <el-button class="toolbar-btn-anim toolbar-icon-btn" v-show="!isMinScreenHidden('FullScreen')" size="small" circle icon="FullScreen" @click="fullScreen" plain></el-button>
            <!-- 铃铛位置为 top 时内联进按钮组（bottom 时由 Layout 渲染成固定右下角） -->
            <NoticeBell v-if="isNoticeBellTop && !isMinScreenHidden('NoticeBell')" />
            <SmartMenuSearch />
        </div>

        <el-dropdown @command="handleCommand">
            <span class="el-dropdown_box">
                <el-avatar :src="handleAvatar"/>
                <span class="user-name">{{ userStore.userInfo.nickname || userStore.userInfo.username }}</span>
                <el-icon><component is="ArrowDown"></component></el-icon>
            </span>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item command="profile" icon="User">基本资料</el-dropdown-item>
                    <el-dropdown-item command="rePassword" icon="EditPen">重置密码</el-dropdown-item>
                    <el-dropdown-item command="logout" icon="SwitchButton">退出登录</el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
        <!-- 设置 popover -->
        <el-popover placement="bottom" :width="260" trigger="hover">
          <template #reference><el-button class="toolbar-btn-anim toolbar-icon-btn" v-show="!isMinScreenHidden('Setting')" size="small" circle icon="Setting" plain></el-button></template>
          <div class="popover-scroll">
              <el-form size="small">
                <el-form-item label="暗黑模式"><el-switch :model-value="userConfigStore.isDarkEnabled" @change="toggleDark" size="small" inline-prompt active-icon="Moon" inactive-icon="Sunny" /></el-form-item>
                <el-form-item label="菜单折叠"><el-switch :model-value="userConfigStore.getCollapseEnabled()" @change="userConfigStore.toggleCollapse" size="small" inline-prompt active-icon="Expand" inactive-icon="Fold" /></el-form-item>
                <el-form-item>
                  <template #label>
                    搜索面板折叠
                    <el-tooltip content="列表页搜索面板默认折叠，各标签页会记住手动状态" placement="top">
                      <el-icon><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-switch :model-value="stringStore.collapseSearchEnabled" @change="onCollapseSearchChange" size="small" inline-prompt active-icon="Expand" inactive-icon="Fold" />
                </el-form-item>
                <el-form-item>
                  <template #label>
                    保存标签
                    <el-tooltip content="退出或 401 后是否保留已打开的标签页" placement="top">
                      <el-icon><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-switch :model-value="stringStore.keepTabs" @change="onClearTabsChange" size="small" />
                </el-form-item>
                <el-form-item>
                  <template #label>
                    菜单手风琴
                    <el-tooltip content="开启则排它式展开，同一时间只展开一个子菜单" placement="top">
                      <el-icon><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-switch :model-value="stringStore.menuAccordion" @change="onMenuAccordionChange" size="small" />
                </el-form-item>
                <el-form-item>
                  <template #label>
                    菜单主题色
                    <el-tooltip content="关闭则侧边栏菜单使用中性色背景+主色文字" placement="top">
                      <el-icon><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-switch :model-value="stringStore.menuThemeColor" @change="onMenuThemeColorChange" size="small" />
                </el-form-item>
                <el-form-item>
                  <template #label>
                    页面主题
                    <el-tooltip content="主容器跟随标签主题色深底，与标签栏形成层次" placement="top">
                      <el-icon><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-switch :model-value="stringStore.pageTheme" @change="onPageThemeChange" size="small" />
                </el-form-item>
                <el-form-item>
                  <template #label>
                    灵动模式
                    <el-tooltip content="标签+菜单+页面主题+深色+plain，统一跟随" placement="top">
                      <el-icon><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-switch :model-value="stringStore.dynamicMode" @change="onDynamicModeChange" size="small" />
                </el-form-item>
                <el-form-item label="标签模式">
                  <el-radio-group :model-value="stringStore.tagMode" @change="onTagModeChange" size="small">
                    <el-radio-button type="primary" value="neutral">中性</el-radio-button>
                    <el-radio-button type="primary" value="ui">ui</el-radio-button>
                    <el-radio-button type="primary" value="theme">主题</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="ui模式"><UiStyleSettings /></el-form-item>
                <el-form-item label="文字色模式"><el-radio-group :model-value="uiStore.textColorMode" @change="onTextColorModeChange" size="small"><el-radio-button type="primary" value="preset">配置文件</el-radio-button><el-radio-button type="primary" value="dynamic">动态计算</el-radio-button></el-radio-group></el-form-item>
                <el-form-item><div class="slider-group"><UiSlider :label="depthLabel" :model-value="depthValue" :min="0" :max="100" :step="5" :format-tooltip="depthTooltip" @update:model-value="onDepthChange" /><UiSlider label="hover强度" :model-value="hoverValue" :min="1" :max="9" :step="1" :format-tooltip="(v)=>'light-'+v" @update:model-value="onHoverChange" /></div></el-form-item>
                <el-form-item v-if="isMediumDown || configStore.getThemeLayoutMode() === 'popover'" label="主题色"><ThemeDots :columns="5" /></el-form-item>
              </el-form>
          </div>
        </el-popover>
    </div>

    <!-- 主题布局切换器（中屏幕以下隐藏，主题统一走 popover） -->
    <ThemeSwitcher v-if="!isMediumDown" />
</template>

<script setup>
import Home from "@iconify-icons/ep/home-filled";
import avatar from '@/assets/images/avatar-circle.png'
import { useUserStore } from '@/store/user'
import { useSettingStore } from '@/setting'
import { useRoute, useRouter } from 'vue-router';
import { useTokenStore } from '@/store/token'
import { useUserConfigStore } from '@/store/userConfig'
import { useUiStore } from '@/store/ui'
import { applyTheme } from '@/assets/common/theme'
import { adminLogoutApi } from '@/api/admin'
import { clearRoute } from '@/utils/remove';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import SmartMenuSearch from '@/views/components/SmartMenuSearch.vue'
import NoticeBell from '@/views/msg/notice/NoticeBell.vue'
import UiStyleSettings from '@/components/UiStyleSettings.vue'
import UiSlider from '@/components/UiSlider.vue'
import ThemeSwitcher from '@/components/theme/index.vue'
import ThemeDots from '@/components/theme/ThemeDots.vue'
import { useConfigStore } from '@/store/config'
import {useWebSocket} from '@/server/useWebSocket'

// 初始化 WebSocket
const { initWebSocketListener, closeWebSocket } = useWebSocket()

// 导入全局事件总线对象
import { useTabStore } from "@/store/tabs";
import msg from '@/components/msg'

const userStore = useUserStore()
const userConfigStore = useUserConfigStore()
const uiStore = useUiStore()
const configStore = useConfigStore()

// 铃铛位置（配置项 notice.bell_position）：top 内联进按钮组，bottom 留在右下角
const isNoticeBellTop = computed(() => configStore.getNoticeBellPosition() === 'top')

// ============================================================
// 响应式中屏幕检测
// ============================================================
const isMediumDown = ref(false)
const mediaQuery = window.matchMedia('(max-width: 1250px)')

function handleMediaChange(e) {
  isMediumDown.value = e.matches
}

// 最小屏幕（≤480px）顶栏放不下，按此优先级让出一个元素给搜索框，避免压缩搜索框宽度
// 480 以上的断点不做任何让位，保持顶栏原始布局
const MIN_SCREEN_HIDE_PRIORITY = ['Refresh', 'FullScreen', 'NoticeBell', 'Setting']

const isMinScreen = ref(false)
const minScreenQuery = window.matchMedia('(max-width: 480px)')

function handleMinScreenChange(e) {
  isMinScreen.value = e.matches
}

// 铃铛配到 bottom 时本就不在顶栏（由 Layout 渲染在右下角），空间已省下，无需再让
const minScreenHiddenKey = computed(() =>
  isMinScreen.value && isNoticeBellTop.value ? MIN_SCREEN_HIDE_PRIORITY[0] : null,
)

const isMinScreenHidden = (key) => minScreenHiddenKey.value === key

// 中屏幕以下自动折叠菜单
const savedCollapse = ref(null)
watch(isMediumDown, (val) => {
  if (val) {
    savedCollapse.value = userConfigStore.getCollapseEnabled()
    if (!userConfigStore.getCollapseEnabled()) {
      userConfigStore.toggleCollapse()
    }
  } else if (savedCollapse.value !== null) {
    if (userConfigStore.getCollapseEnabled() !== savedCollapse.value) {
      userConfigStore.toggleCollapse()
    }
    savedCollapse.value = null
  }
}, { immediate: true })

onMounted(() => {
  isMediumDown.value = mediaQuery.matches
  mediaQuery.addEventListener('change', handleMediaChange)
  isMinScreen.value = minScreenQuery.matches
  minScreenQuery.addEventListener('change', handleMinScreenChange)
})

onUnmounted(() => {
  mediaQuery.removeEventListener('change', handleMediaChange)
  minScreenQuery.removeEventListener('change', handleMinScreenChange)
})

// ============================================================
// UI 滑块
// ============================================================
const depthLabel = computed(() => uiStore.uiMode === 'full' ? '色阶深度' : '描边深度')

const depthValue = computed(() =>
  uiStore.uiMode === 'full' ? uiStore.uiDepthFull : uiStore.uiDepthPlain
)

const hoverValue = computed(() =>
  uiStore.uiMode === 'full' ? uiStore.hoverFull : uiStore.hoverPlain
)

function depthTooltip(val) {
  return uiStore.uiMode === 'full' ? `±${val}%` : `${val}%`
}

function onDepthChange(depth) {
  if (uiStore.uiMode === 'full') {
    uiStore.setUiDepthFull(depth)
  } else {
    uiStore.setUiDepthPlain(depth)
  }
  applyTheme(userConfigStore.currentTheme, userConfigStore.isDarkEnabled)
}

function onHoverChange(hover) {
  if (uiStore.uiMode === 'full') {
    uiStore.setHoverFull(hover)
  } else {
    uiStore.setHoverPlain(hover)
  }
  applyTheme(userConfigStore.currentTheme, userConfigStore.isDarkEnabled)
}

const handleAvatar = computed(()=>{
    return userStore.userInfo.avatar || avatar
})




const tokenStore = useTokenStore()
const tabStore = useTabStore()

const route = useRoute()
const router = useRouter()

const displayName = computed(() => {
    /* if (userStore.roleNames && userStore.roleNames.length > 0) return userStore.roleNames[0]
    else if (userStore.userInfo.nickname) return userStore.userInfo.nickname
    else return userStore.userInfo.username */
    if(userStore.userInfo.nickname) return userStore.userInfo.nickname
    else return userStore.userInfo.username
})

/* const queryRouter = (item) =>{
    console.log(item.path)
} */

// 处理菜单折叠
const stringStore = useSettingStore()

const handleToggleCollapse = async () => {
    // 调用 userConfigStore 的 toggleCollapse 方法
    // 该方法会：
    // 1. 切换本地 isCollapse 状态（0: 折叠, 1: 展开）
    // 2. 调用后端 API 更新配置
    // 3. 显示成功/失败提示
    await userConfigStore.toggleCollapse()
    
    // 可选：如果需要触发其他组件响应折叠状态变化，可以发送事件
    // emitter.emit('collapse-change', userConfigStore.getUserCollapseEnabled())
}

const modifyRefresh = () => {
    stringStore.refresh = !stringStore.refresh
}

// 处理全屏
const fullScreen = () => {
    let full = document.fullscreenElement
    // 切换全屏模式，是全屏则为true，不是则为false
    if (!full) {
        document.documentElement.requestFullscreen()
    } else document.exitFullscreen()
}

// 处理下拉事件
const handleCommand = async (key) => {
    console.log('下拉事件执行了')
    if (key === 'logout') {
        await ElMessageBox.confirm('你确认要退出登录吗', '温馨提示', {
            type: 'warning',
            confirmButtonText: '确认',
            cancelButtonText: '取消'
        })
        // 发送注销请求
        const res = await adminLogoutApi()
        closeWebSocket()
        // 清空token
        tokenStore.removeToken()
        console.log('清空前', router.getRoutes())
        // 清空用户信息
        // clearUserInfo()
        // 清空动态路由数据
        clearRoute(userStore.userMenu)
        console.log('清空后', router.getRoutes())
        // 清空用户信息和菜单
        userStore.clearUserStore()
        // 根据配置决定是否清空标签页
        if (!stringStore.keepTabs) {
          tabStore.clearTabs()
        }
        // 暂存主题到 uiStore（登录页读取用），再清除用户配置
        uiStore.setLastTheme(userConfigStore.theme)
        userConfigStore.clearUserConfig()
        document.documentElement.classList.remove('dark')
        applyTheme('default', false)
        // 清空菜单
        // userStore.removeUserAuth()
        // 清空用户名
        // userStore.username = ''
        // 提示信息
        msg.primary(res.message)
        // 标记主动退出 → 登录后进仪表盘
        stringStore.setLogoutIntent(true)
        router.push('/login')
    }else {
        router.push(`/user/${key}`)
    }
}

// 暗黑模式切换
const toggleDark = async () => {
    await userConfigStore.toggleDark()
    const html = document.documentElement
    html.classList.toggle('dark', userConfigStore.isDarkEnabled)
    // 切到浅色模式时关闭页面主题 + 灵动模式
    if (!userConfigStore.isDarkEnabled) {
        stringStore.pageTheme = false
        stringStore.dynamicMode = false
    }
}

// 退出清标签切换
const onClearTabsChange = (val) => {
    stringStore.keepTabs = val
}

// 搜索面板折叠切换
const onCollapseSearchChange = (val) => {
    stringStore.collapseSearchEnabled = val
}

// 标签模式切换
const onTagModeChange = (val) => {
    stringStore.tagMode = val
}

// 菜单手风琴切换
const onMenuAccordionChange = (val) => {
    stringStore.menuAccordion = val
}

// 菜单主题色切换
const onMenuThemeColorChange = (val) => {
    stringStore.menuThemeColor = val
}

// 页面主题切换（开启时自动切深色模式）
const onPageThemeChange = async (val) => {
    stringStore.pageTheme = val
    if (val && !userConfigStore.isDarkEnabled) {
        await userConfigStore.toggleDark()
        document.documentElement.classList.add('dark')
        applyTheme(userConfigStore.currentTheme, true)
    }
}

// 灵动模式切换（标签主题+菜单主题+深色plain，统一跟随）
const onDynamicModeChange = (val) => {
    stringStore.dynamicMode = val
    if (val) {
        stringStore.tagMode = 'theme'
        stringStore.menuThemeColor = true
        stringStore.pageTheme = true
        uiStore.setUiMode('plain')
        // 开启深色模式
        const html = document.documentElement
        html.classList.add('dark')
        userConfigStore.dark_enabled = true
        applyTheme(userConfigStore.currentTheme, true)
    }
}

// 实心文字色模式切换
const onTextColorModeChange = (mode) => {
    uiStore.setTextColorMode(mode)
    applyTheme(userConfigStore.currentTheme, userConfigStore.isDarkEnabled)
}

</script>

<style scoped lang="scss">
.el-dropdown_box {
    display: flex;
    align-items: center;
    outline: none;

    .el-avatar {
        margin-right: 5px;
    }

    .el-icon {
        margin-left: 5px;
    }
}

.left {
    @include flex(null, center, null);
    .breadcrumb {

        .el-icon,
        span {
            font-size: 15px;
            vertical-align: middle;
        }

        .el-icon {
            margin-right: 2px
        }
    }
}

.right {
    @include flex(null, center, null);

    // 解开 flex item 默认的 min-width:auto，空间不足时允许收缩，避免把顶栏顶出横向滚动
    min-width: 0;

    // 顶栏按钮「视觉间距」——每个设备档位一个单旋钮，两者互不影响：
    //   --btn-visual-gap     PC / 平板（>480px，当前 18px）
    //   --btn-visual-gap-xs  ≤480px 移动端（当前 14px，由下方媒体查询切过去）
    // 依据：图标按钮去掉圆圈底后，24px 盒内只剩 15px 图标、两侧各 4.5px 空白
    //（下方各处减数 -12 / -6 仍是图标 12px 时代的解，未随图标放大同步）
    --btn-visual-gap: 18px;
    --btn-visual-gap-xs: 14px;

    .buttons {
        display: flex;
        align-items: center;
        // 同上：按钮组可收缩，收缩压力才会传导到可收缩的搜索框上
        min-width: 0;
        // 按钮组与头像之间不跟旋钮走：PC 原设计就比按钮之间更宽（20px），移动端的值见下方媒体查询
        margin-right: 20px;

        // 图标之间：左右各带 4.5px 空白（声明的 -12 未同步，视觉间距比旋钮紧 3px）
        gap: calc(var(--btn-visual-gap) - 12px);

        > .el-button + .el-button {
            margin-left: 0;
        }

        // 铃铛根元素是 el-popover 而非 .notice-bell-wrapper，拿不到本组件的 scoped 标记，
        // 其 margin-left:12px 声明在子组件样式里，故用 :deep + 足量特异性覆盖
        > :deep(.notice-bell-wrapper.is-inline) {
            margin-left: 0;
        }

        // 搜索框左侧：铃铛图标右侧 4.5px 空白 + gap + 这里 6px（这里恒为 6px，与旋钮无关；
        // 按新几何应同步收到 4.5px，故当前比旋钮松 1.5px）
        > .smart-menu-search {
            margin-left: 6px;
        }
    }

    // 设置按钮（原为内联 style，移入此处以便最小屏幕下用媒体查询收紧间距）
    // 左侧是箭头图标（无空白），只贴到设置图标自身左侧 4.5px 空白，
    // 故边距按新几何应为 视觉间距 - 4.5，当前 -6 未同步，比旋钮松 1.5px
    > .el-button {
        margin-left: calc(var(--btn-visual-gap) - 6px);
    }
}

// 顶栏空间充足，搜索框一律拒绝收缩；收缩兜底只在最小屏幕（≤480px）开放，见下方媒体查询
:deep(.smart-menu-search) {
    flex-shrink: 0;
}

// 隐藏颜色选择器清空按钮的2种方式

// 组件内颜色选择器包含 popper-class="colorPic" 生效
/* :deep(.colorPic .el-color-dropdown__link-btn){
    display: none
   } */

// 组件内生效
:deep(.el-color-dropdown__link-btn) {
    display: none
}

// 弹窗内表单 label 与控件垂直居中对齐
:deep(.el-form-item) {
  align-items: center;
}

// 设置 popover 内容过长时启用滚动
.popover-scroll {
  max-height: 70vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--el-color-primary-light-5) 35%, transparent);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--el-color-primary) 50%, transparent);
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

// 滑块容器撑满 el-form-item__content 宽度，避免右侧留白
.slider-group {
  width: 100%;
}

// 中屏幕以下压缩搜索框基准宽度，防止断行
@media (max-width: 1250px) {
  :deep(.smart-menu-search) {
    width: 130px;
  }
}

// 移动端（≤768px）隐藏用户名 + 压缩搜索框宽度（间距与布局保持原始，不在本断点收紧）
@media (max-width: 768px) {
  .user-name {
    display: none;
  }

  .el-dropdown_box .el-avatar {
    --el-avatar-size: 32px;
    margin-right: 3px;
  }

  :deep(.smart-menu-search) {
    width: 110px;
  }
}

// 最小屏幕（≤480px）：顶栏到这里才真的放不下，此时才开始「腾空间」并开放搜索框「兜底收缩」
@media (max-width: 480px) {
  // 切到移动端旋钮 --btn-visual-gap-xs（默认 12px）：按钮间距与按钮组右边距都由它一个值控制，
  // 改这一个值即可单独调移动端的整排节奏，不影响 PC
  // 选择器带 .right 前缀是为了压过基础样式里的 `.right .buttons` 声明
  .right {
    --btn-visual-gap: var(--btn-visual-gap-xs);

    .buttons {
      margin-right: var(--btn-visual-gap-xs);
    }
  }

  // 兜底：只有最小屏幕才重新开放搜索框收缩（下限 64px 由组件自身声明）
  :deep(.smart-menu-search) {
    flex-shrink: 1;
  }
}

</style>