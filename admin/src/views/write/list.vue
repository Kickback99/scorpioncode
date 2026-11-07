<template>
 <!-- ===== 写博客入口 ===== -->
 <ArticleEdit ref="maskRef" @reRender="render"></ArticleEdit>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ArticleEdit from '@/views/components/ArticleEdit.vue';

// ============================================================
// 数据
// ============================================================
const maskRef = ref()

// ============================================================
// 方法
// ============================================================
/** 写博客入口不需要列表刷新，仅占位 */
const render = () => {}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
    maskRef.value.openMask()
    maskRef.value.handleToggle({})
})

</script>

<style scoped lang="scss">

</style>
