<template>
  <!-- 应用标题/Logo -->
  <v-app-bar-title>
    <router-link
      to="/"
      @click="handleLogoClick"
      style="color: inherit; text-decoration: none;"
    >
      蝎子编程
    </router-link>
  </v-app-bar-title>

  <!-- 桌面导航 -->
  <div class="d-flex ml-4">
    <template v-for="item in categories" :key="item.id">
      <!-- 有子菜单：hover 展开下拉，箭头跟随状态旋转 -->
      <v-menu
        v-if="hasChildren(item)"
        open-on-hover
        location="bottom"
      >
        <template v-slot:activator="{ props, isActive }">
          <v-btn
            v-bind="props"
            variant="text"
            :ripple="false"
            @click="handleNavClick('cate', item.id)"
            class="text-none nav-parent-btn"
          >
            {{ item.name }}
            <v-icon size="small" class="ml-1 nav-arrow" :class="{ 'nav-arrow--open': isActive }">
              mdi-chevron-down
            </v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="child in item.children"
            :key="child.id"
            @click="handleNavClick('cate',child.id)"
          >
            <v-list-item-title>{{ child.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- 无子菜单：直接点击跳转 -->
      <v-btn
        v-else
        variant="text"
        @click="handleNavClick('cate',item.id)"
        class="text-none"
      >
        {{ item.name }}
      </v-btn>
    </template>
    <v-btn
      v-if="configStore.getFriendLinkEnabled()"
      color="success"
      variant="text"
      @click="handleNavClick('friendLink')"
      class="text-none"
      >友链</v-btn>
    <v-btn
      v-if="configStore.getAboutEnabled()"
      color="success"
      variant="text"
      @click="handleNavClick('about')"
      class="text-none"
      >关于</v-btn>

    <!-- 右侧用户区域 - 桌面端 -->
    <v-spacer></v-spacer>

    <!-- ========== 桌面端主题切换按钮 ========== -->
    <v-btn
      @click="handleToggleTheme"
      variant="text"
      class="mr-2"
    >
      <v-icon>{{ themeStore.isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
    </v-btn>

    <div v-if="isLoggedIn">
      <!-- 用户信息下拉菜单 -->
      <v-menu
        location="bottom"
        offset-y
        transition="slide-y-transition"
      >
        <template v-slot:activator="{ props }">
          <div
            v-bind="props"
            class="user-info-wrapper cursor-pointer d-flex align-center"
            style="cursor: pointer;"
          >
            <v-avatar size="36" color="white" class="mr-2">
              <v-icon color="primary" v-if="!userAvatar">mdi-account-circle</v-icon>
              <v-img v-else :src="userAvatar" alt="avatar"></v-img>
            </v-avatar>
            <span class="text-white text-body-2">{{ userName }}</span>
            <v-icon color="white" size="20" class="ml-1">mdi-menu-down</v-icon>
          </div>
        </template>

        <v-list density="compact" min-width="100" class="mt-2">
          <v-list-item @click="handleProfile">
            <template v-slot:prepend>
              <v-icon>mdi-account-circle</v-icon>
            </template>
            <v-list-item-title>个人中心</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="handleLogout">
            <template v-slot:prepend>
              <v-icon>mdi-logout</v-icon>
            </template>
            <v-list-item-title>退出登录</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <v-btn
      v-else-if="configStore.getUserLoginEnabled()"
      color="white"
      variant="outlined"
      @click="handleLogin"
      class="text-none"
    >
      <v-icon left>mdi-account</v-icon>
      登录
    </v-btn>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import emitter from '@/utils/event-bus.js'
import { useSearch } from '@/utils/useSearch'
import { useUserStore } from '@/store/user'
import { useThemeStore } from '@/store/theme'
import { useConfigStore } from '@/store/config'
import { useWebSocket } from '@/server/useWebSocket.js'
import { userLogoutApi } from '@/api/user'

const { triggerSearch } = useSearch()
const router = useRouter()
const { closeWebSocket } = useWebSocket()

defineProps(['categories'])

// ============================================================
// 数据
// ============================================================
const configStore = useConfigStore()
const userStore = useUserStore()
const themeStore = useThemeStore()
const vuetifyTheme = useTheme()

// ============================================================
// 计算属性
// ============================================================
// 登录态判定统一走 store getter（cookie 模式看 user 展示缓存，jwt 模式看 token+user）
const isLoggedIn = computed(() => userStore.isLoggedIn)

const userName = computed(() => {
  if (userStore.user) {
    return userStore.user.nickname || userStore.user.username || null
  }
  return null
})

const userAvatar = computed(() => {
  if (userStore.user && userStore.user.avatar) {
    return userStore.user.avatar
  }
  return ''
})

// ============================================================
// 辅助函数
// ============================================================
const hasChildren = (item) => {
  return item.children && item.children.length > 0
}

// ============================================================
// Logo 事件
// ============================================================
const handleLogoClick = () => {
  emitter.emit('reset-search')
}

// ============================================================
// 导航事件
// ============================================================
const handleNavClick = (type, param) => {
  if (type === 'friendLink') {
    router.push('/friendLink')
    return
  }

  if (type === 'about') {
    router.push('/about')
    return
  }

  triggerSearch(type, param)
}

// ============================================================
// 用户事件
// ============================================================
const handleLogin = () => {
  console.log('hello world')
  emitter.emit('loginDialogVisible', true)
}

const handleProfile = () => {
  console.log('跳转到个人中心')
  router.push('/profile')
}

const handleLogout = async () => {
  try {
    // 调用后端退出接口（删除 Redis 登录态）
    await userLogoutApi()
  } catch (error) {
    console.error('退出登录接口调用失败:', error)
  } finally {
    // 无论接口成败，本地状态都要清理
    closeWebSocket()
    userStore.clearUserStore()

    if (router.currentRoute.value.path === '/profile') {
      router.push('/')
    }
  }
}

// ============================================================
// 主题事件
// ============================================================
const handleToggleTheme = () => {
  themeStore.toggleTheme(vuetifyTheme)
}
</script>

<style scoped lang="scss">
// ============================================================
// 按钮
// ============================================================
.v-btn {
  min-width: 0;
}

.v-btn:hover .v-btn__content {
  opacity: 0.8;
}

// ============================================================
// 导航父子菜单
// ============================================================

// 箭头旋转动画
.nav-arrow {
  transition: transform 0.2s ease;
}

.nav-arrow--open {
  transform: rotate(-90deg);
}

// 父级按钮：失焦后强制 overlay 立即归零，不保留减淡残留
.nav-parent-btn:not(:hover):not(:focus-visible) {
  :deep(.v-btn__overlay) {
    opacity: 0 !important;
    transition: none !important;
  }
}

// ============================================================
// 用户信息
// ============================================================
.user-info-wrapper {
  transition: opacity 0.3s ease;
}

.user-info-wrapper:hover {
  opacity: 0.8;
}

.cursor-pointer {
  cursor: pointer;
}

:deep(div.v-list-item__prepend) {
  flex-direction: column !important;
}
</style>
