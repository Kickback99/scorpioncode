<template>
    <!-- 工具条 -->
    <div class="toolbar">
        <el-form
        inline
        :model="formData"
        label-width="120px"
        class="demo-ruleForm"
        size="small"
        status-icon
        >
        <el-form-item  prop="roleName">
        <el-input prefix-icon="User"  placeholder="请输入角色名 | 角色编码" v-model="searchData.roleName"/><br>
        </el-form-item>


        <el-form-item>
        <el-button size="small" type="primary" icon="Search" @click="onSearch" plain>搜索</el-button>
        <el-button size="small" type="info" icon="Refresh" @click="onReset" plain>重置</el-button>
        </el-form-item>
        </el-form>
        <div class="right">
            <el-button size="small" type="danger" icon="Search" @click="deleteSelectRows()" plain>批量删除</el-button>
            <el-button size="small" type="primary" v-perm="'btn.sysRole.add'" @click="addDialog" icon="Plus" plain>新增</el-button>
        </div>
    </div>

    <!-- 表格 -->
    <el-table 
    v-loading="loading"
    :data="tableData" 
    style="width: 100%" 
    @selection-change="removeMultiple"
    border stripe>
        <el-table-column type="selection" :selectable="selectable" width="55" />
        <el-table-column type="index" label="序号" width="55" />
        <el-table-column prop="roleName" label="角色名称" />
        <el-table-column prop="roleCode" label="角色编码" />
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column v-if="showPermColumn(['btn.sysRole.update', 'btn.sysRole.remove', 'btn.sysRole.assignAuth'])" label="操作" width="200">
            <template #default="{row,$index}">
            <el-button size="small" type="warning" v-perm="'btn.sysRole.update'" @click="editDialog(row)" plain>编辑</el-button>
            <el-popconfirm :title="`你确定要删除${row.roleName}吗`" @confirm="removeRole(row.id)" width="250px" icon="WarnTriangleFilled">
                <template #reference>
                    <el-button size="small" type="danger" v-perm="'btn.sysRole.remove'" plain>删除</el-button>
                </template>
            </el-popconfirm>
            <el-button size="small" type="success" v-perm="'btn.sysRole.assignAuth'" @click="showAssignAuth(row)" plain>授权</el-button>
            </template>
        </el-table-column>
    </el-table>

    <!-- 弹层 -->
    <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="30%"
    >
        <!-- 弹层内容 -->
        <el-form 
        :model="dialogData" 
        label-width="120px" 
        ref="ruleFormRef"
        size="small"  
        :rules="rules" style="padding-right: 40px;">
            <el-form-item label="角色名称" prop="roleName">
                <el-input v-model="dialogData.roleName" placeholder="请输入角色名称"/>
            </el-form-item>
            <el-form-item label="角色编码" prop="roleCode">
                <el-input v-model="dialogData.roleCode" placeholder="请输入角色编码"/>
            </el-form-item>
            <el-form-item label="关联用户">
                <SmartAutoComplete
                    v-model="selectedUserNames"
                    :fetch-suggestions-api="fetchUsers"
                    placeholder="请输入用户名|昵称搜索"
                    :max="10"
                    :debounce-delay="300"
                    :min-search-length="1"
                    :allow-custom="false"
                    custom-disabled-message="请选择已存在的用户"
                    :auto-search-on-enter="true"
                    style="width: 100%"
                />
            </el-form-item>
        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button size="small" type="primary" @click="title === '新增角色'?addRole():modifyRole()" plain>确认</el-button>
                <el-button size="small" type="info" @click="dialogVisible = false" plain>
                    取消
                </el-button>
            </span>
        </template>
    </el-dialog>

    <!-- 分页 -->
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
        
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';
import {listApi,addApi,modifyApi,removeApi,getDetailApi} from '@/api/sysrole'
import { showPermColumn } from '@/utils/permissions'
import { ElMessageBox } from 'element-plus';
import router, { loadMenu } from '@/router';
import msg from '@/components/msg'
import SmartAutoComplete from '@/views/components/SmartAutoComplete.vue';
import { getAllUsersApi } from '@/api/business'
import PinyinMatch from 'pinyin-match'
const tableData = ref([])

const searchData = ref({})
// 分页相关
const params = ref({
    pageNum:1,
    pageSize:5,
})

const total = ref(null)

// 默认关闭loading
const loading = ref(false)


// t_role_request：角色列表请求
const render = async(pager = 1) => {
    // 开启loading动效
    loading.value = true
    params.value.pageNum =  pager
    const res = await listApi(params.value.pageNum,params.value.pageSize,searchData.value)
    tableData.value = res.data.items
    console.log(res.data.items)
    console.log('表格数据')
    total.value = res.data.total
    // 关闭loading动效
    loading.value = false
}

render()

// 用户搜索相关
const userCache = ref([])
const selectedUserNames = ref([])
const selectedUserIds = ref([])

const loadAllUsers = async () => {
    const res = await getAllUsersApi()
    const items = res.data || []
    userCache.value = items.map(item => ({ value: item.displayName || item.username, id: item.id }))
}

const fetchUsers = async (params) => {
    const query = params.keyword || ''
    if (userCache.value.length === 0) await loadAllUsers()
    if (!query) return userCache.value
    const lowerQuery = query.toLowerCase()
    return userCache.value.filter(item => {
        const text = item.value
        if (text.toLowerCase().includes(lowerQuery)) return true
        if (PinyinMatch.match(text, query)) return true
        return false
    })
}

watch(selectedUserNames, (names) => {
    selectedUserIds.value = (names || [])
        .map(name => userCache.value.find(u => u.value === name))
        .filter(Boolean)
        .map(u => u.id)
}, { deep: true })

// 预加载用户数据
loadAllUsers()

//点击分页事件
const onSizeChange = (size) => {
    //console.log(`onSizeChange：每页显示${size}条`)
    //每页条数发生变化时，重新从第一页渲染
    // params.value.pageNum = 1
    //更新每页条数
    params.value.pageSize = size
    //重新渲染
    render()
}

const onCurrentChange = (page) => {
    //console.log(`onCurrentChange：当前第${size}页`)
    //更新当前页
    // params.value.pageNum = page
    //重新渲染
    render(page)
}

// t_role_request：删除角色请求
const removeRole = async(id) =>{
    await removeApi(id)
    msg.primary('删除成功')
    //重新渲染
    render(tableData.value.length > 1 ? params.value.pageNum : params.value.pageNum -1)

}

const multipleSelection = ref([])

const removeMultiple = (raw) =>{
    console.log(raw)
    multipleSelection.value = raw
    // console.log(multipleSelection.value)
}

// 批量删除
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
   removeRole(rowIds)

}


// 参数搜索
const onSearch = () => {
    params.value.pageNum = 1
    render()
}

//重置
const onReset = () => {
    searchData.value.roleName = ''
    render()
}

    // 校验相关
    const ruleFormRef = ref(null)

// 弹层相关

    const dialogVisible = ref(false)
    const dialogData = ref({})
    const title = ref('')

    // 新增角色弹层

    const addDialog = () => {
        dialogVisible.value = true
        title.value = '新增角色'
        dialogData.value = {}
        selectedUserNames.value = []
        selectedUserIds.value = []
        // 重置上一次的表单验证
        nextTick(()=>{
            ruleFormRef.value.clearValidate("roleName")
            ruleFormRef.value.clearValidate("roleCode")
        })
    }

/**
 * 编辑角色：加载完整详情（含用户）后回显
 */
const editDialog = async (row) => {
    try {
        const res = await getDetailApi(row.id)
        const role = res.data

        // 详情加载成功后再打开弹窗，避免权限不足时出现空白编辑框
        dialogVisible.value = true
        title.value = '编辑角色'
        dialogData.value = {
            id: role.id,
            roleName: role.roleName || '',
            roleCode: role.roleCode || ''
        }
        // 用户回显
        if (userCache.value.length === 0) await loadAllUsers()
        const userIds = role.userIdList || []
        if (userIds.length > 0) {
            selectedUserNames.value = userIds
                .map(id => userCache.value.find(u => u.id === id))
                .filter(Boolean)
                .map(u => u.value)
        } else {
            selectedUserNames.value = []
        }
    } catch (e) {
        // request.js 已统一提示接口错误，这里不重复弹错误
    }
    // 重置上一次的表单验证
    nextTick(()=>{
        ruleFormRef.value.clearValidate("roleName")
        ruleFormRef.value.clearValidate("roleCode")
    })
}


    // 新增角色请求
    // t_role_request：新增角色请求
    const addRole = async() => {
        await ruleFormRef.value.validate()
        dialogData.value.userIdList = selectedUserIds.value
        const res = await addApi(dialogData.value)
        console.log('增加请求')
        console.log(res)
        dialogVisible.value = false
        msg.primary('添加成功')
        render()

    }

    // 修改角色请求
    // t_role_request：修改角色请求
    const modifyRole = async() =>{
        await ruleFormRef.value.validate()
        dialogData.value.userIdList = selectedUserIds.value
        await modifyApi(dialogData.value)
        dialogVisible.value = false
        msg.primary('修改成功')
        render(params.value.pageNum)

    }



    // 绑定表单校验规则
    const rules = {
        roleName : [    
        { required: true, message: '请输入角色名称', trigger: 'blur' },
        {pattern:/^\S{1,7}$/, message: '角色名必须是 1- 7 位非空字符', trigger: 'blur' },
    ],
        roleCode : [
        { required: false, message: '请输入角色编码', trigger: 'blur' },
        { pattern:/^[a-zA-Z0-9]{1,10}$/,message:'角色编码 必须是 1-10 位的字母或数字',trigger:'blur'}
        ],
    }

//跳转到分配菜单权限路由页面
const showAssignAuth = (row) =>{
    const path = `/system/assignAuth?id=${row.id}&roleName=${row.roleName}`
    const resolved = router.resolve(path)
    // 路由未注册时（初次登录异步竞态），强制重走 loadMenu 后跳转
    if (!resolved.matched.length) {
      loadMenu(false).finally(() => router.push(path))
      return
    }
    router.push(path)
}

</script>

<style lang="scss" scoped>
.toolbar {
    display: flex;
    justify-content: space-between
}
</style>