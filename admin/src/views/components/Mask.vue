<template>
    <div v-if="maskVisible" class="window" :style="{
        backgroundColor: settingStore.pageTheme ? 'var(--page-theme-bg)' : (userConfigStore.isDarkEnabled ? '#222' : '#fff'),
        }">
        <!-- <div class="header">
            <span class="iconfont icon-back" @click="close"></span>
        </div> -->
        <div class="content">
            <slot></slot>
        </div>
        <div class="footer">
            <el-row justify="center" align="middle">
                <el-button size="small" type="info" @click="emit('closeMask')" plain>{{ backLabel }}</el-button>
                <el-button size="small" type="primary" @click="emit('openDialog')" plain>确定</el-button>
            </el-row>
        </div>
    </div>
</template>

<script setup>
import { useUserConfigStore } from '@/store/userConfig'
import { useSettingStore } from '@/setting'
const userConfigStore = useUserConfigStore()
const settingStore = useSettingStore()
const windowWidth = window.innerWidth - 260

defineProps({
    maskVisible: {
        type: Boolean,
        default: false
    },
    /** 返回按钮文案 — 写博客入口传 '清空'，文章管理传 '返回' */
    backLabel: {
        type: String,
        default: '返回'
    },
})


const emit = defineEmits(['closeMask', 'openDialog'])
const close = () => {
    emit('close')
}

</script>

<style scoped lang="scss">
.window {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    overflow-y: auto;
    // min-height: 100%;
    z-index: 10;
}

.header {
    height: 30px;
    display: flex;
    align-items: center;

    .icon-back {
        font-size: 25px;
        cursor: pointer;
    }
}

.content {
    // 高度自适应，让 footer 按钮始终贴合在编辑器下方
    // overflow-y: auto;
    padding: 10px 10px 0;

    // 抵消最后一个表单字段的默认下边距，间距统一由 footer margin-top 控制
    :deep(.el-form-item:last-child) {
        margin-bottom: 0;
    }
}

.footer {
    // height: 50px;
    // background: coral;
    // line-height: 50px;
    .el-row {
        // 编辑器和按钮的间距，想调就改这个值
        margin-top: 14px;
    }

    // background-color: deeppink;
}
</style>