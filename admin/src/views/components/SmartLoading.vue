<template>
    <!-- 占位块：宽度跟随父容器，懒加载内容就绪后由真实内容接管 -->
    <div
        v-loading="true"
        :element-loading-background="maskBg"
        class="smart-loading"
        :style="placeholderStyle"
    ></div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserConfigStore } from '@/store/userConfig'

const userConfigStore = useUserConfigStore()

const props = defineProps({
    /** 占位高度(px) — 懒加载内容高度固定时传它，占位与真实内容严格等高，加载前后不跳变 */
    height: {
        type: Number,
        default: 0
    },
    /** 占位最小高度(px) — 懒加载内容高度由内容撑开时传它，只保底不塌陷 */
    minHeight: {
        type: Number,
        default: 0
    }
})

// 遮罩底色跟随深浅模式，取值对齐 IconCollect.vue
const maskBg = computed(() =>
    userConfigStore.isDarkEnabled ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'
)

const placeholderStyle = computed(() => ({
    height: props.height ? `${props.height}px` : undefined,
    minHeight: props.minHeight ? `${props.minHeight}px` : undefined
}))
</script>

<style scoped lang="scss">
.smart-loading {
    width: 100%;
    border-radius: 4px;
}
</style>
