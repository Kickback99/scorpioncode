<template>
    <v-app>
        <!-- ===== 顶部导航 ===== -->
        <AppHeader :categories="categories"></AppHeader>

        <!-- ===== 主内容 ===== -->
        <v-main>
            <v-container>
                <v-row>
                    <!-- 左侧内容：面包屑、轮播图和文章列表 -->
                    <v-col :md="leftColMd" cols="12" :style="contentColStyle">
                        <!-- 面包屑导航 -->
                        <AppBreadcrumb :categories="categories" />

                        <!-- 轮播图 -->
                         <v-row v-if="showCarousel">
                            <AppCarousel></AppCarousel>
                         </v-row>

                        <v-row>
                            <router-view></router-view>
                        </v-row>
                    </v-col>

                    <!-- TOC 图标占位列：outer 模式下给 TOC/回到顶部图标让出 (9 - CONTENT_PARTS) 份 -->
                    <v-col :style="tocSpaceStyle" v-show="showTocSpace"></v-col>

                    <!-- 右侧侧边栏 -->
                    <v-col md="3" v-show="showSidebar && mdAndUp">
                        <AppSidebar></AppSidebar>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>

        <!-- ===== 底部页脚 ===== -->
        <AppFooter></AppFooter>
    </v-app>
</template>

<script setup>
import { cateListApi } from '@/api/article';
import AppSidebar from '@/components/AppSidebar.vue';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import AppCarousel from '@/components/AppCarousel.vue';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useConfigStore } from '@/store/config';

// ============================================================
// 数据
// ============================================================
const {mdAndUp, lgAndUp} = useDisplay()

const configStore = useConfigStore()


const route = useRoute()

const categories = ref([])

// ============================================================
// 渲染
// ============================================================
const renderCateList = async() => {
    const res = await cateListApi()
    categories.value = res.data
}
renderCateList()

// ============================================================
// 计算属性
// ============================================================
// 个人中心按路由名判定（兼容 /PROFILE、/profile/ 等写法），其余公开页仍按 path
const isBigScreen = computed(() => route.path === '/about' || route.name === 'Profile' || route.path === '/friendLink' || route.path === '/404')
const leftColMd = computed(() => isBigScreen.value ? 12 : 9)
const showSidebar = computed(() => !isBigScreen.value)
// TOC 图标占位列：桌面端 + 非大屏页 + outer 模式时显示
const showTocSpace = computed(() => lgAndUp.value && showSidebar.value && configStore.currentTocPosition !== 'inner')
// outer 模式下内容列份数（可微调：留 (9 - CONTENT_PARTS) 份给 TOC 图标占位，如 8.7 + 0.3 = 9 份）
const CONTENT_PARTS = 8.7
const contentColStyle = computed(() => {
  if (!showTocSpace.value) return {}
  const pct = (CONTENT_PARTS / 12) * 100
  return { flex: `0 0 ${pct}%`, maxWidth: `${pct}%` }
})
const tocSpaceStyle = computed(() => {
  if (!showTocSpace.value) return {}
  const pct = ((9 - CONTENT_PARTS) / 12) * 100
  return { flex: `0 0 ${pct}%`, maxWidth: `${pct}%` }
})
// 轮播图显示条件：首页 + 大屏 + 轮播图数量限制(>0)
const showCarousel = computed(() => route.path === '/' && mdAndUp.value && configStore.getCarouselLimit)

// console.log('route.path',route.path)
</script>

<style scoped lang="scss">

</style>