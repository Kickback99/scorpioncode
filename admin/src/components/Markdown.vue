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

.dark-mode {
    --editor-bg: #000;
    --editor-text: #fff;
    --toolbar-bg: #000;
    --toolbar-text: #ccc;
}

/* 修复全屏时编辑器高度不撑满 → 下半留白 */
:deep(.v-md-textarea-editor) {
  min-height: 100%;
}

/* 修复全屏时暗黑模式下主容器白色背景露出 */
.dark-mode :deep(.v-md-editor) {
  background-color: #000 !important;
}
/* 暗黑模式下编辑器 wrapper 背景 */
.dark-mode :deep(.v-md-editor__editor-wrapper) {
  background-color: #000;
}

 /* v-md-editor-工具栏 */
:deep(.v-md-editor__right-area .v-md-editor__toolbar){
    background-color: var(--toolbar-bg) !important;
    color: var(--toolbar-text);
    .v-md-editor__toolbar-left-wrapper li{
           color: var(--toolbar-text);
    }
    .v-md-editor__toolbar-item:hover{
           color: var(--toolbar-text) !important;
           background-color: var(--el-fill-color-light) !important;
    }
}

 /* v-md-editor-工具栏下拉菜单（标题/插入图片）深色面板，避免白底浅字反色 */
.dark-mode :deep(.v-md-editor__menu) {
    background-color: var(--el-bg-color-overlay) !important;
}
.dark-mode :deep(.v-md-editor__menu-item:hover) {
    background-color: var(--el-fill-color-light) !important;
}
/* 深色模式下工具栏激活态（如标题按钮 H）背景深色化，避免浅灰底浅字反色 */
.dark-mode :deep(.v-md-editor__toolbar-item--active),
.dark-mode :deep(.v-md-editor__toolbar-item--active:hover) {
    background-color: var(--el-fill-color-light) !important;
    color: var(--toolbar-text) !important;
}
/* 工具栏文字提示（tooltip）背景对齐下拉面板，深浅色自动适配 */
:deep(.v-md-editor__tooltip) {
    background-color: var(--el-bg-color-overlay) !important;
    color: var(--el-text-color-primary) !important;
}

 /* v-md-editor-左边的编辑器 */
:deep(.v-md-editor__editor-wrapper textarea){
    background-color: var(--editor-bg) !important;
    color: var(--editor-text)
}
 /* v-md-editor-右边的预览区 */
/* :deep(.v-md-editor__preview-wrapper .github-markdown-body) {
    background-color: var(--editor-bg) !important;
    color: var(--editor-text)
} */

 /* vuepress主题下的v-md-editor-右边的预览区 */
:deep(.v-md-editor__preview-wrapper .v-md-editor-preview .vuepress-markdown-body){
  color: #fff;
  background: black !important;
}

// 这样设置切换主题不会生效
/* :deep(.v-md-editor__preview-wrapper){
       background: black !important;
} */


 /* vuepress主题下的v-md-editor-右边的预览区 */
:deep(.v-md-editor__preview-wrapper:has(.vuepress-markdown-body)){
    background: black !important;
}

// vuepress主题下的v-md-editor-右边的预览区 代码块颜色
:deep(.v-md-editor__preview-wrapper .vuepress-markdown-body code){
    color: $code-color !important;
    .token .operator{
        background-color: transparent !important;
    }

    .token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string{
        background-color: transparent !important;
    }
}

:deep(.vuepress-markdown-body tr:nth-child(2n)){
    color: black;
}

// 目录导航条设置
:deep(.v-md-editor__left-area) {
  .v-md-editor__left-area-title {
    color: var(--el-text-color-primary);
  }
  .v-md-editor__left-area-body .v-md-editor__toc-nav li.v-md-editor__toc-nav-item {
    color: var(--el-text-color-primary);
  }
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