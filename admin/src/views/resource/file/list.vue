<template>
    <div class="toolbar">
        <el-form label-width="auto" inline size="small">
            <el-form-item>
                <el-input v-model="searchData.name" placeholder="请输入文件名称" />
            </el-form-item>
            <el-form-item>
                <SmartSelector v-model="searchData.ext" :data="exts" style="width: 200px;" placeholder="请选择扩展名">
                </SmartSelector>
            </el-form-item>
            <el-form-item>
                <SmartSelector v-model="searchData.sortField" :data="fields" style="width: 200px;" placeholder="请选择排序">
                </SmartSelector>
            </el-form-item>
            <el-form-item>
                <el-button size="small" :type="searchData.sortOrder === 'ASC' ? 'primary' : ''" icon="Top" @click="setSortOrder('ASC')" circle plain />
                <el-button size="small" :type="searchData.sortOrder === 'DESC' ? 'primary' : ''" icon="Bottom" @click="setSortOrder('DESC')" circle plain />
            </el-form-item>
            <el-form-item>
                <el-button size="small" type="primary" icon="Search" @click="onSearch" plain>搜索</el-button>
                <el-button size="small" type="info" icon="Refresh" @click="onReset" plain>重置</el-button>
            </el-form-item>
        </el-form>
        <div class="bottom" style="margin-bottom: 20px;">
            <div class="file-operate">
                <el-button size="small" type="danger" v-perm="'btn.file.remove'" @click="deleteSelectRows()" plain>
                    <offlineIcon icon="ri:delete-bin-3-fill"></offlineIcon>批量删除
                </el-button>
            </div>

            <div class="file-operate">
                <el-button size="small" type="danger" v-perm="'btn.file.remove'" @click="handleSyncDelete()" plain>
                    <OfflineIcon icon="ri:delete-bin-fill"></OfflineIcon>同步删除
                </el-button>
            </div>

            <div class="file-operate">
                <el-button size="small" type="primary" v-perm="'btn.file.update'" @click="handleUpdateRecords" plain>
                    <offlineIcon icon="ri:database-2-line"></offlineIcon>更新数据库</el-button>
            </div>

            <el-upload class="file-operate file-upload" :action="handleAction" :headers="headers"
                :with-credentials="isCookieMode()"
                name="file" :show-file-list="false"
                :on-success="onSuccess"
                :before-upload="beforeUpload"
                :on-error="onError">
                <el-button size="small" type="primary" v-perm="'btn.file.add'" plain>
                    <offlineIcon icon="ri:add-fill"></offlineIcon>文件上传
                </el-button>
            </el-upload>

            <el-upload class="file-operate" :action="handleAction" :headers="headers" name="file"
                :with-credentials="isCookieMode()"
                :show-file-list="false" :on-success="onSuccess"
                :before-upload="beforeUpload"
                :on-error="onError"
                multiple>
                <el-button size="small" type="primary" v-perm="'btn.file.add'" plain>
                    <offlineIcon icon="ri:file-add-line"></offlineIcon>批量上传
                </el-button>
            </el-upload>
           
        </div>
    </div>

    <el-table :data="tableData" :style="{ width: '100%' }"   @selection-change="removeMultiple">
        <el-table-column type="selection" :selectable="selectable" width="55" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="文件名称" />
        <el-table-column label="图片">
            <template #default="{ row }">
                <el-image v-if="IMAGE_EXTS.includes(row.ext)" :src="row.url" style="width: 80px; height: 45px" fit="cover" preview-teleported :preview-src-list="[row.url]" />
                <span v-else>-</span>
            </template>
        </el-table-column>
        <el-table-column prop="ext" label="扩展名" />
        <el-table-column prop="size" label="文件大小" />
        <!-- <el-table-column prop="url" label="文件链接" /> -->
        <el-table-column prop="md5" label="文件md5" />
        <el-table-column prop="status" label="文件状态"></el-table-column>
        <el-table-column prop="createTime" label="创建日期"></el-table-column>
        <el-table-column label="操作" width="150">
            <template #default="{row}">
                <el-button size="small" type="warning" v-perm="'btn.file.update'" @click="handleEdit(row)" icon="Edit" circle plain></el-button>
                <el-popconfirm :title="`你确定要删除${row.name}吗`" @confirm="handleRemove(row.id)" width="250px"
                    icon="WarnTriangleFilled">
                    <template #reference>
                        <el-button size="small" type="danger" v-perm="'btn.file.remove'" icon="Delete" circle plain />
                    </template>
                </el-popconfirm>
                <el-button size="small" type="success" icon="Download" @click="handleDownload(row)" circle plain></el-button>
            </template>
        </el-table-column>
    </el-table>

    <el-pagination
        size="small"
        v-model:current-page="params.pageNum"
        v-model:page-size="params.pageSize"
        :page-sizes="[2, 5, 7, 10]"
        layout="jumper, sizes, total, ->, prev, pager, next"
        :total="total"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
        style="margin-top: 20px; justify-content: flex-end;"
    />

    <el-dialog v-model="dialogVisible" title="修改文件名" width="30%" :close-on-click-modal="false">
        <el-form ref="ruleFormRef"  :model="formModel" :rules="rules" label-width="120px" class="demo-ruleForm" size="small"
            status-icon>
            <el-form-item label="文件名称" prop="name">
                <el-input placeholder="请输入文件名称" v-model="formModel.name" />
            </el-form-item>

        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button size="small" @click="handleConfirm" plain>确认</el-button>
                <el-button size="small" type="info" @click="dialogVisible = false" plain>
                    取消
                </el-button>
            </span>
        </template>
    </el-dialog>

</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue';
import {extsApi, listApi, removeApi, syncDeleteApi,modifyApi, updateRecordApi} from '@/api/file';
import msg from '@/components/msg';
import SmartSelector from '@/views/components/SmartSelector.vue';
import { useTokenStore } from '@/store/token';
import { isCookieMode } from '@/utils/auth';
import offlineIcon from '@/components/MyIcon/src/offlineIcon';
const tokenStore = useTokenStore()
const searchData = reactive({
        sortField: 'create_time',  // 保留默认排序字段
        sortOrder: 'DESC'           // 保留默认排序方向
})

onMounted(()=>{
    console.log('文件组件已挂载......')
})



const tableData = ref([])

const params = reactive({
    pageNum:1,
    pageSize:10
})

const total = ref(null)

const fields = ref([
    {label:'请选择排序',value:'',disabled: true},
    {label:'文件名',value:'name'},
    {label:'文件大小',value:'size'},
    {label:'创建时间',value:'create_time'},
])

// 设置排序方向
const setSortOrder = (order) => {
  searchData.sortOrder = order
}

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]

const exts = ref([])

// t_file_request：文件列表请求
const render = async() => {
    const res = await listApi(params.pageNum,params.pageSize,searchData)
    tableData.value = res.data.items
    console.log(res.data.items)
    total.value = res.data.total
}

render()

const renderExts = async() => {
    const res = await extsApi()
    exts.value =res.data.map(item => ({
        label:item,
        value:item
    }))
}
renderExts()

//点击分页事件
const onSizeChange = (size) => {
    //console.log(`onSizeChange：每页显示${size}条`)
    //每页条数发生变化时，重新从第一页渲染
    params.pageNum = 1
    //更新每页条数
    params.pageSize = size
    //重新渲染
    render()
}

const onCurrentChange = (page) => {
    //console.log(`onCurrentChange：当前第${page}页`)
    //更新当前页
    params.pageNum = page
    //重新渲染
    render()
}

const onSearch = () => {
    /* if(Boolean(searchData.sortField) != Boolean(searchData.sortOrder)){
        msg.error(searchData.sortField?'请选择排序':'请选择排序字段')
    } */
    params.pageNum = 1
    render()
}

const onReset = () => {
    params.pageNum = 1
    Object.assign(searchData,{name:'',ext:'',sortField:'create_time',sortOrder:'DESC'})
    render()
}

// 手动设置请求头（cookie 模式由浏览器自动携带 HttpOnly Cookie，无需带 authorization）
const headers = computed(() => {
  return isCookieMode() ? {} : {
    authorization: tokenStore.token || ''
  }
})

// t_file_request：文件上传请求
// t_env：文件上传
// 处理上传文件地址
const handleAction = computed(()=>{
  return `${import.meta.env.VITE_API}/resource/file/upload`
})

// t_file_request：文件下载请求
const handleDownload = async(row) => {
    console.log(row.url)
    // const url = row.url.substring(row.url.lastIndexOf('/')+1)
    window.open(row.url)
}

// 文件预检查
const beforeUpload = (file) => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  // 检查文件大小
  if (file.size > maxSize) {
    msg.error(`"${file.name}" 大小 ${(file.size / 1024 / 1024).toFixed(2)}MB，超过 10MB 限制`)
    return false
  }

  return true
}

const onSuccess = (res,file) => {
    // 文件存在重复上传或者大小超出限制
    if(res.code === 0){
        msg.error(res.message)
        return;
    }
    
    // 文件上传成功
    msg.primary(res.message)
    render()
}

const onError = (error, file, fileList) => {
      console.error('上传错误:', error)
  
  // 处理大文件错误
  if (error.status === 0 || 
      error.message?.includes('CONNECTION') || 
      error.message?.includes('Network Error')) {
    msg.error('文件太大，请上传 10MB 以内的文件')
  } else {
    msg.error('上传失败，请重试')
  }
}

const dialogVisible = ref(false)

const formModel = reactive({})

// t_file_request：文件同步删除请求
const handleSyncDelete = async() => {
    const res = await syncDeleteApi()
    /* msg.primary(res.message)
    render() */

    
    if (res.code === 200) {
        // 成功消息
        msg.primary({
            message: res.message.replace(/\n/g, '<br><br>'),
            // duration: 6000, // 显示时间长一些，方便阅读
            dangerouslyUseHTMLString: true,
            customClass: 'pre-line-message' // 添加自定义样式类
        })
    }else{
        // 错误消息
        msg.error({
            message: res.message.replace(/\n/g, '<br><br>'),
            // duration: 6000,
            dangerouslyUseHTMLString: true,
            customClass: 'pre-line-message'
        })
    }

    render()
}

const ruleFormRef = ref()
// 表单校验
const rules = reactive({
   name:[
        {required:true,message:'请输入文件名',trigger:'blur'},
        {pattern:/^\S{2,10}$/,message:'密码必须是 2-10位 的非空字符',trigger:'blur'}
    ]
})

const handleEdit = async(row) => {
  dialogVisible.value = true
  // 等待对话框渲染完成
  await nextTick()
  // 重置表单校验状态
  ruleFormRef.value?.resetFields()
  // 设置回显数据
  Object.assign(formModel, row)
}

// t_file_request：文件名字修改请求
const handleConfirm = async() => {
    await ruleFormRef.value.validate()
    modifyApi(formModel.id,formModel.name)
    dialogVisible.value = false
    msg.primary('修改成功')
    render()
}

const multipleSelection = ref([])

const removeMultiple = (raw) =>{
    console.log(raw)
    multipleSelection.value = raw
    // console.log(multipleSelection.value)
}

// t_file_request：文件删除请求
const handleRemove = async(id) => {
    const res = await removeApi(id)
    msg.primary(res.message)
    render()
}

// t_file_request：文件批量删除请求
const deleteSelectRows = async() => {
    if(multipleSelection.value.length === 0){
        msg.error('请先勾选要删除的行')
        return
    }
	await ElMessageBox.confirm('你确认要进行删除么','温馨提示', {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
    })
    const rowIds = multipleSelection.value.map(row => row.id)
    const res = await removeApi(rowIds)
    msg.primary(res.message)
    render()
}

// t_file_request：更新数据库请求
const handleUpdateRecords = async() => {
    const res = await updateRecordApi()
    if (res.code === 200) {
        // 成功消息
        msg.primary({
            message: res.message.replace(/\n/g, '<br><br>'),
            // duration: 6000, // 显示时间长一些，方便阅读
            dangerouslyUseHTMLString: true,
            customClass: 'pre-line-message' // 添加自定义样式类
        })
    }else{
        // 错误消息
        msg.error({
            message: res.message.replace(/\n/g, '<br><br>'),
            // duration: 6000,
            dangerouslyUseHTMLString: true,
            customClass: 'pre-line-message'
        })
    }

    render()
}

</script>

<style lang="scss" scoped>
/* .toolbar {
    @include flex(space-between,null,null)
} */
 .bottom {
    display: flex;
    align-items: center;
    gap: 15px;
    .file-upload {
        margin-left: auto;
    }
 }

</style>