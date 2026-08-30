<template>
    <!-- ===== 404 展示区 ===== -->
    <v-container class="not-found" :style="{ '--not-found-scale': scale }">
        <div class="text-center">
            <h1 class="text-h3 font-weight-black text-primary">404</h1>
            <p class="text-body-1 text-medium-emphasis mt-3">页面不存在</p>
            <v-btn color="primary" class="mt-5" @click="handleBackHome">
                <v-icon start>mdi-home</v-icon>
                返回首页
            </v-btn>
        </div>
    </v-container>
</template>

<script setup>
// 依赖导入
import { useRouter } from 'vue-router'
import { useDialogFontScale } from '@/composables/useDialogFontScale'

const scale = useDialogFontScale(0.8)

// ============================================================
// 事件
// ============================================================
const router = useRouter()

const handleBackHome = () => {
    router.push('/')
}
</script>

<style scoped lang="scss">
.not-found {
    min-height: calc(100vh - 220px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;

    // ============================================================
    // 移动端字号缩放
    // ============================================================
    --not-found-scale: 1;

    :deep(.text-h3) {
        font-size: calc(3rem * var(--not-found-scale)) !important;
    }

    :deep(.text-body-1) {
        font-size: calc(1rem * var(--not-found-scale)) !important;
    }

    :deep(.v-btn) {
        --v-btn-size: calc(0.875rem * var(--not-found-scale)) !important;
    }
}
</style>
