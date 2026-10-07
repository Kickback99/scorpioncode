<template>
    <v-card class="mb-4">
        <v-card-title class="text-h6">{{ title }}</v-card-title>
        <slot name="default"></slot>
    </v-card>
</template>

<script setup>
defineProps({
    title:{
        type:String,
        required:true
    }
})
</script>

<style scoped lang="scss">

</style>