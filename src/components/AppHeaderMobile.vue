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

  <!-- 移动端控制区 -->
  <div class="d-flex ml-auto align-center">
    <!-- 移动端用户区域 -->
    <div v-if="isLoggedIn">
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
            <v-avatar size="32" color="white">
              <v-icon color="primary" v-if="!userAvatar">mdi-account-circle</v-icon>
              <v-img v-else :src="userAvatar" alt="avatar"></v-img>
            </v-avatar>
            <v-icon color="white" size="20" class="ml-1">mdi-menu-down</v-icon>
          </div>
        </template>

        <v-list density="compact" min-width="80" class="mt-2 scorpion-list-mobile">
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
      size="small"
    >
      <v-icon>mdi-account</v-icon>
      登录
    </v-btn>

    <!-- ========== 移动端主题切换按钮（图标按钮） ========== -->
    <v-btn
      size="small"
      @click="handleToggleTheme"
      icon
    >
      <v-icon>{{ themeStore.isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
    </v-btn>

    <!-- 移动端菜单按钮 -->
    <v-btn
      size="small"
      icon
      @click="drawer = !drawer"
      class="ml-auto"
    >
      <v-icon>mdi-menu</v-icon>
    </v-btn>
  </div>

  <!-- 移动端抽屉菜单（Teleport 到父级 .mobile-drawer-portal 以脱离 v-app-bar DOM 层级） -->
  <Teleport to=".mobile-drawer-portal">
    <v-navigation-drawer
      v-model="drawer"
      temporary
      location="left"
    >
      <v-list nav density="compact" color="primary" open-strategy="single">
        <template v-for="item in categories" :key="item.id">
          <!-- 有子菜单的项 -->
          <v-list-group
            v-if="hasChildren(item)"
            :value="item.id"
          >
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                class="nav-parent-group"
              >
                <template v-slot:title>
                  <span class="nav-parent-text" @click.stop="handleNavClick('cate', item.id)">{{ item.name }}</span>
                </template>
              </v-list-item>
            </template>

            <v-list-item
              v-for="child in item.children"
              :key="child.id"
              :value="child.id"
              @click="handleNavClick('cate',child.id)"
            >
              <v-list-item-title>{{ child.name }}</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <!-- 没有子菜单的项 -->
          <v-list-item
            v-else
            :title="item.name"
            @click="handleNavClick('cate',item.id)"
          ></v-list-item>
        </template>

        <!-- ========== 移动端添加友链和关于按钮 ========== -->

        <v-list-item
          v-if="configStore.getFriendLinkEnabled()"
          @click="handleNavClick('friendLink')"
        >
          <v-list-item-title>友链</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="configStore.getAboutEnabled()"
          @click="handleNavClick('about')"
        >
          <v-list-item-title>关于</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </Teleport>
</template>

<script setup>
import { inject, watch, computed, onMounted } from 'vue'
import { useDisplay, useTheme } from 'vuetify'
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
const { smAndDown } = useDisplay()
const { closeWebSocket } = useWebSocket()

defineProps(['categories'])

// ============================================================
// 数据
// ============================================================
const configStore = useConfigStore()
const userStore = useUserStore()
const themeStore = useThemeStore()
const vuetifyTheme = useTheme()
const drawer = inject('drawer')

// ============================================================
// 计算属性
// ============================================================
// 登录态判定统一走 store getter（cookie 模式看 user 展示缓存，jwt 模式看 token+user）
const isLoggedIn = computed(() => userStore.isLoggedIn)

const userName = computed(() => {
  if (userStore.user && userStore.user.username) {
    return userStore.user.username
  }
  return '张三'
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
// 监听
// ============================================================
// 监听屏幕尺寸变化，当从移动端切换到桌面端时关闭抽屉
watch(smAndDown, (newValue, oldValue) => {
  if (oldValue === true && newValue === false) {
    drawer.value = false
  }
})

// ============================================================
// Logo 事件
// ============================================================
const handleLogoClick = () => {
  drawer.value = false
  emitter.emit('reset-search')
}

// ============================================================
// 导航事件
// ============================================================
const handleNavClick = (type, param) => {
  if (smAndDown.value) {
    drawer.value = false
  }

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
  if (smAndDown.value) {
    drawer.value = false
  }
  emitter.emit('loginDialogVisible', true)
}

const handleProfile = () => {
  console.log('跳转到个人中心')
  if (smAndDown.value) {
    drawer.value = false
  }
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

    if (smAndDown.value) {
      drawer.value = false
    }

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

:deep(div.scorpion-list-mobile) {
  transform: translateX(-50px) !important;
}
</style>
