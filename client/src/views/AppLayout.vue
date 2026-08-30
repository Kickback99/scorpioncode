<template>
    <v-app>
        <AppHeader :categories="categories"></AppHeader>

        <!-- 主内容 -->
        <v-main>
            <v-container>
                <v-row>
                    <!-- 左侧内容：面包屑、轮播图和文章列表 -->
                    <v-col :md="leftColMd" cols="12">
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

                    <!-- 右侧侧边栏 -->
                    <v-col md="3" v-show="showSidebar && mdAndUp">
                        <AppSidebar></AppSidebar>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>

        <!-- 底部页脚 -->
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
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
// 全局总线
import emitter from '@/utils/event-bus.js'
import { useDisplay } from 'vuetify';
import { useConfigStore } from '@/store/config';

const {mdAndUp} = useDisplay()

const configStore = useConfigStore()


const route = useRoute()

const categories = ref([])

const renderCateList = async() => {
    const res = await cateListApi()
    categories.value = res.data
}
renderCateList()

/* watch(()=>route.path,(newPath) => {
    if (newPath !== '/') {
      emitter.emit('reset-search')
    }
}) */


/* watch(route,(to,form) => {
  console.log(to.path)
  sidebarVisible.value = to.path != '/about'
},{immediate:true}) */

const isBigScreen = computed(() => route.path === '/about' || route.path === '/profile' || route.path === '/friendLink' || route.path === '/404')
const leftColMd = computed(() => isBigScreen.value ? 12 : 9)
const showSidebar = computed(() => !isBigScreen.value)
// 轮播图显示条件：首页 + 大屏 + 轮播图数量限制(>0)
const showCarousel = computed(() => route.path === '/' && mdAndUp.value && configStore.getCarouselLimit)



// console.log('route.path',route.path)

</script>

<style scoped lang="scss">

</style>