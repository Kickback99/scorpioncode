<template>
  <div class="common-layout">
    <el-container>
      <el-aside :style="{backgroundColor: 'var(--sidebar-bg)'}" :class="{ 'menu-theme-off': !settingStore.menuThemeColor, 'mobile-sidebar': isMobile, 'is-collapsed': userConfigStore.collapse_enabled }">
          <Logo></Logo>
          <el-scrollbar class=scrollbar>
        <el-menu router
          ref="menuRef"
          active-text-color="var(--el-color-primary)"
          :default-active="handelUrl"
          text-color="var(--sidebar-text)"
          mode="vertical"
          :collapse="userConfigStore.collapse_enabled"
          :collapse-transition="false"
          @open="handleExclusiveMenuOpen"
          @close="handleMenuClose"
        >
          <el-menu-item index="/index">
                   <el-icon> <SingleIcon :icon="'ri:airplay-fill'"></SingleIcon> </el-icon> <span>仪表盘</span>
          </el-menu-item>

              <el-sub-menu index="/template">
                <template #title>
                  <el-icon> <singleIcon icon="ri:zzz-fill"></singleIcon> </el-icon>
                  <span>模板页面</span>
                </template>
                
                <el-menu-item 
                  v-for="item in tempMenuConfig" 
                  :key="item.path"
                  :index="item.path"
                >
                  <el-icon> <singleIcon icon="ri:zzz-fill"></singleIcon> </el-icon>
                  <span>{{ item.title }}</span>
                </el-menu-item>
            </el-sub-menu>
      
          <menu-tree :listData="listData"></menu-tree>

          <!--多级菜单-->
          <el-sub-menu index="/user">
                <template #title>
                    <el-icon> <SingleIcon icon="ri:profile-fill"></SingleIcon> </el-icon> <span>个人中心</span>
                </template>
			          <!--展开的每一个菜单项-->
                <el-menu-item index="/user/profile">
                    <el-icon> <SingleIcon icon="ri:file-user-fill"></SingleIcon> </el-icon> <span>基本资料</span>
                </el-menu-item>
                <el-menu-item index="/user/rePassword">
					          <el-icon> <SingleIcon icon="ri:phone-lock-line"></SingleIcon> </el-icon> <span>重置密码</span>
                </el-menu-item>
            </el-sub-menu>

            <el-menu-item index="/test">
                   <el-icon> <SingleIcon icon="ri:bard-line"></SingleIcon> </el-icon> <span>测试</span> 
            </el-menu-item>
        </el-menu>
      </el-scrollbar>
      </el-aside>
      <!-- 移动端展开时遮罩，点击遮罩收起 -->
      <div v-if="isMobile && !userConfigStore.collapse_enabled" class="sidebar-mask" @click="userConfigStore.toggleCollapse" />
      <el-container>
        <el-header :class="{ 'page-theme': settingStore.pageTheme }">
            <ToolBar></ToolBar>
        </el-header>
        <el-main class="main-container" :class="{ 'page-theme': settingStore.pageTheme }">
          <Tabs></Tabs>
          <el-scrollbar v-if="!isConfigRoute" class="main-scrollbar">
            <router-view v-if="isDestroy"/>
          </el-scrollbar>
          <div v-else class="main-scrollbar main-scrollbar--plain">
            <router-view v-if="isDestroy"/>
          </div>
        </el-main>
        <!-- <el-footer>Footer</el-footer> -->
      </el-container>
    </el-container>
    <NoticeBell />
  </div>
</template>

<script setup>
import MenuTree from '@/components/MenuTree.vue';
import ToolBar from '@/components/ToolBar.vue';
import {useUserStore} from '@/store/user'
import { computed, nextTick, onMounted, onUnmounted, ref,watch } from 'vue';
import {useSettingStore} from '@/setting'
//路由对象--获取路由参数
import { useRoute } from 'vue-router'
import Logo from '@/components/logo/index.vue';
import Tabs from '@/views/tabs/list.vue';
import { tempMenuConfig } from '@/config/menuConfig'
import { useUserConfigStore } from '@/store/userConfig';
import singleIcon from '@/components/MyIcon/src/singleIcon';
import NoticeBell from '@/views/msg/notice/NoticeBell.vue';

const userStore = useUserStore()

const listData = computed(()=>
  userStore.userMenu
)

// 配置存储
const userConfigStore = useUserConfigStore()

const route = useRoute()

// ============================================================
// 移动端响应式：≤768px 侧边栏切换为浮层
// ============================================================
const isMobile = ref(false)
const mobileQuery = window.matchMedia('(max-width: 768px)')
function handleMobileChange(e) {
  isMobile.value = e.matches
}
onMounted(() => {
  isMobile.value = mobileQuery.matches
  mobileQuery.addEventListener('change', handleMobileChange)
})
onUnmounted(() => {
  mobileQuery.removeEventListener('change', handleMobileChange)
})

// config 模块自己管理滚动，不需要外层 el-scrollbar
const isConfigRoute = computed(() => route.path.startsWith('/config'))

// 处理刷新业务

const isDestroy = ref(true)

const settingStore =  useSettingStore()
watch(()=>settingStore.refresh,()=>{
  isDestroy.value = false
  nextTick(()=>{
    isDestroy.value = true
  })
})

// 手风琴开启时立即折叠非激活菜单
watch(() => settingStore.menuAccordion, (val) => {
  if (!val) return
  nextTick(() => {
    const ids = []
    const found = collectAncestors(userStore.userMenu, route.path, ids)
    if (!found) {
      const parts = route.path.split('/').filter(Boolean)
      if (parts.length > 1) ids.push('/' + parts[0])
      else if (tempMenuConfig.some(item => item.path === route.path)) ids.push('/template')
    }
    // 关闭所有已展开的 sub-menu，只保留激活链路
    const toClose = openedSubMenus.value.filter(i => !ids.includes(i))
    toClose.forEach(i => menuRef.value?.close(i))
  })
})

// 处理菜单的默认展开
const handelUrl = ref('/')
handelUrl.value = route.path

// 菜单激活项引用
const menuRef = ref(null)

// ============================================================
// 排它式菜单展开（经典手风琴模式）
// ============================================================

/** 追踪所有已展开的子菜单 index */
const openedSubMenus = ref([])

/**
 * 排它式菜单展开（经典手风琴模式）
 * 只展开 indexPath 指定链路上的子菜单，折叠其余所有已展开的子菜单
 *
 * 调用时机（统一入口）：
 * 1. 点击左侧菜单展开子菜单 → el-menu @open 事件
 * 2. 点击标签页切换路由   → default-active 变更触发 auto-expand → @open 事件
 * 3. SmartMenuSearch 搜索  → router.push → default-active 变更 → @open 事件
 *
 * @param {string} index    - 当前展开的子菜单 index
 * @param {string[]} indexPath - 从根到当前菜单的完整 index 路径链
 */
const handleExclusiveMenuOpen = (index, indexPath) => {
  // 始终追踪已展开菜单（手风琴关闭时也需要知道哪些菜单展开了）
  if (!openedSubMenus.value.includes(index)) {
    openedSubMenus.value.push(index)
  }

  if (!settingStore.menuAccordion || !menuRef.value) return

  // 关闭所有不在当前 indexPath 链路中的已展开子菜单
  // 排除自身及子孙：以当前 index 为前缀的菜单也不关闭（如展开 /system 时不关闭 /system/user）
  const toClose = openedSubMenus.value.filter(i => {
    if (indexPath.includes(i)) return false
    if (i.startsWith(index + '/')) return false
    return true
  })
  toClose.forEach(i => menuRef.value.close(i))
}

/**
 * 子菜单关闭时同步追踪列表
 * @param {string} index - 关闭的子菜单 index
 */
const handleMenuClose = (index) => {
  openedSubMenus.value = openedSubMenus.value.filter(i => i !== index)
}

/**
 * 收集目标路由在动态菜单树中的所有祖先 sub-menu index
 * 借鉴 tree.js findByName 的递归收集模式
 * @param {Array} list - 菜单树节点
 * @param {string} targetPath - 目标路由路径
 * @param {string[]} ids - 收集的 sub-menu index（原地修改）
 * @returns {boolean} 是否找到
 */
const collectAncestors = (list, targetPath, ids) => {
  for (const m of list) {
    if (m.hidden) continue
    const t = m.type || ''
    const hasChild = m.children?.length > 0
    // 路由路径对齐 handleChildren 逻辑
    const rp = m._addToParentNode ? `/${t}` : m.level ? `/${t}/${m.parentPath}/${m.path}` : `/${t}/${m.path}`
    if (!hasChild && rp === targetPath) return true
    if (hasChild) {
      // sub-menu index 对齐 MenuTree.vue 格式
      ids.push(`/system/${m.path}`)
      if (collectAncestors(m.children, targetPath, ids)) return true
      ids.pop()
    }
  }
  return false
}

// 路由变化时自动滚动侧边栏 + 排它菜单清理
watch(() => route.path, () => {
  handelUrl.value = route.path
  nextTick(() => {
    // 手风琴模式：收集祖先 + 排它折叠
    if (settingStore.menuAccordion) {
      const ids = []
      const found = collectAncestors(userStore.userMenu, route.path, ids)
      if (!found) {
        const parts = route.path.split('/').filter(Boolean)
        if (parts.length > 1) {
          ids.push('/' + parts[0])
        } else if (tempMenuConfig.some(item => item.path === route.path)) {
          ids.push('/template')
        }
      }
      const toClose = openedSubMenus.value.filter(i => !ids.includes(i))
      toClose.forEach(i => menuRef.value?.close(i))
    }
    const activeEl = menuRef.value?.$el?.querySelector('.is-active')
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
})



</script>

<style lang="scss" scoped>
.el-container{
  height: 100vh;
}

.el-header {
  --el-header-height: 48px;
  height: 48px;
  @include flex(space-between, center, null);
  background: var(--el-fill-color-light)
}

html.dark .el-header:not(.page-theme) {
  background-color: var(--el-color-black);
}

.el-header.page-theme {
  background-color: var(--page-theme-bg);
}

.el-aside {
  display: flex;
  flex-direction: column;
  width: auto;
  height: 100vh;
  overflow: hidden;
  &::-webkit-scrollbar {
    width: 0;
  }
  .el-menu {
    border-right: none;
    &.el-menu--collapse {
      width: $menu-min-width;
    }
    &:not(.el-menu--collapse){
      width: 220px;
    }
  }
}

.el-aside:has(.el-menu.el-menu--collapse){
  width: $menu-min-width;
}

// 折叠状态下，子菜单右侧加小三角标识
:deep(.el-menu--collapse .el-sub-menu__title) {
  position: relative;
}
:deep(.el-menu--collapse .el-sub-menu__title::after) {
  content: '';
  position: absolute;
  right: 6px;
  top: calc(50% - 3px);
  width: 0;
  height: 0;
  border-left: 4px solid var(--el-text-color-placeholder);
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
}

// 侧边栏滚动区：flex:1 自动填充 Logo 下方剩余高度
.scrollbar {
  flex: 1;
}

// el-main 改为 flex column，Tabs 固定顶部，scrollbar 占满剩余空间
.main-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 20px;
  background: var(--el-fill-color-light);
}

html.dark .main-container:not(.page-theme) {
  background-color: var(--el-color-black);
}

/* 页面主题 — 跟标签栏同色系但更深（0.95 > 0.88），形成页底→标签的层次感 */
.main-container.page-theme {
  background-color: var(--page-theme-bg);
}

.main-scrollbar {
  flex: 1;
}

.main-scrollbar--plain {
  overflow: hidden;
}

// ============================================================
// 移动端（≤768px）：侧边栏切换为浮层
// ============================================================
@media (max-width: 768px) {
  // 侧边栏脱离文档流，主容器自动占满全宽，无需避让
  .el-aside.mobile-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 2001;
    width: 220px !important; // 折叠态覆盖 `.el-aside:has(...)` 的 60px，保证整体平移
  }

  // 折叠：整体向左平移隐藏（而非收缩成 60px 小栏）
  .el-aside.mobile-sidebar.is-collapsed {
    transform: translate3d(-100%, 0, 0);
  }
}

// 移动端展开时的半透明遮罩（低于侧边栏 2001，高于内容区）
.sidebar-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.3);
}
</style>

<style lang="scss">
/* ============================================================
   menuThemeColor=false — 侧边栏中性色背景 + 普通文字（激活项主色）
   ============================================================ */
.el-aside.menu-theme-off {
  --sidebar-bg: var(--el-bg-color);
  --sidebar-text: var(--el-text-color-primary);
  --el-menu-bg-color: var(--el-bg-color);
  --el-menu-text-color: var(--el-text-color-primary);
  --el-menu-hover-bg-color: var(--el-fill-color);
}

/* ============================================================
   灵动模式 — menuThemeColor=true + plain，菜单跟随 plain 风格
   ============================================================ */
.dynamic-mode.ui-plain .el-aside:not(.menu-theme-off) {
  --el-menu-text-color: var(--el-color-primary-plain);
  --el-menu-active-color: var(--el-color-primary-plain);
  --el-menu-hover-bg-color: var(--tab-theme-hover-bg);

  .el-menu-item:not(.is-active):hover,
  .el-sub-menu__title:not(.is-active):hover {
    color: var(--el-color-primary-plain) !important;
  }
}

/* Logo 文字色：默认白色（侧边栏深色），浅色模式 + menuThemeColor=false 切换深色 */
.el-aside {
  --logo-text-color: #fff;
}
html:not(.dark) .el-aside.menu-theme-off {
  --logo-text-color: var(--el-text-color-primary);
}
/* LogoNeon / LogoMultiNeon 在浅色中性底下降一级为中灰 */
html:not(.dark) .el-aside.menu-theme-off .logo-neon p,
html:not(.dark) .el-aside.menu-theme-off .logo-multi-neon p {
  --logo-text-color: var(--el-text-color-placeholder);
}

/* 禁用 el-menu 子菜单展开/收起的上下动画（pc + 移动端） */
.el-menu .el-collapse-transition-enter-active,
.el-menu .el-collapse-transition-leave-active {
  transition: none !important;
}
</style>