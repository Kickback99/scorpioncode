<template>

      <el-progress v-show="isProgressVisible"  type="circle" :percentage="percentage" :width="178"/>

      <el-upload
          v-show="!isProgressVisible"
          class="avatar-uploader"
          :class="uploaderClass"
          :action="handleAction"
          name="cover"
          :headers="headers"
          :with-credentials="isCookieMode()"
          :show-file-list="false"
          :on-success="onSuccess"
          :on-progress="handleProgress"
          :before-upload="beforeAvatarUpload">
          <img v-if="imageUrl" :src="imageUrl" class="avatar" @load="isProgressVisible=false"/>
          <el-icon v-else class="avatar-uploader-icon">
              <Plus />
          </el-icon>
      </el-upload>
      <span style="font-size:12px; color:#909399; margin-left:12px;">{{ sizeTip }}</span>
</template>

<script setup>
import { computed, ref } from 'vue';
import {Plus} from '@element-plus/icons-vue'
import { useTokenStore } from '@/store/token';
import { isCookieMode } from '@/utils/auth';
import msg from '@/components/msg'
const imageUrl = ref('')
let modelValue = defineModel()
const tokenStore = useTokenStore()

// 定义 props
const props = defineProps({ 
    // 形状类型：'square' | 'rectangle'
    shape: {
      type: String,
      default: 'square',
    }
})

// 手动设置请求头（cookie 模式由浏览器自动携带 HttpOnly Cookie，无需带 authorization）
const headers = computed(() => {
  return isCookieMode() ? {} : {
    authorization: tokenStore.token || ''
  }
})

// t_upload_request：封面图片请求
// t_env：文章封面上传
// 处理上传文件地址
const handleAction = computed(()=>{
  return `${import.meta.env.VITE_API}/admin/upload/cover`
})

// 图片上传成功之后的回调
const onSuccess = (res,uploadFile) => {
    console.log(res)
    // 用URL来做图片的本地预览
    imageUrl.value = URL.createObjectURL(uploadFile.raw)
    // 把后端图片的地址传递给父组件 formModel.cover
    modelValue.value = res.data
}

// 进度条业务
const percentage = ref(0)

const  isProgressVisible = ref(false)

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

// 准备上传的回调
const beforeAvatarUpload = (rawFile) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(rawFile.type)){
    msg.error('必须为 jpg | png | jpeg 格式')
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    msg.error('图片不能超过2MB')
    return false
  }
   isProgressVisible.value = true
  return true
}

// 上传时的回调
const handleProgress = (event) => {
  percentage.value =  Math.floor(event.percent)
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
    handleImage
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