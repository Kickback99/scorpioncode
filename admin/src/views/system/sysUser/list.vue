<template>
    <el-collapse class="search-collapse" v-model="searchActiveNames">
        <el-collapse-item title="" name="search">
            <div class="layout">
                <el-form
                    inline
                    ref="formRef"
                    label-width="auto"
                    class="demo-ruleForm"
                    size="small"
                    status-icon
                    >
                    <el-form-item>
                    <el-input prefix-icon="User"  placeholder="请输入用户名 | 呢称 | 手机号" v-model="searchData.keyword"/><br>
                    </el-form-item>

                    <el-form-item>
                        <UserTypeSelect v-model="searchData.type"></UserTypeSelect>
                    </el-form-item>

                    <!-- 排序字段选择器（SmartSelector） -->
                    <el-form-item>
                        <SmartSelector v-model="searchData.sortField" :data="fields" style="width: 200px;" placeholder="请选择排序(默认创建时间)">
                        </SmartSelector>
                    </el-form-item>

                    <!-- 升序/降序按钮 -->
                    <el-form-item>
                        <el-button size="small" :type="searchData.sortOrder === 'ASC' ? 'primary' : ''" icon="Top" @click="setSortOrder('ASC')" circle plain />
                        <el-button size="small" :type="searchData.sortOrder === 'DESC' ? 'primary' : ''" icon="Bottom" @click="setSortOrder('DESC')" circle plain />
                    </el-form-item>

                    <br>

                    <!-- 时间字段选择器 -->
                    <el-form-item>
                        <el-select v-model="searchData.timeField" placeholder="请选择时间" style="width: 120px">
                            <el-option label="请选择时间" value="" :disabled="true" />
                            <el-option label="创建时间" value="create_time" />
                            <el-option label="修改时间" value="update_time" />
                        </el-select>
                    </el-form-item>

                    <!-- 日期时间范围选择器（带 shortcuts） -->
                    <el-form-item>
                        <el-date-picker
                            v-model="dataTimeRange"
                            type="datetimerange"
                            :shortcuts="shortcuts"
                            range-separator="至"
                            start-placeholder="开始日期时间"
                            end-placeholder="结束日期时间"
                            :popper-options="{
                                placement: 'bottom-start'
                            }"
                            :size="default"
                            @change="updateDataTime"
                        />
                    </el-form-item>

                    <el-form-item>
                    <el-button size="small" type="primary" icon="Search" @click="onSearch" plain>搜索</el-button>
                    <el-button size="small" type="info" icon="Refresh" @click="onReset" plain>重置</el-button>
                    </el-form-item>
                </el-form>
                <div class="right">
                    <el-button size="small" type="danger" @click="deleteSelectRows()" v-perm="'btn.sysUser.remove'" icon="Delete" plain>批量删除</el-button>
                    <el-button size="small" type="primary" @click="addDialog" v-perm="'btn.sysUser.add'" icon="Plus" plain>新增</el-button>
                </div>
            </div>
        </el-collapse-item>
    </el-collapse>





    <!-- 表格 -->
    <el-table 
    v-loading="loading"
    :data="tableData" 
    style="width: 100%"
    ref="multipleTableRef"
    @selection-change="removeMultiple"
    stripe="1"
    border
    >
        <el-table-column type="selection" :selectable="selectable" width="55" />
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column label="头像" align="center">
            <template #default="{row}">
                <el-image style="width: 50px; height: 50px" :src="handleImage(row)" :fit="fit" />
            </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" align="center" show-overflow-tooltip/>
        <el-table-column prop="nickname" label="呢称" align="center" />
        <el-table-column prop="roleNames" label="用户角色" align="center" show-overflow-tooltip/>
        <el-table-column prop="phone" label="手机"  width="130" align="center"/>
        <el-table-column label="类型" align="center ">
            <template #default="{row}">
                {{ row.type === 0 ? '后台':'前台' }}
            </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center">
            <template #default="{row}">
                <el-switch v-model="row.status" size="small" :active-value="0" :inactive-value="1" @change="modifySwitch(row)"/>
            </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" align="center" width="185"/>
        <el-table-column prop="updateTime" label="修改时间" align="center" width="185" />
        <el-table-column v-if="showPermColumn(['btn.sysUser.update', 'btn.sysUser.remove', 'btn.sysUser.assignRole'])" label="操作" width="200" align="center" >
            <template #default="{row,$index}">
            <el-button size="small" type="warning" v-perm="'btn.sysUser.update'" @click="editDialog(row)" plain>编辑</el-button>
            <el-popconfirm :title="`你确定要删除${row.username}吗`" @confirm="removeUsers(row.id)" width="250px" icon="WarnTriangleFilled">
                <template #reference>
                    <el-button size="small" type="danger" v-perm="'btn.sysUser.remove'" plain>删除</el-button>
                </template>
            </el-popconfirm>
            <el-button size="small" type="success" v-perm="'btn.sysUser.assignRole'" @click="showAllocRoles(row)" plain>分配</el-button>
            </template>
        </el-table-column>
    </el-table>

    <!-- 用户新增和修改弹层 -->
    <el-dialog v-model="dialogVisible" :title="title" width="30%">
        <el-form ref="ruleFormRef" :model="formData" :rules="rules"  class="demo-ruleForm"
            size="small" status-icon label-width="100px" style="padding-right: 35px;">
            <el-form-item label="用户名" prop="username">
                <el-input prefix-icon="User" placeholder="请输入用户名" v-model="formData.username" />
            </el-form-item>

            <el-form-item label="呢称" prop="nickname">
                <el-input prefix-icon="UserFilled" placeholder="请输入呢称" v-model="formData.nickname" />
            </el-form-item>

            <el-form-item label="手机号" prop="phone">
                <el-input prefix-icon="Iphone" placeholder="请输入手机号" v-model="formData.phone" />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
                <el-input prefix-icon="Message" placeholder="请输入邮箱" v-model="formData.email" />
            </el-form-item>

            <el-form-item label="用户类型">
                <UserTypeSelect v-model="formData.type" style="width: 100%;"></UserTypeSelect>
            </el-form-item>

            <el-form-item v-perm="'btn.sysUser.assignRole'" label="用户角色">
                <SmartAutoComplete
                    v-model="selectedRoleName"
                    :fetch-suggestions-api="fetchRoles"
                    :placeholder="hasPerm('btn.sysUser.assignRole') ? '请输入角色名搜索' : '无操作权限'"
                    :max="10"
                    :debounce-delay="300"
                    :min-search-length="1"
                    :allow-custom="false"
                    custom-disabled-message="请选择已存在的角色"
                    :auto-search-on-enter="true"
                    :disabled="formData.id === 1 || !hasPerm('btn.sysUser.assignRole')"
                    style="width: 100%"
                />
            </el-form-item>

        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button size="small" type="primary" @click="title==='新增用户'?addUser():modifyUser()" plain>确认</el-button>
                <el-button size="small" type="info" @click="dialogVisible = false" plain>
                    取消
                </el-button>
            </span>
        </template>
    </el-dialog>

    <!-- 用户分配角色弹层 -->
    <el-dialog v-model="allocRolesVisible" title="分配角色" >
        <el-form  :model="formData" label-width="80px" class="demo-ruleForm"
            size="small" status-icon>
            <el-form-item label="用户名">
                <el-input prefix-icon="User" disabled v-model="formData.username" />
            </el-form-item>

            <el-form-item label="角色列表">
                <el-checkbox
                    v-model="checkAll"
                    :indeterminate="isIndeterminate"
                    :disabled="isRolesLocked"
                    @change="handleCheckAllChange"
                    >
                    全选
                </el-checkbox>
                <el-checkbox-group
                v-model="checkedCities"
                :disabled="isRolesLocked"
                @change="handleCheckedCitiesChange"
                >
                <el-checkbox v-for="role in allRoles" :key="role.id" :label="role.id" :disabled="isRolesLocked">
                    {{ role.roleName }}
                </el-checkbox>
                </el-checkbox-group>
                </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button size="small" type="primary" @click="doAllocRoles" plain>确认</el-button>
                <el-button size="small" type="info" @click="allocRolesVisible = false" plain>
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
import {listApi,addApi,removeApi,modifyApi,statusApi,getDetailApi} from '@/api/sysuser'
import { hasPerm, showPermColumn } from '@/utils/permissions'
import {allocRolesApi,doAllocRolesApi} from '@/api/sysrole'
import UserTypeSelect from '@/views/components/UserTypeSelect.vue';
import SmartAutoComplete from '@/views/components/SmartAutoComplete.vue';
import { getAllRolesApi } from '@/api/business'
import PinyinMatch from 'pinyin-match'
import { nextTick, ref, watch } from 'vue';
import msg from '@/components/msg';
// 按钮级别权限控制
import { getCurrentInstance } from 'vue';
import { useUserStore } from '@/store/user';
import { useConfigStore } from '@/store/config';
import { useTabStore } from '@/store/tabs';
const {auth} = getCurrentInstance()
import { clearRoute } from '@/utils/remove';
import { loadMenu } from '@/router';
import { useRouter, useRoute } from 'vue-router';
import SmartSelector from '@/views/components/SmartSelector.vue';
import { dayjs } from 'element-plus';
import avatar from '@/assets/images/avatar-square.png'

const handleImage = (row) => {
    if(row.id === userStore.userInfo.id){
        return userStore.userInfo.avatar
    }else if(row.avatar){
        return row.avatar
    }else return avatar
}

const params = ref({
    pageNum :1,
    pageSize : 10
})

const total = ref(null)


// 默认关闭loading
const loading = ref(false)

//搜索相关
const searchData = ref({
    sortOrder: 'ASC', // 默认升序
    timeField: 'create_time', // 默认按创建时间筛选
})


const onSearch = () =>{
    params.value.pageNum = 1
    render()
}

//重置
const onReset = () => {
    params.value.pageNum = 1
    searchData.value = {}
    searchData.value = {
        sortOrder: 'ASC',
        timeField: 'create_time',
    }
    dataTimeRange.value = [] // 清空日期范围
    render()
}

const tableData = ref([])

// t_user_request：用户列表请求
const render = async(pager = 1) =>{
    // 开启loading动效
    loading.value = true
    params.value.pageNum =  pager
    const res =  await listApi(params.value.pageNum,params.value.pageSize,searchData.value)
    console.log('请求用户列表-------------------------------------------')
    console.log(res.data)
    tableData.value = res.data.items
    total.value = res.data.total
    // 关闭loading动效
    loading.value = false
}

render()


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

// 批量删除相关
const multipleTableRef = ref()
const multipleSelection = ref([])

const removeMultiple = (raw) =>{
    console.log(raw)
    multipleSelection.value = raw
    // console.log(multipleSelection.value)
}

// 清空表格
const toggleSelection = (rows) => {
  if (rows) {
    rows.forEach((row) => {
      // TODO: improvement typing when refactor table
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      multipleTableRef.value.toggleRowSelection(row, undefined)
    })
  } else {
    multipleTableRef.value.clearSelection()
  }
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
    removeUsers(rowIds)

}

// t_user_request：用户删除请求
const removeUsers = async(ids) =>{
    await removeApi(ids)
    msg.primary('删除成功')
    render(tableData.value.length > 1 ? params.value.pageNum : params.value.pageNum -1)
}

//  t_user_request：更改用户状态请求
const modifySwitch = async(row) =>{
    await statusApi(row.id,row.status)
    row.status === 0 ? msg.primary('用户已激活'):msg.error('用户已禁用')
    render()
}


//弹层相关
const dialogVisible = ref(false)

const defaultData = {
    username:'',
    nickname:'',
    phone:'',
    email:'',
    type:"0"
}

const formData = ref({

})

const title = ref('')

// 角色搜索相关
const roleCache = ref([])
const selectedRoleName = ref([])
const selectedRoleIds = ref([])

/**
 * 加载所有角色列表（用于 SmartAutoComplete 联想搜索）
 */
const loadAllRoles = async () => {
    const res = await getAllRolesApi()
    const items = res.data || []
    roleCache.value = items.map(item => ({ value: item.role_name, id: item.id }))
}

/**
 * 联想搜索角色（对齐 notice/list.vue fetchUsers 模式）
 */
const fetchRoles = async (params) => {
    const query = params.keyword || ''
    if (hasPerm('btn.sysUser.assignRole') && roleCache.value.length === 0) {
        await loadAllRoles()
    }
    if (!query) return roleCache.value

    const lowerQuery = query.toLowerCase()
    return roleCache.value.filter(item => {
        const text = item.value
        if (text.toLowerCase().includes(lowerQuery)) return true
        if (PinyinMatch.match(text, query)) return true
        return false
    })
}

/**
 * 监听选中角色名变化 -> 反查 roleCache 同步所有角色 ID
 */
watch(selectedRoleName, (names) => {
    // 无分配角色权限时不联动角色 ID（保留 editDialog 回显的原角色 ID，防止提交清空角色）
    if (!hasPerm('btn.sysUser.assignRole')) return
    selectedRoleIds.value = (names || [])
        .map(name => roleCache.value.find(r => r.value === name))
        .filter(Boolean)
        .map(r => r.id)
}, { deep: true })

// 预加载角色数据（供新增/编辑弹窗使用）
if (hasPerm('btn.sysUser.assignRole')) loadAllRoles()

//校验相关
const ruleFormRef = ref(null)

    //新增弹层
const addDialog = () =>{
    dialogVisible.value = true
    title.value = '新增用户'
    formData.value = {...defaultData}
    selectedRoleName.value = []
    selectedRoleIds.value = []
    // 重置上一次的表单验证
    nextTick(()=>{
        ruleFormRef.value.clearValidate('username')
        ruleFormRef.value.clearValidate('nickname')
        ruleFormRef.value.clearValidate('phone')
        ruleFormRef.value.clearValidate('email')
    })
}

/**
 * 编辑用户：加载完整详情（含角色）后回显
 */
const editDialog = async (row) =>{
    try {
        const res = await getDetailApi(row.id)
        const user = res.data

        // 详情加载成功后再打开弹窗，避免权限不足时出现空白编辑框
        dialogVisible.value = true
        title.value = '编辑用户'
        formData.value = {
            id: user.id,
            username: user.username || '',
            nickname: user.nickname || '',
            phone: user.phone || '',
            email: user.email || '',
            type: (user.type !== undefined ? user.type : 0).toString()
        }
        // 角色回显
        if (hasPerm('btn.sysUser.assignRole')) {
            if (roleCache.value.length === 0) await loadAllRoles()
            if (row.id === 1) {
                // admin 回显全部角色并禁用（对齐分配角色弹窗行为）
                selectedRoleName.value = roleCache.value.map(r => r.value)
            } else {
                const roleIds = user.roleIdList || []
                if (roleIds.length > 0) {
                    selectedRoleName.value = roleIds
                        .map(id => roleCache.value.find(r => r.id === id))
                        .filter(Boolean)
                        .map(r => r.value)
                } else {
                    selectedRoleName.value = []
                }
            }
        } else {
            // 无分配角色权限：不回显角色名称，仅保留原角色 ID 原样提交（防止提交空角色清空用户角色）
            selectedRoleName.value = []
            selectedRoleIds.value = user.roleIdList || []
        }
    } catch (e) {
        // request.js 已统一提示接口错误，这里不重复弹错误
    }
    // 重置上一次的表单验证
    nextTick(()=>{
        ruleFormRef.value.clearValidate('username')
        ruleFormRef.value.clearValidate('nickname')
        ruleFormRef.value.clearValidate('phone')
        ruleFormRef.value.clearValidate('email')
    })
}

// t_user_request：用户添加请求
const addUser = async() =>{
    await ruleFormRef.value.validate()
    // 有角色时必须是后台用户
    if (selectedRoleIds.value.length > 0 && formData.value.type !== '0') {
        msg.error('已选角色仅限后台用户，请将用户类型切换为"后台"')
        return
    }
    formData.value.roleIdList = selectedRoleIds.value
    await addApi(formData.value)
    dialogVisible.value = false
    msg.primary('添加成功')
    render()

}

// t_user_request：用户修改请求
const modifyUser = async() => {
    await ruleFormRef.value.validate()
    // 有角色时必须是后台用户
    if (selectedRoleIds.value.length > 0 && formData.value.type !== '0') {
        msg.error('已选角色仅限后台用户，请将用户类型切换为"后台"')
        return
    }
    // admin 不修改角色
    if (formData.value.id !== 1) {
        formData.value.roleIdList = selectedRoleIds.value
    }
    await modifyApi(formData.value)
    dialogVisible.value = false
    msg.primary('修改成功')
    render(params.value.pageNum)
}





// 绑定表单校验规则
const rules = {
    username : [    
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 15, message: '用户名必须是 3-15位 的字符', trigger: 'blur' },
  ],
    nickname : [
      { required: false, trigger: 'blur' },
      { pattern:/^\S{2,15}$/,message:'呢称必须是 2-15位 的非空字符',trigger:'blur'}
    ],

    phone : [
      { required: false, trigger: 'blur' },
      { pattern:/^(?:(?:\+|00)86)?1[3-9]\d{9}$/,message:'手机号码格式错误',trigger:'blur'}
    ],

    email : [
      { required: false, trigger: 'blur' },
      { pattern:/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,message:'邮箱格式错误',trigger:'blur'}
    ],
  }

// 分配角色相关


const checkAll = ref(false) //控制大复选框的全选和半选
const isIndeterminate = ref(false) //判断当前状态是否半选
const checkedCities = ref([]) //选中的数组集合
const allRoles = ref([]) //全部的数组集合
const allocRolesVisible = ref(false)
const isRolesLocked = ref(false) //角色复选框是否禁用（id=1的admin用户）

// t_user_request：获取用户角色数据请求
const showAllocRoles = async(row) =>{
    formData.value.username = row.username
    formData.value.id = row.id
    allocRolesVisible.value = true
    const res = await allocRolesApi(row.id)
    // 把所有角色集合赋值给 allRoles
    allRoles.value = res.data.allRoles
    if (row.id === 1) {
        // admin 用户：全选所有角色并禁用
        checkedCities.value = allRoles.value.map(item => item.id)
        checkAll.value = true
        isIndeterminate.value = false
        isRolesLocked.value = true
    } else {
        // 把对应用户id的角色ids存入 checkedCities
        checkedCities.value = res.data.userRoleIds
        checkAll.value = allRoles.value.length === checkedCities.value.length
        isIndeterminate.value = checkedCities.value.length > 0 && checkedCities.value.length < allRoles.value.length
        isRolesLocked.value = false
    }
    console.log(checkedCities.value)
}

  //大复选框的事件回调
  const handleCheckAllChange = (val) => {
    console.log(val)
    checkedCities.value = val ? allRoles.value.map(item => item.id) : []
    isIndeterminate.value = false
  }
  //小复选框的事件回调
  const handleCheckedCitiesChange = (value) => {
    console.log(value)
    const checkedCount = value.length
    checkAll.value = checkedCount === allRoles.value.length && allRoles.length>0
    isIndeterminate.value = checkedCount > 0 && checkedCount < allRoles.value.length
  }

const userStore = useUserStore()
const configStore = useConfigStore()
const tabStore = useTabStore()

// 搜索面板折叠：优先读 tabStore 保存的偏好，无记录时回退 configStore 默认值
const route = useRoute()
const saved = tabStore.collapseStates[route.path]
const searchActiveNames = ref(
    saved !== undefined ? saved : (configStore.getCollapseSearchEnabled() ? [] : ['search'])
)
watch(searchActiveNames, (val) => {
    tabStore.setCollapseState(route.path, val)
})
const router =  useRouter()

// t_user_request：为用户分配角色请求
const doAllocRoles = async() => {
    let userRoleData = {
        userId:formData.value.id,
        roleIdList: checkedCities.value
    }

    await doAllocRolesApi(userRoleData)
    msg.primary("分配角色成功")
    allocRolesVisible.value = false
    /* if(userStore.userInfo.id != 1){
        // 清空路由
        clearRoute(userStore.userMenu)
        // 重新加载路由配置文件和pinia数据
        try {
          await loadMenu(false)
        } catch (error) {
          msg.error(error)
          //重新加载菜单方式一
          router.push('/')
          userStore.removeUserAuth()

          //重新加载菜单方式二
          router.push('/').then(()=>{
            window.location.reload()
          })
        }
    } */
    render()

}

// 排序相关
// 设置排序方向
const setSortOrder = (order) => {
    searchData.value.sortOrder = order
}

// 排序字段选项
const fields = ref([
    { label: '请选择排序(默认创建时间)', value: '' },
    { label: '用户名', value: 'username' },
    { label: '呢称', value: 'nickname' },
    { label: '创建时间', value: 'create_time' },
    { label: '修改时间', value: 'update_time' },
])

// 监听 timeField 变化，重新生成时间参数
watch(() => searchData.value.timeField, () => {
    // 如果当前有日期范围，重新生成对应的时间参数
    if (dataTimeRange.value && dataTimeRange.value.length === 2) {
        regenerateTimeParams()
    }
})

// 日期时间范围相关
const dataTimeRange = ref([])

// shortcuts 快捷选项
const shortcuts = [
    {
        text: "今天",
        value: () => {
            const now = new Date()
            const start = new Date(now)
            start.setHours(0, 0, 0, 0)
            return [start, now]
        }
    },
    {
        text: "昨天",
        value: () => {
            const end = new Date()
            end.setHours(0, 0, 0, 0)
            const start = new Date(end)
            start.setDate(start.getDate() - 1)
            return [start, end]
        }
    },
    {
        text: "最近一周",
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - 7)
            return [start, end]
        }
    },
    {
        text: "上周",
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            return [start, end]
        }
    },
    {
        text: "上个月",
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            return [start, end]
        }
    },
    {
        text: "三个月前",
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            return [start, end]
        }
    }
]

// 日期范围更新处理
const updateDataTime = (range) => {
    if (!range || range.length !== 2) {
        // 清空日期时，清空所有时间参数
        searchData.value.createTimeBegin = null
        searchData.value.createTimeEnd = null
        searchData.value.updateTimeBegin = null
        searchData.value.updateTimeEnd = null
        return
    }

    // 根据当前 timeField 设置对应的时间参数
    const beginTime = dayjs(range[0]).format('YYYY-MM-DD HH:mm:ss')
    const endTime = dayjs(range[1]).format('YYYY-MM-DD HH:mm:ss')

    if (searchData.value.timeField === 'create_time') {
        searchData.value.createTimeBegin = beginTime
        searchData.value.createTimeEnd = endTime
        searchData.value.updateTimeBegin = null
        searchData.value.updateTimeEnd = null
    } else {
        searchData.value.updateTimeBegin = beginTime
        searchData.value.updateTimeEnd = endTime
        searchData.value.createTimeBegin = null
        searchData.value.createTimeEnd = null
    }
}

// 根据当前日期范围和 timeField 重新生成时间参数
const regenerateTimeParams = () => {
    const range = dataTimeRange.value
    if (!range || range.length !== 2) return

    const beginTime = dayjs(range[0]).format('YYYY-MM-DD HH:mm:ss')
    const endTime = dayjs(range[1]).format('YYYY-MM-DD HH:mm:ss')

    if (searchData.value.timeField === 'create_time') {
        searchData.value.createTimeBegin = beginTime
        searchData.value.createTimeEnd = endTime
        searchData.value.updateTimeBegin = null
        searchData.value.updateTimeEnd = null
    } else {
        searchData.value.updateTimeBegin = beginTime
        searchData.value.updateTimeEnd = endTime
        searchData.value.createTimeBegin = null
        searchData.value.createTimeEnd = null
    }
}

</script>

<style lang="scss" scoped>
.layout {
    display: flex;
    justify-content: space-between;
}
</style>
