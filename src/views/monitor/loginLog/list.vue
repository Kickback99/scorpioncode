<template>
    <!-- ===== 搜索栏 ===== -->
    <el-collapse class="search-collapse" v-model="searchActiveNames">
        <el-collapse-item title="" name="search">
    <div class="toolbar">
        <el-form label-width="auto" inline size="small">
            <el-form-item>
                <el-input v-model="searchData.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item>
                <UserTypeSelect v-model="searchData.type"></UserTypeSelect>
            </el-form-item>
            <el-form-item>
                <el-select v-model="searchData.status" placeholder="请选择操作状态">
                    <!-- 遍历所有状态选项 -->
                    <el-option
                    v-for="item in statusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                    :disabled="disabledStatusOptions.includes(item.value)"
                    />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-input v-model="searchData.ip" placeholder="请输入 IP 地址" />
            </el-form-item>
            <el-form-item>
                <el-input v-model="searchData.os" placeholder="请输入操作系统" />
            </el-form-item>
            <el-form-item>
                <el-input v-model="searchData.browser" placeholder="请输入浏览器" />
            </el-form-item>
            <el-form-item>
                <el-input v-model="searchData.location" placeholder="请输入操作地点" />
            </el-form-item>
            <el-form-item>
                <el-date-picker
                    v-model="searchData.createTimeBegin"
                    type="date"
                    placeholder="选择开始日期"
                    value-format="YYYY-MM-DD"
                    :disabled-date="(date) => searchData.createTimeEnd ? date > new Date(searchData.createTimeEnd) : false"
                />
                <span style="margin: 0 8px">至</span>
                <el-date-picker
                    v-model="searchData.createTimeEnd"
                    type="date"
                    placeholder="选择结束日期"
                    value-format="YYYY-MM-DD"
                    :disabled-date="(date) => searchData.createTimeBegin ? date < new Date(searchData.createTimeBegin) : false"
                />
            </el-form-item>
            <el-form-item>
                <el-button size="small" type="primary" icon="Search" @click="handleSearch" plain>搜索</el-button>
                <el-button size="small" type="info" icon="Refresh" @click="handleReset" plain>重置</el-button>
            </el-form-item>
            <!-- 批量删除顶到行尾，与搜索/重置拉开距离，避免误点 -->
            <el-form-item class="toolbar-actions-right">
                <el-button size="small" type="danger" icon="Delete" @click="handleBatchDelete" plain>批量删除</el-button>
            </el-form-item>
        </el-form>
    </div>
        </el-collapse-item>
    </el-collapse>

    <!-- ===== 数据表格 ===== -->
    <el-table v-loading="loading" :data="tableData" :style="{ width: '100%' }" :max-height="tableMaxHeight"  @selection-change="handleSelectionChange">
        <el-table-column type="selection" :selectable="selectable" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="username" label="用户名" min-width="110" />
        <el-table-column  label="用户类型" min-width="100" align="center">
            <template #default="{row}">
                {{ row.type === 0 ? '后台用户':'前台用户' }}
            </template>
        </el-table-column>
        <el-table-column prop="status" label="操作状态" min-width="100" align="center">
            <template #default="{row}">
                <el-tag type="success" size="small" v-if="row.status === 0">{{ statusMap[row.status] || '未知状态' }}</el-tag>
                <el-tag type="primary" size="small" v-if="row.status === 1">{{ statusMap[row.status] || '未知状态' }}</el-tag>
                <el-tag type="danger" size="small" v-if="row.status === 2">{{ statusMap[row.status] || '未知状态' }}</el-tag>
                <el-tag type="warning" size="small" v-if="row.status === 3">{{ statusMap[row.status] || '未知状态' }}</el-tag>
            </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP 地址" min-width="130" show-overflow-tooltip />
        <el-table-column prop="os" label="操作系统" min-width="120" show-overflow-tooltip />
        <el-table-column prop="browser" label="浏览器" min-width="100" show-overflow-tooltip />
        <el-table-column prop="location" label="操作地点" min-width="120" show-overflow-tooltip />
        <el-table-column label="Token" min-width="150" show-overflow-tooltip>
            <template #default="{row}">
                <div style="display: flex; align-items: center; gap: 8px">
                    <span style="overflow: hidden; text-overflow: ellipsis">
                        {{ row.token ? `${row.token.substring(0, 6)}...${row.token.substring(row.token.length - 4)}` : '' }}
                    </span>
                    <el-icon
                        v-if="row.token"
                        style="cursor: pointer; transition: all 0.3s"
                        @click="handleCopy(row.token, row.id)"
                        :class="copiedId === row.id ? 'copiedStyle' : 'copyStyle'"
                    >
                        <component :is="copiedId === row.id ? 'Check' : 'CopyDocument'" />
                    </el-icon>
                </div>
            </template>
        </el-table-column>
        <el-table-column prop="createTime" label="操作时间" min-width="200" align="center" />
        <el-table-column label="操作" width="150" align="center">
            <template #default="{row}">
                <el-popconfirm :title="`你确定要删除这条数据吗`" @confirm="handleDelete(row.id)" width="250px" icon="WarnTriangleFilled">
                    <template #reference>
                        <el-button size="small" type="danger" icon="Delete" circle plain />
                    </template>
                </el-popconfirm>
            </template>
        </el-table-column>
    </el-table>

    <!-- ===== 分页 ===== -->
    <el-pagination
        size="small"
        v-model:current-page="params.pageNum"
        v-model:page-size="params.pageSize"
        :page-sizes="[2, 5, 7, 10]"
        layout="jumper, sizes, total, ->, prev, pager, next"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: flex-end;"
    />

</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import UserTypeSelect from '@/views/components/UserTypeSelect.vue';
import msg from '@/components/msg';
import { loginLogListApi, loginLogRemoveApi } from '@/api/log';
import { useSearchCollapse } from '@/utils/useSearchCollapse';
import { useTableAutoHeight } from '@/utils/useTableAutoHeight';

// 搜索面板折叠：标签页偏好优先，无偏好回退总开关
const { searchActiveNames } = useSearchCollapse()

// 表格高度自适应：扣除搜索面板与分页占位，保证页面永不溢出
const { tableMaxHeight } = useTableAutoHeight()

// ============================================================
// 数据
// ============================================================
const searchData = reactive({})

// 日期只选到"天"，而 create_time 是 datetime：补时分秒后再比较，否则结束日当天会被整天漏掉
const queryParams = computed(() => ({
    ...searchData,
    createTimeBegin: searchData.createTimeBegin ? `${searchData.createTimeBegin} 00:00:00` : '',
    createTimeEnd: searchData.createTimeEnd ? `${searchData.createTimeEnd} 23:59:59` : ''
}))

// 登录状态映射（对齐后端 LoginLogEnum）
const statusMap = { 0: '登录', 1: '注册', 2: '退出', 3: '注销' }

// 登录状态下拉选项（对齐后端 LoginLogEnum）
const statusOptions = [
    { label: '登录', value: '0' },
    { label: '注册', value: '1' },
    { label: '退出', value: '2' },
    { label: '注销', value: '3' }
]

const tableData = ref([])

const params = ref({
    pageNum:1,
    pageSize:10
})

const total = ref(null)

// 默认关闭loading
const loading = ref(false)

const multipleSelection = ref([])

const copiedId = ref(null) // 记录当前已复制的行ID

// 计算属性：返回需要禁用的选项值
const disabledStatusOptions = computed(() => {
  if (searchData.type === undefined || searchData.type === null) {
    return [];
  }
  if (searchData.type === '1') {
    return [];
  }
  if (searchData.type === '0') {
    return ['1', '3']; // 后台用户无注册/注销操作
  }
  return [];
});

watch(() => searchData.type, (newType) => {
  searchData.status = null; // 清空已选类型
});

// ============================================================
// 渲染
// ============================================================
// t_log_request：日志列表请求
const fetchLoginLogList = async() => {
    // 开启loading动效
    loading.value = true
    try {
        const res = await loginLogListApi(params.value.pageNum,params.value.pageSize,queryParams.value)
        tableData.value = res.data.items
        total.value = res.data.total
    } catch (e) {
    } finally {
        // 关闭loading动效
        loading.value = false
    }
}

fetchLoginLogList()

//点击分页事件
const handleSizeChange = (size) => {
    //console.log(`handleSizeChange：每页显示${size}条`)
    //每页条数发生变化时，重新从第一页渲染
    params.value.pageNum = 1
    //更新每页条数
    params.value.pageSize = size
    //重新渲染
    fetchLoginLogList()
}

const handlePageChange = (page) => {
    //console.log(`handlePageChange：当前第${page}页`)
    //更新当前页
    params.value.pageNum = page
    //重新渲染
    fetchLoginLogList()
}

// 表格勾选变化
const handleSelectionChange = (raw) =>{
    console.log(raw)
    multipleSelection.value = raw
    // console.log(multipleSelection.value)
}

// 复制到剪贴板的方法
/* const copyToClipboard = (text) => {
  try {
    navigator.clipboard.writeText(text)
    msg.primary('复制成功')
  } catch (err) {
    // 兼容性处理
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    msg.primary('复制成功')
  }
} */

const handleCopy = (text, id) => {
  try {
    navigator.clipboard.writeText(text)
    copiedId.value = id // 设置当前复制的行ID

    msg.primary('复制成功')

    // 3秒后恢复原图标
    setTimeout(() => {
      if (copiedId.value === id) {
        copiedId.value = null
      }
    }, 3000)
  } catch (err) {
    // 兼容性处理
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copiedId.value = id

    setTimeout(() => {
      if (copiedId.value === id) {
        copiedId.value = null
      }
    }, 3000)
  }
}

// ============================================================
// 搜索和重置
// ============================================================
const handleSearch = () => {
    params.value.pageNum = 1
    fetchLoginLogList()
}

const handleReset = () => {
    params.value.pageNum = 1
    searchData.value = {}
    Object.assign(searchData,{username:'',type:null,status:null,ip:'',os:'',browser:'',location:'',createTimeBegin:'',createTimeEnd:''})
    fetchLoginLogList()
}

// ============================================================
// 删除
// ============================================================
// t_log_request：登录日志删除请求
const handleDelete = async(id) => {
    await loginLogRemoveApi(id)
    msg.primary('删除成功')
    fetchLoginLogList()
}

// t_log_request：登录日志批量删除请求
const handleBatchDelete = async() => {
    console.log(multipleSelection.value.length)
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
   await handleDelete(rowIds)
}

</script>

<style lang="scss" scoped>
.toolbar {
    @include flex(space-between,null,null)
}

// 换行交给 flex：搜索/重置紧跟日期选择器留在同一行，批量删除再由 margin-left 顶到行尾
:deep(.el-form--inline) {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
}

// 右间距归零是为了抵消 el-form--inline 给每个 form-item 的 32px（否则批量删除离右边界差一截）
:deep(.el-form--inline .toolbar-actions-right) {
    margin-left: auto;
    margin-right: 0;
}

:deep(.copyStyle){
    color: var(--el-text-color-primary)
}

:deep(.copiedStyle){
    color: var(--el-text-color-primary)
}
</style>
