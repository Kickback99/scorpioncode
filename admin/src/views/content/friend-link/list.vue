<template>
    <!-- ===== 搜索栏 ===== -->
    <div class="flex justify-between items-center">
        <el-form ref="formRef" :model="searchModel" label-width="auto" inline size="small"> 
            <el-form-item >
                <el-input v-model="searchModel.keyword" placeholder="请输入名字/描述"/>
            </el-form-item>
            <el-form-item style="width: 200px">
                <SmartSelector v-model="searchModel.status" :data="statusOptions" placeholder="请选择审核状态"></SmartSelector>
            </el-form-item>
             <el-form-item >
                <el-button size="small" type="primary" icon="Search" @click="handleSearch" plain>搜索</el-button>
                <el-button size="small" type="info" icon="Refresh" @click="handleReset" plain>重置</el-button>
             </el-form-item>
        </el-form>

        <div>
            <el-button size="small" v-perm="'btn.friendlink.add'" type="primary" icon="Plus" @click="handleAdd" plain>新增友链</el-button>
            <el-button size="small" v-perm="'btn.friendlink.remove'" type="danger" icon="Delete" :dark="isDark" @click="handleBatchDelete()" plain>批量删除</el-button>
        </div>
    </div>

    <!-- ===== 数据表格 ===== -->
    <el-table :data="tableData" style="width: 100%" ref="multipleTableRef" @selection-change="handleSelectionChange">
        <el-table-column type="selection" :selectable="selectable" width="55" />
        <el-table-column prop="name" label="名字" />
        <el-table-column label="logo">
            <template #default="{row}">
                <el-image style="width: 100px; height: 100px" :src="handleImage(row)" :fit="fit" />
            </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="address" label="地址" />
        <el-table-column label="状态">
            <template #default="{row}">
                <el-button size="small" type="primary" plain v-if="row.status === '0'">已通过</el-button>
                <el-button size="small" type="danger"  plain v-if="row.status === '1'">已驳回</el-button>
                <el-button size="small" type="warning" plain v-if="row.status === '2'">待审核</el-button>
            </template>
        </el-table-column>

        <el-table-column v-if="showPermColumn(['btn.friendlink.update', 'btn.friendlink.remove'])" label="操作">
            <template #default="{row}">
                <el-button v-perm="'btn.friendlink.update'" @click="handleEdit(row)" size="small" type="warning" icon="Edit" circle plain ></el-button>
                <el-popconfirm :title="`你确定要删除${row.name}吗`" @confirm="handleDelete(row.id)" width="250px" icon="WarnTriangleFilled">
                    <template #reference>
                        <el-button v-perm="'btn.friendlink.remove'" size="small" type="danger" icon="Delete" circle plain ></el-button>
                    </template>
                </el-popconfirm>
            </template>
        </el-table-column>
    </el-table>

    <!-- ===== 分页 ===== -->
    <el-pagination
        size="small"
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[2, 5, 7, 10]"
        layout="jumper, sizes, total, ->, prev, pager, next"
        :total="totalCount"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: flex-end;"
    />

    <!-- ===== 新增/编辑弹窗 ===== -->
    <el-dialog v-model="dialogVisible" :title="title" width="30%">
        <el-form ref="ruleFormRef" :model="formModel" :rules="rules" label-width="auto"
                status-icon size="small">
            <el-form-item prop="name">
                <el-input :prefix-icon="User" placeholder="请输入名字" v-model="formModel.name" />
            </el-form-item>

            <el-form-item prop="description">
                <el-input :prefix-icon="User" placeholder="请输入描述" v-model="formModel.description" />
            </el-form-item>

            <el-form-item prop="logo">
                <el-input :prefix-icon="User" placeholder="请输入logo地址" v-model="formModel.logo" />
            </el-form-item>

            <el-form-item prop="address">
                <el-input :prefix-icon="User" placeholder="请输入网站地址" v-model="formModel.address" />
            </el-form-item>

            <el-form-item style="width: 200px">
                <SmartSelector v-model="formModel.status" :data="statusOptions" placeholder="请选择审核状态"></SmartSelector>
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
import { friendLinkAddApi, friendLinkListApi, friendLinkModifyApi, friendLinkRemoveApi } from '@/api/friendlink';
import { showPermColumn } from '@/utils/permissions';
import SmartSelector from '@/views/components/SmartSelector.vue';
import msg from '@/components/msg';
import { reactive, ref } from 'vue';
import avatar from '@/assets/images/avatar-square.png'

// ============================================================
// 数据
// ===========================================================
const tableData = ref([])

const totalCount = ref(null)

const pagination = reactive({
    pageNum:1,
    pageSize:5
})

const searchModel = reactive({})

const dialogVisible = ref(false)
const title = ref('')

const formModel = reactive({})
const ruleFormRef = ref(null)

// 审核状态选项
const statusOptions = [
    {label:'请选择审核状态', value:''},
    {label:'已通过', value:'0'},
    {label:'已驳回', value:'1'},
    {label:'待审核', value:'2'},
]

const selectedRows = ref([])

// 处理图片
const handleImage = (row) => {
    if(row.logo) return row.logo
    else return avatar
}

// ============================================================
// 友链渲染
// ============================================================
/**
 * 请求后端分页数据并刷新表格
 */
const fetchFriendLinks = async() => {
    const res = await friendLinkListApi(pagination.pageNum,pagination.pageSize,searchModel)
    tableData.value = res.data.items
    totalCount.value = res.data.total
}

fetchFriendLinks()

/**
 * 每页条数变化时，重置到第一页并重新渲染
 * @param {number} size - 新的每页条数
 */
const handleSizeChange = (size) => {
    pagination.pageNum = 1
    pagination.pageSize = size
    fetchFriendLinks()
}

/**
 * 当前页码变化时重新渲染
 * @param {number} page - 新的页码
 */
const handlePageChange = (page) => {
    pagination.pageNum = page
    fetchFriendLinks()
}

/**
 * 表格勾选变化
 * @param {Array} raw - 当前选中的行数据
 */
const handleSelectionChange = (raw) => {
    selectedRows.value = raw
}

// ============================================================
// 友链搜索和重置
// ============================================================

/**
 * 搜索：重置到第一页，携带当前搜索条件请求数据
 */
const handleSearch = () =>{
    pagination.pageNum = 1
    fetchFriendLinks()
}

/**
 * 重置：清空所有搜索条件，回到第一页
 */
const handleReset = () => {
    pagination.pageNum = 1
    Object.assign(searchModel,{id:null,keyword:'',status:''})
    fetchFriendLinks()
}


// ============================================================
// 友链新增
// ============================================================

/**
 * 打开新增对话框，清空表单并设置默认值
 */
const handleAdd = async() => {
    dialogVisible.value = true
    title.value = '新增友链'
    // 等待对话框渲染完成，否则 resetFields 可能不生效
    await nextTick()
    ruleFormRef.value?.resetFields()
    Object.assign(formModel,{
        id:null,
        name:'',
        description:'',
        logo:'',
        address:'',
        status:'0'
    })
}

// ============================================================
// 友链编辑
// ============================================================

/**
 * 打开编辑对话框，回填当前行数据
 * @param {Object} row - 当前行的友链数据
 */
const handleEdit = async(row) => {
    dialogVisible.value = true
    title.value = '编辑友链'
    // 等待对话框渲染完成，否则 resetFields 可能不生效
    await nextTick()
    // 重置后再回填，避免残留上一次的校验状态
    ruleFormRef.value?.resetFields()
    Object.assign(formModel,row)
}

// ============================================================
// 表单校验
// ============================================================

/**
 * 表单校验规则
 */
const rules = {
    name:[
      { required: true, message: '请输入名字', trigger: 'blur' },
      {pattern:/^\S{2,20}$/,message:'名字必须是 2-20 位的非空字符',trigger:'blur' },
    ],
    description:[
        { required: true, message: '请输入描述', trigger: 'blur' },
        { pattern: /^\S{2,50}$/, message: '描述必须是 2-50 位的非空字符', trigger: 'blur' },
    ],
    logo:[
        { required: true, message: '请输入logo地址', trigger: 'blur' },
        {pattern:/^(((ht|f)tps?):\/\/)?([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/,
            message:'非法网址',
            trigger: 'blur'
        }
    ],
    address:[
        { required: true, message: '请输入网站地址', trigger: 'blur' },
        {pattern:/^(((ht|f)tps?):\/\/)?([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/,
            message:'非法网址',
            trigger: 'blur'
        } 
    ]
}

// ============================================================
// 友链保存
// ============================================================

/**
 * 表单提交：根据 formModel.id 判断新增或编辑
 */
const handleConfirm = async() => {
    await ruleFormRef.value.validate()
    try {
        if(!formModel.id){
            await friendLinkAddApi(formModel)
        }else {
            await friendLinkModifyApi(formModel)
        }
        msg.primary('操作成功')
        dialogVisible.value = false
        fetchFriendLinks()
    } catch (error) {
        msg.error('操作失败')
        dialogVisible.value = false
    }
}

// ============================================================
// 友链删除
// ============================================================

/**
 * 批量删除选中的友链
 */
const handleBatchDelete = async() => {
    if(selectedRows.value.length === 0){
        msg.error('请先勾选要删除的行')
        return
    }
    await ElMessageBox.confirm('你确认要进行删除么','温馨提示', {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
    })
    const rowIds = selectedRows.value.map(row => row.id)
    await handleDelete(rowIds)
}

/**
 * 删除友链（供单行删除和批量删除复用）
 * @param {number|number[]} id - 单个 ID 或 ID 数组
 */
const handleDelete = async(id) =>{
       await friendLinkRemoveApi(id)
       msg.primary('操作成功')
       fetchFriendLinks()
}
</script>

<style scoped lang="scss">

</style>