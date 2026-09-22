<template>
    <h4>{{ route.name }}</h4>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped lang="scss">

</style>
