<template>
    <svg aria-hidden="true" :style="{width,height}">
      <use :xlink:href="symbolId" :fill="fill" />
    </svg>
  </template>
  
  <script setup>
  import { computed } from 'vue'
    const props = defineProps({
      prefix: {
        type: String,
        default: 'icon',
      },
      name: {
        type: String,
        required: true,
      },
      fill: {
        type: String,
        default: '',
      },
      width :{
        type:String,
        default: '18px'
      },
      height :{
        type:String,
        default: '18px'
      }
    })
    const symbolId = computed(() => `#${props.prefix}-${props.name}`)

  </script>