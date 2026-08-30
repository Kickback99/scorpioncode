<!-- src/views/online-user/list.vue -->
<template>
    <div>
        <!-- 筛选区域 -->
        <div class="flex justify-between items-center">
            <el-form ref="formRef" :model="searchModel" label-width="auto" inline size="small">
                <el-form-item>
                    <el-input v-model="searchModel.keyword" placeholder="请输入用户名" clearable />
                </el-form-item>
                <el-form-item style="width: 223px">
                    <SmartSelector v-model="searchModel.role" :data="roleOptions" placeholder="请选择用户类型" />
                </el-form-item>
                <el-form-item>
                    <el-button size="small" type="primary" icon="Search" @click="onSearch" plain>搜索</el-button>
                    <el-button size="small" type="info" icon="Refresh" @click="onReset" plain>重置</el-button>
                </el-form-item>
            </el-form>
            <div>
                <el-button v-perm="'btn.onlineuser.execute'" size="small" type="primary" @click="cleanZombieUsers" plain>清理僵尸用户</el-button>
            </div>
        </div>

        <!-- 表格 -->
        <el-table :data="filteredTableData" style="width: 100%" stripe align="center">
            <el-table-column label="头像" width="80" align="center">
                <template #default="{ row }">
                    <el-avatar 
                        :src="row.avatar || avatar" 
                        :size="40"
                        :fit="'cover'"
                    />
                </template>
            </el-table-column>
            <el-table-column prop="username" label="用户名" min-width="120" />
            <el-table-column prop="roleName" label="用户类型" min-width="100">
                <template #default="{row}">
                    <el-button size="small" :type="row.role === 'admin' ? 'danger' : 'primary'" plain>
                        {{row.userId === "1" && row.role === "admin" ? '超级管理员' : row.roleName }}
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column prop="ip" label="IP地址" min-width="130" />
            <el-table-column prop="os" label="操作系统" min-width="120" />
            <el-table-column prop="browser" label="浏览器" min-width="100" />
            <el-table-column prop="location" label="登录地点" min-width="100" />
            <el-table-column prop="loginTime" label="登录时间" min-width="160" />
            <el-table-column v-if="showPermColumn(['btn.onlineuser.execute'])" label="操作" fixed="right">
                <template #default="{row}">
                    <el-popconfirm :title="`确定要强制踢出 ${row.username} 吗？`" @confirm="handleKick(row)">
                        <template #reference>
                        <el-button
                            size="small"
                            type="primary"
                            :loading="kickingMap[row.userId + '_' + row.role]"
                            v-perm="'btn.onlineuser.execute'" :disabled="kickingMap[row.userId + '_' + row.role]"
                            plain
                            >
                            {{ kickingMap[row.userId + '_' + row.role] ? '强退中' : '强退' }}
                        </el-button>
                        </template>
                    </el-popconfirm>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <el-pagination
            size="small"
            v-model:current-page="pagination.pageNum"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[2, 5, 7, 10]"
            layout="jumper, sizes, total, ->, prev, pager, next"
            :total="total"
            @size-change="onSizeChange"
            @current-change="onCurrentChange"
            style="margin-top: 20px; justify-content: flex-end;"
        />
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import msg from '@/components/msg'
import SmartSelector from '@/views/components/SmartSelector.vue'
import { showPermColumn } from '@/utils/permissions'
import { cleanZombieApi, getOnlineListApi, kickUserApi } from '@/api/onlineUser'
import websocketManager from '@/server/websocketManager'
import avatar from '@/assets/images/avatar-circle.png'

// 数据
const allTableData = ref([])      // 原始数据（来自 WebSocket）
const searchModel = reactive({
    keyword: '',
    role: ''
})
const pagination = reactive({
    pageNum: 1,
    pageSize: 10
})

// 筛选后的数据（用于表格展示）
const filteredTableData = ref([])
const total = ref(0)

// 用户类型选项
const roleOptions = [
    { label: '全部', value: '' },
    { label: '后台管理员', value: 'admin' },
    { label: '前台用户', value: 'user' }
]

// 记录每行的 loading 状态（用对象）
const kickingMap = ref({})

// 处理数据更新（统一重置 loading）
const resetKickingMap = () => {
    kickingMap.value = {}
}

// 处理数据更新
const updateOnlineUsers = (data) => {
    if (data && data.type === 'online_users_update') {
        allTableData.value = [...data.data]
        updateFilteredData()

        // 收到新的在线列表时，清理所有 loading 状态
        // 因为表格数据已更新，之前的 loading 已经无意义
        resetKickingMap()
    }
}

// WebSocket 自定义事件处理
const handleOnlineUsersUpdate = (event) => {
    console.log('list.vue 收到 WebSocket 推送:', event.detail)
    updateOnlineUsers(event.detail)
}

// 更新筛选和分页数据
const updateFilteredData = () => {
    let filtered = [...allTableData.value]
    
    // 按用户名筛选
    if (searchModel.keyword) {
        filtered = filtered.filter(item => 
            item.username && item.username.includes(searchModel.keyword)
        )
    }
    
    // 按角色筛选
    if (searchModel.role) {
        filtered = filtered.filter(item => item.role === searchModel.role)
    }
    
    total.value = filtered.length
    
    // 分页
    const start = (pagination.pageNum - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    filteredTableData.value = filtered.slice(start, end)
}

// 搜索
const onSearch = () => {
    pagination.pageNum = 1
    updateFilteredData()
}

// 重置
const onReset = () => {
    searchModel.keyword = ''
    searchModel.role = ''
    pagination.pageNum = 1
    updateFilteredData()
}

// 分页事件
const onSizeChange = () => {
    pagination.pageNum = 1
    updateFilteredData()
}

const onCurrentChange = () => {
    updateFilteredData()
}

// 强退
const handleKick = async (row) => {

    // 超级管理员不能踢出自己
    if (row.userId === "1" && row.role === 'admin') {
        msg.warning('超级管理员不能踢出自己')
        return
    }

    const key = `${row.userId}_${row.role}`
    
    // 如果已经在 loading，直接返回
    if (kickingMap.value[key]) return
    
    // 设置 loading 状态
    kickingMap.value[key] = true

    try {
        await kickUserApi(row.userId, row.role)
        msg.primary(`已向 ${row.username} 发送强退指令`)
    } catch (error) {
        msg.error('强退失败')
        // 失败时才清除 loading，因为行还在
        kickingMap.value[key] = false
    }
}

// 监听 WebSocket 消息

// 主动加载在线列表（HTTP 拉取）
const loadOnlineList = async () => {
    try {
        const res = await getOnlineListApi()
        console.log('📊 HTTP 主动加载在线列表:', res.data)
        // 兼容接口返回格式：假设 res.data 是 { data: [...], total: ... }
        const onlineData = res.data.data || res.data || []
        allTableData.value = onlineData
        updateFilteredData()
        resetKickingMap() 
    } catch (error) {
        console.error('加载在线列表失败:', error)
    }
}

const cleaning = ref(false)

const cleanZombieUsers = async () => {
    cleaning.value = true
    try {
        const res = await cleanZombieApi()
        msg.primary(res.message || `已清理 ${res.data.count} 个僵尸用户`)
        // 刷新列表
        await loadOnlineList()
    } catch (error) {
        msg.error('清理失败')
    } finally {
        cleaning.value = false
    }
}

// 监听 window 上的自定义事件
onMounted(() => {
    
    // console.log('list.vue 挂载')

    // 1. 取缓存（解决管理端刷新问题）
    const cached = websocketManager.getCachedOnlineUsers()
    if (cached) {
        console.log('📦 使用缓存数据')
        updateOnlineUsers(cached)
    }else {
        loadOnlineList() // 主动请求后端接口
    }

    // 2. 监听后续推送（解决用户端登录问题）
    window.addEventListener('online-users-update', handleOnlineUsersUpdate)

    // console.log('已添加 WebSocket 监听')

})

onUnmounted(() => {
    // console.log('list.vue 卸载，移除监听')
    window.removeEventListener('online-users-update', handleOnlineUsersUpdate)
})
</script>

<style scoped lang="scss">
.mt-4 {
    margin-top: 16px;
}
</style>