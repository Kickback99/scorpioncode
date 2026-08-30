<template>
    <!-- 骨架屏 -->
    <v-container v-if="isLoading">
        <v-card style="position: relative;">
            <v-skeleton-loader type="image" height="250" class="carousel-skeleton" />
            <v-skeleton-loader
                type="heading"
                class="carousel-skeleton-title"
                style="position: absolute; bottom: 28px; left: 16px;"
            />
        </v-card>
    </v-container>

    <!-- 真实轮播 -->
    <v-container v-else-if="carouselItems.length > 0">
        <v-card>
            <v-carousel
                height="250px" hide-delimiters show-arrows theme="scorpion-dark" style="cursor: pointer;">
                <v-carousel-item
                    v-for="(item, index) in carouselItems"
                    :key="index"
                    @click="goToLink(item.link)"
                >
                    <v-img :src="item.img" :lazy-src="coverRect" cover class="lazy-img" />
                    <!-- 轮播标题遮罩 + 文字 -->
                    <v-overlay
                        absolute
                        class="d-flex align-center justify-center"
                        style="background: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.75));"
                    >
                    </v-overlay>
                        <v-card-title
                            class="text-white text-h6 font-weight-bold"
                            style="position: absolute; bottom: 16px; left: 16px; text-shadow: 0 1px 4px rgba(0,0,0,0.6);"
                        >
                            {{ item.title }}
                        </v-card-title>
                </v-carousel-item>
            </v-carousel>
        </v-card>
    </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCarouselListApi } from '@/api/carousel'
import { useRouter } from 'vue-router'
import coverRect from '@/assets/images/cover-rect.png'
const router = useRouter()

const isLoading = ref(true)
const carouselItems = ref([])

// 加载轮播图
const loadCarousel = async () => {
    try {
        const res = await getCarouselListApi()
        carouselItems.value = res.data || []
    } catch (error) {
        console.error('加载轮播图失败:', error)
    } finally {
        isLoading.value = false
    }
}

// 跳转链接：外部链接新窗口打开，内部链接路由跳转
const goToLink = (link) => {
    if (!link) return
    
    // 判断是否为 http 或 https 开头的外部链接
    if (link.startsWith('http://') || link.startsWith('https://')) {
        window.open(link, '_blank')
    } else {
        router.push(link)
    }
}

onMounted(() => {
    loadCarousel()
})
</script>

<style scoped>
/* 骨架屏：image 填满 250px + 移除默认 margin + 透明背景 */
.carousel-skeleton {
  background: transparent !important;
}

.carousel-skeleton :deep(.v-skeleton-loader__image) {
  margin: 0;
  height: 100%;
}

/* 骨架屏标题：透明背景 + 重置 heading margin */
.carousel-skeleton-title {
  width: 240px;
  background: transparent !important;
}

.carousel-skeleton-title :deep(.v-skeleton-loader__heading) {
  margin: 0;
}

/* 轮播图标题样式 */
.v-overlay {
    pointer-events: none;
}

/* 轮播图左右箭头始终使用深色主题色，任意背景都清晰，并缩小尺寸 */
:deep(.v-window__left),
:deep(.v-window__right) {
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
    width: 35px;
    height: 35px;
}

:deep(.v-window__left .v-icon),
:deep(.v-window__right .v-icon) {
    font-size: 20px;
}
</style>