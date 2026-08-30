<template>
  <div v-if="showTags" class="tags-view" :class="tagModeClass">
    <!-- 左滚动按钮 -->
    <span v-show="isShowArrow" class="arrow-left" @click="handleScroll(200)">
      <el-icon><ArrowLeft /></el-icon>
    </span>
    
    <!-- 标签容器 -->
    <div 
      ref="scrollbarDom" 
      class="scroll-container"
      @wheel.prevent="handleWheel"
    >
      <div 
        ref="tabDom" 
        class="tab select-none" 
        :style="{ transform: `translateX(${translateX}px)` }"
      >
        <div
          v-for="(item, index) in tabs"
          :key="item.path"
          :class="[
            'scroll-item is-closable',
            linkIsActive(item) && 'is-active'
          ]"
          @contextmenu.prevent="openMenu(item, $event)"
          @click="tagOnClick(item)"
        >
          <span class="tag-title">
            {{ item.title }}
          </span>
          <!-- 仪表盘(index === 0)不显示关闭按钮 -->
          <span
            v-if="item.path !== '/index'"
            class="el-icon-close"
            @click.stop="removeTab(item.path)"
          >
            <el-icon><Close /></el-icon>
          </span>
        </div>
      </div>
    </div>
    
    <!-- 右滚动按钮 -->
    <span v-show="isShowArrow" class="arrow-right" @click="handleScroll(-200)">
      <el-icon><ArrowRight /></el-icon>
    </span>
    
    <!-- 下拉菜单 -->
    <el-dropdown trigger="click" @command="handleCommand" :popper-class="tagModePopperClass">
      <span class="arrow-down">
        <el-icon><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="refresh">
            <el-icon><Refresh /></el-icon>
            重新加载
          </el-dropdown-item>
          <el-dropdown-item command="closeCurrent" divided>
            <el-icon><Close /></el-icon>
            关闭当前标签页
          </el-dropdown-item>
          <el-dropdown-item command="closeRight">
            <el-icon><Right /></el-icon>
            关闭右侧标签页
          </el-dropdown-item>
          <el-dropdown-item command="closeOther">
            <el-icon><CircleClose /></el-icon>
            关闭其他标签页
          </el-dropdown-item>
          <el-dropdown-item command="closeAll">
            <el-icon><Remove /></el-icon>
            关闭全部标签
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    
    <!-- 右键菜单 -->
    <ul
      v-show="contextmenuVisible"
      ref="contextmenuRef"
      class="contextmenu"
      :style="{
        left: contextmenuLeft + 'px',
        top: contextmenuTop + 'px'
      }"
    >
      <li @click="handleContextMenu('refresh')">
        <el-icon><Refresh /></el-icon>
        重新加载
      </li>
      <li @click="handleContextMenu('closeCurrent')">
        <el-icon><Close /></el-icon>
        关闭当前标签页
      </li>
      <li @click="handleContextMenu('closeRight')">
        <el-icon><Right /></el-icon>
        关闭右侧标签页
      </li>
      <li @click="handleContextMenu('closeOther')">
        <el-icon><CircleClose /></el-icon>
        关闭其他标签页
      </li>
      <li @click="handleContextMenu('closeAll')">
        <el-icon><Remove /></el-icon>
        关闭全部标签
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useTabStore } from '@/store/tabs';
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { onClickOutside } from '@vueuse/core';
// 导入全局事件总线对象
import { eventBus } from '@/utils/event-bus'; 
import { useUserConfigStore } from '@/store/userConfig'
import { useSettingStore } from '@/setting'
const userConfigStore = useUserConfigStore()
const settingStore = useSettingStore()

// 标签模式 class 绑定
const tagModeClass = computed(() => {
  if (settingStore.tagMode === 'neutral') return 'tag-mode-neutral'
  if (settingStore.tagMode === 'theme') return 'tag-mode-theme'
  return ''
})
const tagModePopperClass = computed(() => {
  if (settingStore.tagMode === 'neutral') return 'tag-mode-neutral-dropdown'
  if (settingStore.tagMode === 'theme') return 'tag-mode-theme-dropdown'
  return ''
})

// 导入图标
/* import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Close,
  Refresh,
  Right,
  CircleClose,
  Remove
} from '@element-plus/icons-vue'; */

const route = useRoute()
const router = useRouter()
const tabStore = useTabStore()

const activeTab = ref('')
const showTags = ref(true)
const translateX = ref(0)
const isShowArrow = ref(false)
const contextmenuVisible = ref(false)
const contextmenuLeft = ref(0)
const contextmenuTop = ref(0)
const currentContextMenuTab = ref(null)

const scrollbarDom = ref(null)
const tabDom = ref(null)
const contextmenuRef = ref(null)

const tabs = computed(() => {
  return tabStore.getTabs
})

// 检查标签是否激活
const linkIsActive = (tab) => {
  return route.path === tab.path
}

// 添加标签页
const addTab = () => {
  const { path, fullPath, meta: { title } } = route

    // 确保仪表盘始终存在
  ensureHomeTabExists()

  const itemTab = {
    path,
    fullPath,
    title
  }
  // 如果是仪表盘路径，确保标题正确
  if (path === '/index') {
    itemTab.title = '仪表盘'
  }

  tabStore.addTabs(itemTab)
  nextTick(() => {
    adjustScrollPosition()
  })
}

// 确保仪表盘标签存在
const ensureHomeTabExists = () => {
  const homeTab = tabs.value.find(tab => tab.path === '/index')
  if (!homeTab) {
    // 如果仪表盘不存在，添加仪表盘
    tabStore.addTabs({
      path: '/index',
      fullPath: '/index',
      title: '仪表盘'
    })
  }
}



// 设置激活的选项卡
const setActiveTab = () => {
  activeTab.value = route.path
}

// 监听路由
watch(() => route.path, () => {
  setActiveTab()
  addTab()
})

// 点击标签页（fullPath 保留 query 参数，兼容旧数据无 fullPath 的情况）
const tagOnClick = (item) => {
  router.push(item.fullPath || item.path)
}

// 删除单个标签页
const removeTab = (targetName) => {
  const currentTabs = tabs.value
  let activeName = activeTab.value

  if (activeName === targetName) {
    currentTabs.forEach((tab, index) => {
      if (tab.path === targetName) {
        const nextTab = currentTabs[index + 1] || currentTabs[index - 1]
        if (nextTab) {
          activeName = nextTab.path
          router.push(nextTab.fullPath || nextTab.path)
        }
      }
    })
  }

  activeTab.value = activeName
  tabStore.tabList = currentTabs.filter((tab) => tab.path !== targetName)

  nextTick(() => {
    adjustScrollPosition()
  })
}

// 调整滚动位置 - 修复版本
const adjustScrollPosition = () => {
  if (!scrollbarDom.value || !tabDom.value) return
  
  const scrollbarWidth = scrollbarDom.value.offsetWidth
  const tabWidth = tabDom.value.scrollWidth
  
  isShowArrow.value = tabWidth > scrollbarWidth
  
  // 确保当前激活的标签在可视区域内且完全显示
  const activeIndex = tabs.value.findIndex(tab => tab.path === route.path)
  if (activeIndex !== -1) {
    moveActiveTabToView(activeIndex)
  }
}

// 移动激活标签到可视区域 - 修复版本
const moveActiveTabToView = (index) => {
  if (!scrollbarDom.value || !tabDom.value) return
  
  const tabItemEl = tabDom.value.children[index]
  if (!tabItemEl) return
  
  const tabItemLeft = tabItemEl.offsetLeft
  const tabItemWidth = tabItemEl.offsetWidth
  const scrollbarWidth = scrollbarDom.value.offsetWidth
  const totalTabWidth = tabDom.value.scrollWidth
  
  // 如果总宽度不超过容器宽度，不需要滚动
  if (totalTabWidth <= scrollbarWidth) {
    translateX.value = 0
    return
  }
  
  // 计算标签的左右边界
  const tabRight = tabItemLeft + tabItemWidth
  const visibleLeft = -translateX.value
  const visibleRight = visibleLeft + scrollbarWidth
  
  // 检查标签是否完全在可视区域内
  const isFullyVisible = tabItemLeft >= visibleLeft && tabRight <= visibleRight
  
  if (!isFullyVisible) {
    // 如果标签不在可视区域内或部分显示，调整位置
    if (tabItemLeft < visibleLeft) {
      // 标签在可视区域左侧，向左滚动让标签显示在左边
      translateX.value = -tabItemLeft
    } else if (tabRight > visibleRight) {
      // 标签在可视区域右侧，向右滚动让标签显示在右边
      translateX.value = -(tabRight - scrollbarWidth)
    }
  }
  
  // 确保不会滚动过度
  const maxTranslate = scrollbarWidth - totalTabWidth
  if (translateX.value > 0) {
    translateX.value = 0
  } else if (translateX.value < maxTranslate) {
    translateX.value = maxTranslate
  }
}

// 处理滚动
const handleScroll = (offset) => {
  const scrollbarWidth = scrollbarDom.value.offsetWidth
  const tabWidth = tabDom.value.scrollWidth
  
  if (tabWidth <= scrollbarWidth) {
    translateX.value = 0
    return
  }
  
  const newTranslate = translateX.value + offset
  const maxTranslate = scrollbarWidth - tabWidth
  
  // 限制滚动范围
  if (newTranslate > 0) {
    translateX.value = 0
  } else if (newTranslate < maxTranslate) {
    translateX.value = maxTranslate
  } else {
    translateX.value = newTranslate
  }
}

// 鼠标滚轮滚动
const handleWheel = (event) => {
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
  const scrollAmount = 80
  
  if (delta > 0) {
    // 向右滚动
    handleScroll(scrollAmount)
  } else {
    // 向左滚动
    handleScroll(-scrollAmount)
  }
}

// 右键菜单 - 直接使用鼠标位置
const openMenu = (tab, event) => {
  event.preventDefault()
  currentContextMenuTab.value = tab
  
  // 直接使用鼠标在容器内的相对位置
  const tagsViewContainer = event.currentTarget.closest('.tags-view')
  if (!tagsViewContainer) return
  
  const containerRect = tagsViewContainer.getBoundingClientRect()
  
  // 计算相对于容器的位置
  const relativeLeft = event.clientX - containerRect.left
  const relativeTop = event.clientY - containerRect.top
  
  // 设置菜单位置
  contextmenuLeft.value = relativeLeft
  contextmenuTop.value = relativeTop
  
  contextmenuVisible.value = true
}


// 处理右键菜单点击
const handleContextMenu = (command) => {
  if (!currentContextMenuTab.value) return
  
  switch (command) {
    case 'refresh':
      /* router.replace({
        path: '/redirect' + route.fullPath
      }) */
      window.location.reload()
      break
    case 'closeCurrent':
      removeTab(currentContextMenuTab.value.path)
      break
    case 'closeRight':
      closeRightTabs(currentContextMenuTab.value)
      break
    case 'closeOther':
      closeOtherTabs(currentContextMenuTab.value)
      break
    case 'closeAll':
      closeAllTabs()
      break
  }
  
  contextmenuVisible.value = false
}

// 处理下拉菜单
const handleCommand = (command) => {
  switch (command) {
    case 'refresh':
      /* router.replace({
        path: '/redirect' + route.fullPath
      }) */
      window.location.reload()
      break
    case 'closeCurrent':
      removeTab(route.path)
      break
    case 'closeRight':
      closeRightTabs({ path: route.path })
      break
    case 'closeOther':
      closeOtherTabs({ path: route.path })
      break
    case 'closeAll':
      closeAllTabs()
      break
  }
}

// 关闭右侧标签页
const closeRightTabs = (currentTab) => {
  const currentIndex = tabs.value.findIndex(tab => tab.path === currentTab.path)
  if (currentIndex !== -1) {
    const tabsToKeep = tabs.value.slice(0, currentIndex + 1)
    tabStore.tabList = tabsToKeep

    // 如果当前激活的标签在关闭的右侧，跳转到当前标签
    if (tabs.value.findIndex(tab => tab.path === route.path) > currentIndex) {
      router.push(currentTab.fullPath || currentTab.path)
    }

    nextTick(adjustScrollPosition)
  }
}

// 关闭其他标签页 - 修复版本
const closeOtherTabs = (currentTab) => {
  // 获取仪表盘标签（路径为 '/index'）
  const homeTab = tabs.value.find(tab => tab.path === '/index')

  // 确保保留仪表盘和当前标签页
  const tabsToKeep = []

  // 添加仪表盘（如果存在）
  if (homeTab) {
    tabsToKeep.push(homeTab)
  }

  // 添加当前标签页（如果不是仪表盘）
  if (currentTab.path !== '/index') {
    tabsToKeep.push(currentTab)
  }

  // 如果仪表盘不存在，创建仪表盘标签
  if (!homeTab && currentTab.path !== '/index') {
    tabsToKeep.unshift({
      path: '/index',
      fullPath: '/index',
      title: '仪表盘'
    })
  }

  // 更新标签页列表
  tabStore.tabList = tabsToKeep

  // 路由跳转
  if (route.path !== currentTab.path && currentTab.path !== '/index') {
    router.push(currentTab.fullPath || currentTab.path)
  } else if (route.path !== '/index' && currentTab.path === '/index') {
    router.push('/index')
  }

  nextTick(adjustScrollPosition)
}

// 关闭全部标签页 - 修复版本
const closeAllTabs = () => {
  // 保留仪表盘（路径为 '/index'）
  const homeTab = tabs.value.find(tab => tab.path === '/index')

  // 如果仪表盘存在，只保留仪表盘；如果不存在，创建仪表盘
  if (homeTab) {
    tabStore.tabList = [homeTab]
  } else {
    tabStore.tabList = [{
      path: '/index',
      fullPath: '/index',
      title: '仪表盘'
    }]
  }

  if (route.path !== '/index') {
    router.push('/index')
  }

  nextTick(adjustScrollPosition)
}

// 点击外部关闭右键菜单
onClickOutside(contextmenuRef, () => {
  contextmenuVisible.value = false
})

onMounted(() => {
  setActiveTab()
  addTab()
  
  // 延迟执行，确保DOM完全渲染
    setTimeout(() => {
      adjustScrollPosition()
    }, 100);

    eventBus.on('adjustTabScroll', async() => {
      // await nextTick()
      // await nextTick()
      adjustScrollPosition();
    });
  
  // 监听窗口大小变化
  window.addEventListener('resize', adjustScrollPosition)
})

// 添加路由变化后的延迟调整
watch(() => route.path, () => {
  // 路由变化后延迟调整滚动位置
  setTimeout(() => {
    adjustScrollPosition()
  }, 150)
})

nextTick(()=>{
  onUnmounted(()=>{
      eventBus.off('adjustTabScroll')
  })
})

</script>

<style lang="scss">
@import './tag-styles.scss';
</style>