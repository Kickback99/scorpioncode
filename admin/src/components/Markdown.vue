<template>
    <div :class="{'dark-mode': userConfigStore.isDarkEnabled}" style="width: 100%;">
        <component 
        :is="MarkdownPreview" 
        :modelValue="modelValue"
        :height="height + 'px'" :include-level="[1, 2, 3, 4, 5, 6]" :disabled-menus="[]"
        @change="onChange"
        :config="{mode:'markdown'}"
        @upload-image="handleUploadImage"
        :key="userConfigStore.isDarkEnabled"
        />  

    </div>
</template>

<script setup>
import { uploadApi } from '@/api/article'
import { computed } from 'vue'
import { useUserConfigStore } from '@/store/userConfig'
const userConfigStore = useUserConfigStore()
import { createMarkdownPreview } from '@/utils/markdown-config'

// 使用 computed 每次重新创建组件
const MarkdownPreview = computed(() => {
  console.log('创建主题:', userConfigStore.isDarkEnabled?"vuepress":"github")
  return createMarkdownPreview(userConfigStore.isDarkEnabled?"vuepress":"github")
})

const props = defineProps({
    modelValue: {
        type: String
    },
    height: {
        type: Number,
        default: 500
    },
    // 上传回调名称，默认使用 'default'
    uploadHandler: {
        type: String,
        default: 'default'
    }
})

const emit = defineEmits(['update:modelValue','htmlContent'])

const onChange = (markdownContent,htmlContent) =>{
    emit('update:modelValue',markdownContent)
    // emit('htmlContent',htmlContent)
}

// 默认上传处理器（文章内容图片）
const handleDefaultUpload  = async (event, insertImage, files) => {
    const formData = new FormData()
    formData.append('content', files[0])
    try {
        // t_upload_request：内容图片请求
        const res = await uploadApi(formData)
        insertImage({
            url: res.data,
            desc: '图片描述的信息',
            // width: 'auto',
            // height: 'auto',
        });
    } catch (error) {
        console.error('上传失败', error)
    }
}


// 公告内容图片上传处理器
const handleNoticeUpload = async (event, insertImage, files) => {
    const formData = new FormData()
    formData.append('notice', files[0])
    try {
        // 使用公告专用上传接口
        const { noticeUploadApi } = await import('@/api/notice')
        const res = await noticeUploadApi(formData)
        insertImage({
            url: res.data,
            desc: '公告图片',
        })
    } catch (error) {
        console.error('公告图片上传失败', error)
    }
}

// 自定义上传处理器映射表
const uploadHandlers = {
    default: handleDefaultUpload,
    notice: handleNoticeUpload,
}

// 根据 props.uploadHandler 动态选择上传处理器
const handleUploadImage = async (event, insertImage, files) => {
    console.log('📢 [Markdown] uploadHandler:', props.uploadHandler)
    const handler = uploadHandlers[props.uploadHandler] || uploadHandlers.default
    await handler(event, insertImage, files)
}
</script>

<style lang="scss" scoped>

/* 修复全屏时编辑器高度不撑满 → 下半留白 */
:deep(.v-md-textarea-editor) {
  min-height: 100%;
}
</style>

<style lang="scss">
/* 浅色模式变量定义放在非 scoped 块，避免 :root 被编译成 [data-v]:root 而失效 */
/* :root {
    --editor-bg: #fff;
    --editor-text: #000;
    --toolbar-bg: #f5f5f5;
    --toolbar-text: #333;
} */

/* v-md-editor 全屏时压低 tags-view 层叠上下文 */
body:has(.v-md-editor--fullscreen) .tags-view {
  z-index: 0 !important;
  backdrop-filter: none !important;
}

/* v-md-editor 自定义滚动条同步全局样式 */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-thumb {
  background-color: color-mix(in srgb, var(--el-color-primary-light-5) 30%, transparent) !important;
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
    background-color: color-mix(in srgb, var(--el-color-primary) 45%, transparent) !important;
}
::-webkit-scrollbar-track {
  background: transparent;
}
</style>