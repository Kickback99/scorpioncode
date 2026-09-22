<template>
      <el-upload 
          class="avatar-uploader" 
          :class="uploaderClass"
          :auto-upload="false"
          name="cover" 
          :show-file-list="false"
          :onChange="handleSelectAvatar"
          >
          <img v-if="imageUrl" :src="imageUrl" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon">
              <Plus />
          </el-icon>
      </el-upload>
      <span style="font-size:12px; color:#909399; margin-left:12px;">{{ sizeTip }}</span>
</template>

<script setup>
import { computed, ref } from 'vue';
import {Plus} from '@element-plus/icons-vue'
import msg from '@/components/msg'

// 定义 props
const props = defineProps({
    // 父组件传递的回调函数，用于触发校验
    onValidate: {
        type: Function,
        default: null
    },
    // 形状类型：'square' | 'rectangle'
    shape: {
      type: String,
      default: 'square',
    }
})

const imageUrl = ref('')
let modelValue = defineModel()

// 计算动态类名
const uploaderClass = computed(() => {
  return props.shape === 'rectangle' ? 'rectangle-uploader' : 'square-uploader'
})

// 计算建议尺寸文本
const sizeTip = computed(() => {
  return props.shape === 'rectangle' 
    ? '建议尺寸：16 / 9' 
    : '建议尺寸：1 / 1'
})

// 校验函数（从 beforeAvatarUpload 提取）
const validateFile = (rawFile) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(rawFile.type)) {
    msg.error('必须为 jpg | png | jpeg 格式')
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    msg.error('图片不能超过2MB')
    return false
  }
  return true
}

// 文件选择的回调
const handleSelectAvatar = (file) => {

    // 先进行校验
    if (!validateFile(file.raw)) {
      return // 校验失败，不继续执行
    }

    imageUrl.value = URL.createObjectURL(file.raw)
    modelValue.value = file.raw

    // 如果父组件传递了 onValidate 回调，则执行
    if (props.onValidate && typeof props.onValidate === 'function') {
        props.onValidate()
    }
}

// 对外暴露handleImage方法，用与处理新增时清空图片，编辑时回显图片
const handleImage = (params) => {
  // 如果 params 是 File 对象，转换为 URL
  // 新增时，上传图片是 File 对象，编辑是 图片 显示的是 url 字符串
  if (params instanceof File) {
    imageUrl.value = URL.createObjectURL(params)
  } else {
    imageUrl.value = params
  }
}

defineExpose({
    handleImage,
})


</script>

<style lang="scss" scoped>

</style>

<style>
.avatar-uploader .avatar {
  display: block;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader .el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  text-align: center;
}

/* ==================== 正方形样式 ==================== */
.square-uploader .avatar {
  width: 150px;
  height: 150px;
}

.square-uploader .el-icon.avatar-uploader-icon {
  width: 150px;
  height: 150px;
}

/* ==================== 长方形样式 ==================== */
.rectangle-uploader .avatar {
  width: 178px;
  height: 100px;
}

.rectangle-uploader .el-icon.avatar-uploader-icon {
  width: 178px;
  height: 100px;
}
</style>