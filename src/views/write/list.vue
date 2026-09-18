<template>
 <ArticleEdit ref="maskRef" @reRender="render"></ArticleEdit>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ArticleEdit from '@/views/components/ArticleEdit.vue';

const maskRef = ref()

/** 写博客入口不需要列表刷新，仅占位 */
const render = () => {}

onMounted(() => {
    maskRef.value.openMask()
    maskRef.value.handleToggle({})
})

</script>

<style scoped lang="scss">

</style>