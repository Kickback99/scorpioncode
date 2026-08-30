<template>
    <!-- ===== 搜索栏 ===== -->
    <el-collapse class="search-collapse" v-model="searchActiveNames">
        <el-collapse-item title="" name="search">
    <el-form ref="formRef" :model="searchModel" label-width="auto" inline size="small">
        <!-- 第一排：基础筛选 -->
        <el-form-item>
            <el-input v-model="searchModel.keyword" placeholder="请输入公告内容" clearable style="width:180px" />
        </el-form-item>
        <el-form-item>
            <SmartSelector v-model="searchModel.status" :data="statusOptions" style="width:140px" placeholder="请选择状态" />
        </el-form-item>
        <el-form-item>
            <SmartSelector v-model="searchModel.type" :data="typeOptions" style="width:140px" placeholder="请选择消息类型" />
        </el-form-item>
        <el-form-item>
            <SmartSelector v-model="searchModel.targetType" :data="targetTypeOptions" style="width:140px" placeholder="请选择推送范围" />
        </el-form-item>
        <br />

        <!-- 第二排：排序 + 时间筛选 -->
        <el-form-item>
            <SmartSelector v-model="searchModel.sortField" :data="sortFieldOptions" style="width:160px" placeholder="请选择排序" />
        </el-form-item>
        <el-form-item>
            <el-button size="small" :type="sortOrder === 'ASC' ? 'primary' : ''" icon="Top" @click="setSortOrder('ASC')" circle plain />
            <el-button size="small" :type="sortOrder === 'DESC' ? 'primary' : ''" icon="Bottom" @click="setSortOrder('DESC')" circle plain />
        </el-form-item>
        <el-form-item>
            <SmartSelector v-model="searchModel.timeField" :data="timeFieldOptions" style="width:130px" placeholder="请选择时间" />
        </el-form-item>
        <el-form-item>
            <SmartSelector v-model="quickDate" :data="quickDateOptions" style="width:130px" placeholder="快捷日期" />
        </el-form-item>
        <el-form-item>
            <el-date-picker
                v-model="startTime"
                type="datetime"
                placeholder="开始时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                :clearable="true"
                style="width:190px"
                @change="(val) => { applyTimeParams(); handleSearch() }"
            />
        </el-form-item>
        <el-form-item>
            <el-date-picker
                v-model="endTime"
                type="datetime"
                placeholder="结束时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                :clearable="true"
                style="width:190px"
                @change="(val) => { applyTimeParams(); handleSearch() }"
            />
        </el-form-item>
        <br />

        <!-- 第四排：操作按钮 -->
        <el-form-item>
            <el-button size="small" type="primary" icon="Search" @click="handleSearch" plain>搜索</el-button>
            <el-button size="small" type="info" icon="Refresh" @click="handleReset" plain>重置</el-button>
        </el-form-item>
        <el-form-item style="float:right">
            <el-button v-perm="'btn.notice.add'" size="small" type="primary" icon="Plus" @click="handleAdd" plain>新增公告</el-button>
            <el-button v-perm="'btn.notice.remove'" size="small" type="danger" icon="Delete" @click="handleBatchDelete" plain>批量删除</el-button>
        </el-form-item>
    </el-form>
        </el-collapse-item>
    </el-collapse>

    <!-- ===== 数据表格 ===== -->
    <el-table :data="tableData" style="width: 100%" ref="multipleTableRef" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" width="150" show-overflow-tooltip />
        <el-table-column prop="content" label="公告内容" show-overflow-tooltip />
        <el-table-column label="消息类型" width="100">
            <template #default=" { row} ">
                <el-button v-if="!row.type" type="primary" size="small" plain>普通</el-button>
                <el-button v-else type="warning" size="small" plain>富文本</el-button>
            </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" align="center">
            <template #default="{ row }">
                <el-button size="small" type="info" v-if="row.status === 0">草稿</el-button>
                <el-button size="small" type="success" v-if="row.status === 1">已推送</el-button>
                <el-button size="small" type="success" v-if="row.status === 2">已下架</el-button>
            </template>
        </el-table-column>
        <el-table-column label="推送范围" width="120">
            <template #default="{ row }">
                <el-button v-if="row.targetType === 1" type="primary" size="small">前台用户</el-button>
                <el-button v-else-if="row.targetType === 2" type="warning" size="small">后台管理员</el-button>
                <el-button v-else-if="row.targetType === 3" type="success" size="small">全部</el-button>
                <el-button v-else type="info" size="small">未设置</el-button>
            </template>
        </el-table-column>
        <el-table-column prop="createByName" label="创建者" width="120" />
        <el-table-column prop="pushTime" label="推送时间" width="200" />
        <el-table-column prop="createTime" label="创建时间" width="200" />
        <el-table-column prop="updateTime" label="更新时间" width="200" />

        <el-table-column v-if="showPermColumn(['btn.notice.execute', 'btn.notice.update', 'btn.notice.list', 'btn.notice.remove'])" label="操作" width="320" fixed="right">
            <template #default="{ row }">
                <!-- 推送按钮 -->
                <el-button
                    v-if="(row.status === 0 || row.status === 2) && !row.pushTime"
                    v-perm="'btn.notice.execute'"
                    size="small"
                    type="success"
                    icon="Position"
                    @click="handlePush(row)"
                    plain
                >推送</el-button>

                <!-- 下架按钮 -->
                <el-button 
                    v-if="row.status === 0 || row.status === 1"
                    v-perm="'btn.notice.update'"
                    size="small" 
                    type="warning" 
                    icon="Bottom" 
                    @click="handleOffline(row)" 
                    plain
                >下架</el-button>

                <!-- 上架按钮 -->
                <el-button 
                    v-if="row.status === 2"
                    v-perm="'btn.notice.update'"
                    size="small" 
                    type="primary" 
                    icon="Top" 
                    @click="handleOnline(row)" 
                    plain
                >上架</el-button>

                <!-- 编辑 / 详情 -->
                <el-button v-if="row.status === 0 || row.status === 2" v-perm="'btn.notice.update'" size="small" type="warning" icon="Edit" @click="handleEdit(row)" plain>编辑</el-button>
                <el-button v-else v-perm="'btn.notice.list'" size="small" type="info" :icon="View" @click="handleDetail(row)" plain>详情</el-button>

                <!-- 删除 -->
                <el-popconfirm
                    :title="`你确定要删除该公告吗？`"
                    @confirm="handleDelete(row)"
                    width="250px"
                    icon="WarnTriangleFilled"
                >
                    <template #reference>
                        <el-button v-perm="'btn.notice.remove'" size="small" type="danger" icon="Delete" plain>删除</el-button>
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
        :page-sizes="[5, 10, 20, 50]"
        layout="jumper, sizes, total, ->, prev, pager, next"
        :total="totalCount"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: flex-end;"
    />

    <!-- ===== 新增/编辑弹窗 ===== -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="55%">
        <el-form ref="ruleFormRef" :model="formModel" :rules="rules" label-width="auto" status-icon size="small">
            
            <!-- 公告标题 -->
            <el-form-item prop="title" label="公告标题">
                <el-input
                    v-model="formModel.title"
                    placeholder="请输入公告标题"
                    maxlength="100"
                    show-word-limit
                    :disabled="isReadonly"
                />
            </el-form-item>

            <!-- 消息类型（el-radio-group） -->
            <el-form-item prop="type" label="消息类型">
                <template #label>
                    消息类型
                    <el-tooltip content="普通文本适合简短通知，富文本支持 Markdown 格式" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                    </el-tooltip>
                </template>
                <el-radio-group v-model="formModel.type" @change="handleTypeChange" :disabled="isReadonly">
                    <el-radio :value="0">普通</el-radio>
                    <el-radio :value="1">富文本</el-radio>
                </el-radio-group>
            </el-form-item>

            <!-- 公告内容（根据 type 切换） -->
            <el-form-item prop="content" label="公告内容">
                <!-- 普通文本模式 -->
                <el-input
                    v-if="formModel.type === 0"
                    v-model="formModel.content"
                    type="textarea"
                    :rows="6"
                    placeholder="请输入公告内容"
                    maxlength="2000"
                    show-word-limit
                    :disabled="isReadonly"
                />
                <!-- 富文本模式（可编辑） -->
                <Markdown
                    v-else-if="!isReadonly"
                    :model-value="formModel.content"
                    @update:model-value="(val) => formModel.content = val"
                    :height="400"
                    upload-handler="notice"
                />
                <!-- 富文本模式（只读 → MarkdownPreview） -->
                <div v-else :class="{ 'dark-mode': userConfigStore.isDarkEnabled }" class="detail-panel">
                    <component :is="MarkdownPreview" :text="formModel.content" @click="handleCopyCodeSuccess" />
                </div>
            </el-form-item>

            <!-- 推送范围 -->
            <el-form-item prop="targetType" label="推送范围">
                <template #label>
                    推送范围
                    <el-tooltip content="选择公告的推送目标用户" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                    </el-tooltip>
                </template>
                <el-radio-group v-model="formModel.targetType" @change="handleTargetTypeChange" :disabled="isReadonly || !!formModel.pushTime">
                    <el-radio :value="1">前台用户</el-radio>
                    <el-radio :value="2">后台管理员</el-radio>
                    <el-radio :value="3">全部</el-radio>
                </el-radio-group>
            </el-form-item>

            <!-- 后台指定用户（推送范围=后台时显示） -->
            <el-form-item v-if="formModel.targetType === 2" label="目标用户">
                <el-radio-group v-model="targetUserType" @change="handleTargetUserTypeChange" :disabled="isReadonly || !!formModel.pushTime">
                    <el-radio value="all">所有用户</el-radio>
                    <el-radio value="role">指定角色</el-radio>
                    <el-radio value="specific">指定用户</el-radio>
                </el-radio-group>
            </el-form-item>

            <el-form-item v-if="formModel.targetType === 2 && targetUserType === 'specific'" label=" " prop="specifiedUsers">
                <SmartAutoComplete
                    ref="userAutoCompleteRef"
                    v-model="selectedUserNames"
                    :fetch-suggestions-api="fetchUsers"
                    placeholder="请输入用户名|昵称搜索"
                    :max="10"
                    :debounce-delay="300"
                    :min-search-length="1"
                    :allow-custom="false"
                    custom-disabled-message="请输入已存在的用户名|呢称"
                    :auto-search-on-enter="true"
                    :disabled="isReadonly || !!formModel.pushTime"
                    style="width: 100%"
                />
            </el-form-item>

            <!-- 指定角色 -->
            <el-form-item v-if="formModel.targetType === 2 && targetUserType === 'role'" label=" " prop="specifiedRoles" v-perm.disable="'btn.sysUser.assignRole'">
                <SmartAutoComplete
                    ref="roleAutoCompleteRef"
                    v-model="selectedRoleNames"
                    :fetch-suggestions-api="fetchRoles"
                    :placeholder="hasPerm('btn.sysUser.assignRole') ? '请输入角色名称搜索' : '无操作权限'"
                    :max="10"
                    :debounce-delay="300"
                    :min-search-length="1"
                    :allow-custom="false"
                    custom-disabled-message="请输入已存在的角色"
                    :auto-search-on-enter="true"
                    :disabled="isReadonly || !!formModel.pushTime || !hasPerm('btn.sysUser.assignRole')"
                    :locked-tags="formModel.pushTime ? selectedRoleNames : []"
                    style="width: 100%"
                />
            </el-form-item>

            <!-- 状态（仅编辑时显示，只读） -->
            <el-form-item v-if="formModel.id" label="状态">
                <el-tag v-if="formModel.status === 0" type="info" size="small">草稿</el-tag>
                <el-tag v-else-if="formModel.status === 1" type="success" size="small">已推送</el-tag>
                <el-tag v-else-if="formModel.status === 2" type="danger" size="small">已下架</el-tag>
            </el-form-item>

        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button v-if="!isReadonly" size="small" type="primary" @click="handleConfirm" plain>确认</el-button>
                <el-button size="small" type="info" @click="dialogVisible = false" plain>关闭</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, watch, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import SmartSelector from '@/views/components/SmartSelector.vue'
import { hasPerm, showPermColumn } from '@/utils/permissions'
import SmartAutoComplete from '@/views/components/SmartAutoComplete.vue'
import msg from '@/components/msg'
import Markdown from '@/components/Markdown.vue'  // 引入 Markdown 组件
import {
    noticeListApi,
    noticeAddApi,
    noticeUpdateApi,
    noticeRemoveApi,
    noticeOnlineApi,
    noticeOfflineApi,
    noticePushApi,
    noticeDetailApi
} from '@/api/notice'
import { View } from '@element-plus/icons-vue'
import { getAllUsersApi, getAllRolesApi } from '@/api/business'
import { createMarkdownPreview } from '@/utils/markdown-config'
import { useUserConfigStore } from '@/store/userConfig'
import { useConfigStore } from '@/store/config'
import { useTabStore } from '@/store/tabs'
import { useRoute } from 'vue-router'
import PinyinMatch from 'pinyin-match'
import dayjs from 'dayjs'

// ============================================================
// 数据
// ============================================================
const startTime = ref('')
const endTime = ref('')
const quickDate = ref('')
const quickDateOptions = [
    { label: '快捷日期', value: '', disabled: true },
    { label: '今天', value: 'today' },
    { label: '昨天', value: 'yesterday' },
    { label: '最近一周', value: 'week' },
    { label: '最近一月', value: 'month' }
]
// ============================================================
const tableData = ref([])
const totalCount = ref(0)

const pagination = reactive({
    pageNum: 1,
    pageSize: 10
})

const sortOrder = ref('DESC')

const searchModel = reactive({
    keyword: '',
    status: '',
    type: '',
    targetType: '',
    sortField: 'create_time',
    sortOrder: 'DESC',
    timeField: 'create_time',
    createTimeBegin: null,
    createTimeEnd: null,
    updateTimeBegin: null,
    updateTimeEnd: null,
    pushTimeBegin: null,
    pushTimeEnd: null
})

watch(sortOrder, (val) => { searchModel.sortOrder = val })

// 时间字段切换 → 重新映射时间范围
const clearTimeParams = () => {
    searchModel.createTimeBegin = null
    searchModel.createTimeEnd = null
    searchModel.updateTimeBegin = null
    searchModel.updateTimeEnd = null
    searchModel.pushTimeBegin = null
    searchModel.pushTimeEnd = null
}

const applyTimeParams = () => {
    clearTimeParams()
    switch (searchModel.timeField) {
        case 'push_time':
            searchModel.pushTimeBegin = startTime.value || null
            searchModel.pushTimeEnd = endTime.value || null
            break
        case 'update_time':
            searchModel.updateTimeBegin = startTime.value || null
            searchModel.updateTimeEnd = endTime.value || null
            break
        default:
            searchModel.createTimeBegin = startTime.value || null
            searchModel.createTimeEnd = endTime.value || null
    }
}

watch(() => searchModel.timeField, applyTimeParams)

const setQuickDate = (type) => {
    const now = new Date()
    let start = null
    let end = now
    switch (type) {
        case 'today':
            start = new Date(now)
            start.setHours(0, 0, 0, 0)
            break
        case 'yesterday':
            start = new Date(now); start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0)
            end = new Date(now); end.setHours(0, 0, 0, 0)
            break
        case 'week':
            start = new Date(now); start.setDate(start.getDate() - 7)
            break
        case 'month':
            start = new Date(now); start.setMonth(start.getMonth() - 1)
            break
    }
    startTime.value = start ? dayjs(start).format('YYYY-MM-DD HH:mm:ss') : ''
    endTime.value = end ? dayjs(end).format('YYYY-MM-DD HH:mm:ss') : ''
    applyTimeParams()
    handleSearch()
}

watch(quickDate, (val) => { if (val) setQuickDate(val) })

const dialogVisible = ref(false)
const dialogTitle = ref('')

const defaultModel = {
    id: null,
    title: '',
    content: '',
    type: 0,        // 0-普通 1-富文本
    targetType: 1,  // 1-前台用户 2-后台管理员 3-全部
    status: 0,      // 0-草稿 1-已推送 2-已下架
    pushTime: null  // 推送时间（用于判断是否曾推送过）
}

const formModel = reactive({ ...defaultModel })

// 消息类型切换的内容缓存：新增清空之前内容；编辑保留原始类型的内容
const originalType = ref(null)    // 弹窗打开时的消息类型（新增为 null）
const inactiveType = ref(null)    // 缓存内容所属的消息类型
const inactiveContent = ref('')   // 离开编辑器时缓存的内容

const ruleFormRef = ref(null)
const multipleTableRef = ref(null)
const selectedRows = ref([])
const userAutoCompleteRef = ref(null)

// 状态选项
const statusOptions = [
    { label: '全部状态', value: '' },
    { label: '草稿', value: '0' },
    { label: '已推送', value: '1' },
    { label: '已下架', value: '2' }
]

// 消息类型选项
const typeOptions = [
    { label: '全部类型', value: '' },
    { label: '普通', value: '0' },
    { label: '富文本', value: '1' }
]

// 推送范围选项
const targetTypeOptions = [
    { label: '全部范围', value: '' },
    { label: '前台用户', value: '1' },
    { label: '后台管理员', value: '2' },
    { label: '全部', value: '3' }
]

// 排序字段选项
const sortFieldOptions = [
    { label: '请选择排序', value: '', disabled: true },
    { label: '创建时间', value: 'create_time' },
    { label: '推送时间', value: 'push_time' },
    { label: '修改时间', value: 'update_time' },
    { label: '标题', value: 'title' },
    { label: '消息类型', value: 'type' },
    { label: '推送范围', value: 'target_type' },
    { label: '状态', value: 'status' }
]

// 时间字段选项
const timeFieldOptions = [
    { label: '请选择时间', value: '', disabled: true },
    { label: '创建时间', value: 'create_time' },
    { label: '推送时间', value: 'push_time' },
    { label: '修改时间', value: 'update_time' }
]

const setSortOrder = (order) => {
    sortOrder.value = order
    searchModel.sortOrder = order
}

watch(() => searchModel.timeField, (val) => {
    searchModel.timeBegin = startTime.value || null
})

// 后台指定用户相关
const targetUserType = ref('all')                    // 'all' | 'role' | 'specific'
const selectedUserNames = ref([])                    // SmartAutoComplete v-model（标签数组）
const selectedUserIds = ref([])                      // 选中的用户 ID 列表
const userCache = ref([])                            // 用户搜索结果缓存
const selectedRoleNames = ref([])                    // 角色 SmartAutoComplete v-model
const selectedRoleIds = ref([])                      // 选中的角色 ID 列表
const originalTargetRoleIds = ref([])                // 编辑回显的原角色 ID（无权限时提交兜底用）
const roleCache = ref([])                            // 角色搜索结果缓存
const roleAutoCompleteRef = ref(null)
const isReadonly = ref(false)                        // 只读模式（详情查看时）

// 推送范围/目标用户切换缓存：编辑只保留回显原类型的值，其余切换即清空
const originalTargetType = ref(null)         // 回显时的推送范围（新增为 null）
const originalTargetUserType = ref(null)     // 回显时的目标用户类型（新增为 null）
const targetCache = ref(null)                // 离开「后台管理员」时缓存的选择状态
const targetUserCache = ref(null)            // 离开原目标用户类型时缓存的选择
const prevTargetType = ref(null)             // 切换前的推送范围
const prevTargetUserType = ref(null)         // 切换前的目标用户类型

const userConfigStore = useUserConfigStore()
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

const MarkdownPreview = computed(() => {
  return createMarkdownPreview(userConfigStore.isDarkEnabled ? 'vuepress' : 'github', true)
})

/**
 * 加载后台用户列表（用于 SmartAutoComplete 联想搜索）
 */
const loadAllUsers = async () => {
    const res = await getAllUsersApi()
    const items = res.data || []
    userCache.value = items.map(item => ({
        value: item.displayName,
        id: item.id
    }))
}

/**
 * 联想搜索用户
 */
const fetchUsers = async (params) => {
    const query = params.keyword || ''
    if (userCache.value.length === 0) {
        await loadAllUsers()
    }
    if (!query) return userCache.value

    const lowerQuery = query.toLowerCase()
    return userCache.value.filter(item => {
        const text = item.value
        const lowerText = text.toLowerCase()
        if (lowerText.includes(lowerQuery)) return true
        // 拼音匹配
        if (PinyinMatch.match(text, query)) return true
        return false
    })
}

const loadAllRoles = async () => {
    const res = await getAllRolesApi()
    const items = res.data || []
    roleCache.value = items.map(item => ({
        value: item.role_name,
        id: item.id
    }))
}

/**
 * 联想搜索角色
 */
const fetchRoles = async (params) => {
    // 无角色权限时不加载角色数据（不调用 getAllRolesApi）
    if (!hasPerm('btn.sysUser.assignRole')) return []
    const query = params.keyword || ''
    if (roleCache.value.length === 0) {
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
 * 清空目标用户选择（回到「所有用户」）
 */
const clearTargetSelections = () => {
    targetUserType.value = 'all'
    selectedUserNames.value = []
    selectedUserIds.value = []
    selectedRoleNames.value = []
    selectedRoleIds.value = []
}

const handleTargetTypeChange = (val) => {
    const leftType = prevTargetType.value
    // 离开「后台管理员」：回显原范围为后台时缓存其选择状态，其余切换即清空
    if (leftType === 2) {
        if (leftType === originalTargetType.value) {
            targetCache.value = {
                targetUserType: targetUserType.value,
                roleNames: [...selectedRoleNames.value],
                userNames: [...selectedUserNames.value]
            }
        }
        clearTargetSelections()
        prevTargetUserType.value = 'all'
    }
    // 进入「后台管理员」：缓存命中则恢复，否则从默认状态开始
    if (val === 2) {
        if (targetCache.value) {
            targetUserType.value = targetCache.value.targetUserType
            selectedRoleNames.value = [...targetCache.value.roleNames]
            selectedUserNames.value = [...targetCache.value.userNames]
        } else {
            clearTargetSelections()
        }
        prevTargetUserType.value = targetUserType.value
    }
    prevTargetType.value = val
    nextTick(() => ruleFormRef.value?.clearValidate(['specifiedUsers', 'specifiedRoles']))
}

const handleTargetUserTypeChange = (val) => {
    const leftType = prevTargetUserType.value
    // 编辑：离开回显原目标用户类型时保留其选择；新增及其他类型的选择切换即清空
    if (leftType === originalTargetUserType.value && leftType !== 'all') {
        targetUserCache.value = {
            type: leftType,
            names: [...(leftType === 'role' ? selectedRoleNames.value : selectedUserNames.value)]
        }
    }
    // 进入新类型：缓存命中则恢复，否则清空（all 无选择区，直接清空两侧）
    const hit = targetUserCache.value?.type === val && val !== 'all'
    if (val === 'role') {
        selectedRoleNames.value = hit ? [...targetUserCache.value.names] : []
        selectedUserNames.value = []
        selectedUserIds.value = []
    } else if (val === 'specific') {
        selectedUserNames.value = hit ? [...targetUserCache.value.names] : []
        selectedRoleNames.value = []
        selectedRoleIds.value = []
    } else {
        selectedUserNames.value = []
        selectedUserIds.value = []
        selectedRoleNames.value = []
        selectedRoleIds.value = []
    }
    prevTargetUserType.value = val
    // 清除校验
    nextTick(() => ruleFormRef.value?.clearValidate(['specifiedUsers', 'specifiedRoles']))
    if (val === 'specific') {
        // 自动聚焦 SmartAutoComplete
        nextTick(() => userAutoCompleteRef.value?.focus())
    }
    if (val === 'role') {
        // 自动聚焦角色 SmartAutoComplete
        nextTick(() => roleAutoCompleteRef.value?.focus())
    }
}

/**
 * 监听选中用户名变化 → 反查 userCache 同步 ID 列表
 * 模式：multipleIdMode=false + watch，参考 ImageReference.vue
 */
watch(selectedUserNames, (names) => {
    selectedUserIds.value = (names || [])
        .map(name => userCache.value.find(u => u.value === name))
        .filter(Boolean)
        .map(u => u.id)
    nextTick(() => ruleFormRef.value?.clearValidate(['specifiedUsers']))
}, { deep: true })

// 角色名称 → 角色 ID 同步
watch(selectedRoleNames, (names) => {
    // 无角色权限时不联动角色 ID（保留 handleEdit 回显的原角色 ID，防止提交清空角色）
    if (!hasPerm('btn.sysUser.assignRole')) return
    selectedRoleIds.value = (names || [])
        .map(name => roleCache.value.find(r => r.value === name))
        .filter(Boolean)
        .map(r => r.id)
    nextTick(() => ruleFormRef.value?.clearValidate(['specifiedRoles']))
}, { deep: true })

// ============================================================
// 表单校验规则
// ============================================================
const rules = {
    title: [
        { required: true, message: '请输入公告标题', trigger: 'blur' }
    ],
    content: [
        { required: true, message: '请输入公告内容', trigger: 'blur' }
    ],
    type: [
        { required: true, message: '请选择消息类型', trigger: 'change' }
    ],
    targetType: [
        { required: true, message: '请选择推送范围', trigger: 'change' }
    ],
    specifiedUsers: [
        {
            validator: (rule, value, callback) => {
                if (targetUserType.value === 'specific' && !selectedUserNames.value?.length) {
                    callback(new Error('请至少选择一位指定用户'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ],
    specifiedRoles: [
        {
            validator: (rule, value, callback) => {
                // 无分配角色权限时跳过校验（区块已被 v-perm.hide 隐藏，提交走原角色 ID 兜底）
                if (!hasPerm('btn.sysUser.assignRole')) { callback(); return }
                if (targetUserType.value === 'role' && !selectedRoleNames.value?.length) {
                    callback(new Error('请至少选择一个角色'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ]
}

const handleTypeChange = (val) => {
    const leftType = val === 0 ? 1 : 0 // 离开的编辑器类型
    // 编辑：离开原始类型的编辑器时保留其内容；新增及其他情况清空之前的内容
    if (leftType === originalType.value) {
        inactiveType.value = leftType
        inactiveContent.value = formModel.content
    }
    // 切回缓存类型的编辑器时恢复内容，否则从空内容开始
    formModel.content = inactiveType.value === val ? inactiveContent.value : ''
    // 切换消息类型时，重置 content 字段的校验状态
    nextTick(() => {
        ruleFormRef.value?.clearValidate(['content'])
    })
}

// ============================================================
// 数据渲染
// ============================================================
/**
 * 获取公告列表（后端分页）
 */
const fetchNotices = async () => {
    try {
        const res = await noticeListApi(pagination.pageNum, pagination.pageSize, searchModel)
        tableData.value = res.data.items || []
        totalCount.value = res.data.total || 0
    } catch (error) {
        console.error('获取公告列表失败:', error)
        tableData.value = []
        totalCount.value = 0
    }
}

onMounted(() => {
    fetchNotices()
    loadAllUsers()
})

// 预加载角色缓存（顶层立即执行；无角色权限时不加载，避免越权调用 getAllRolesApi）
if (hasPerm('btn.sysUser.assignRole')) loadAllRoles()

/**
 * 每页条数变化
 */
const handleSizeChange = () => {
    pagination.pageNum = 1
    fetchNotices()
}

/**
 * 页码变化
 */
const handlePageChange = () => {
    fetchNotices()
}

/**
 * 表格勾选变化
 */
const handleSelectionChange = (raw) => {
    selectedRows.value = raw
}

// ============================================================
// 搜索和重置
// ============================================================
const handleSearch = () => {
    pagination.pageNum = 1
    fetchNotices()
}

const handleReset = () => {
    pagination.pageNum = 1
    searchModel.keyword = ''
    searchModel.status = ''
    searchModel.type = ''
    searchModel.targetType = ''
    searchModel.sortField = 'create_time'
    sortOrder.value = 'DESC'
    searchModel.sortOrder = 'DESC'
    searchModel.timeField = 'create_time'
    startTime.value = ''
    endTime.value = ''
    quickDate.value = ''
    clearTimeParams()
    fetchNotices()
}

// ============================================================
// 新增
// ============================================================
const handleAdd = async () => {
    dialogVisible.value = true
    dialogTitle.value = '新增公告'
    isReadonly.value = false
    originalType.value = null
    inactiveType.value = null
    inactiveContent.value = ''
    targetUserType.value = 'all'
    selectedUserNames.value = []
    selectedUserIds.value = []
    selectedRoleNames.value = []
    selectedRoleIds.value = []
    originalTargetRoleIds.value = []
    await nextTick()
    ruleFormRef.value?.resetFields()
    Object.assign(formModel, defaultModel)
    // 新增：无回显原类型，切换推送范围/目标用户即清空之前的值
    originalTargetType.value = null
    originalTargetUserType.value = null
    targetCache.value = null
    targetUserCache.value = null
    prevTargetType.value = formModel.targetType
    prevTargetUserType.value = targetUserType.value
}

// ============================================================
// 编辑
// ============================================================
const handleEdit = async (row) => {

    if (row.status === 1) {
        msg.error('已推送的公告不允许编辑');
        return;
    }

    // 加载完整详情，含 pushScope 和 targetUserIds
    try {
        const res = await noticeDetailApi(row.id)
        const detail = res.data

        // 详情加载成功后再打开弹窗，避免权限不足时出现空白编辑框
        dialogVisible.value = true
        dialogTitle.value = '编辑公告'
        isReadonly.value = false
        await nextTick()
        ruleFormRef.value?.resetFields()

        Object.assign(formModel, {
            id: detail.id,
            title: detail.title || '',
            content: detail.content || '',
            type: detail.type !== undefined ? detail.type : 0,
            targetType: detail.targetType !== undefined ? detail.targetType : 3,
            status: detail.status !== undefined ? detail.status : 0,
            pushTime: detail.pushTime || null
        })
        // 记录原始消息类型，切换时保留原类型内容
        originalType.value = formModel.type
        inactiveType.value = null
        inactiveContent.value = ''
        // 回显角色
        if (detail.targetRoleIds && detail.targetRoleIds.length > 0) {
            targetUserType.value = 'role'
            selectedRoleIds.value = detail.targetRoleIds
            originalTargetRoleIds.value = detail.targetRoleIds
            if (hasPerm('btn.sysUser.assignRole')) {
                const res = await getAllRolesApi()
                roleCache.value = (res.data || []).map(item => ({
                    value: item.role_name,
                    id: item.id
                }))
                const roleMap = {}
                roleCache.value.forEach(r => { roleMap[r.id] = r.value })
                selectedRoleNames.value = detail.targetRoleIds.map(id => roleMap[id] || String(id))
            } else {
                // 无角色权限：不回显角色名称、不调 getAllRolesApi，提交时兜底原角色 ID（防止清空）
                selectedRoleNames.value = []
            }
            selectedUserNames.value = []
            selectedUserIds.value = []
        } else if (detail.pushScope === 2 && detail.targetUserIds && detail.targetUserIds.length > 0) {
            targetUserType.value = 'specific'
            selectedUserIds.value = detail.targetUserIds
            const userMap = {}
            userCache.value.forEach(u => { userMap[u.id] = u.value })
            selectedUserNames.value = detail.targetUserIds.map(id => userMap[id] || String(id))
            selectedRoleNames.value = []
            selectedRoleIds.value = []
            originalTargetRoleIds.value = []
        } else {
            targetUserType.value = 'all'
            selectedUserNames.value = []
            selectedUserIds.value = []
            selectedRoleNames.value = []
            selectedRoleIds.value = []
            originalTargetRoleIds.value = []
        }
        // 记录回显的原推送范围/目标用户类型：切换时只保留原类型的值
        originalTargetType.value = formModel.targetType
        originalTargetUserType.value = targetUserType.value
        targetCache.value = null
        targetUserCache.value = null
        prevTargetType.value = formModel.targetType
        prevTargetUserType.value = targetUserType.value
    } catch (e) {
        // request.js 已统一提示接口错误，这里不重复弹错误
    }
}

// ============================================================
// 详情（只读查看）
// ============================================================
const handleDetail = async (row) => {
  try {
    const res = await noticeDetailApi(row.id)
    const detail = res.data

    // 详情加载成功后再打开弹窗，避免权限不足时出现空白编辑框
    dialogVisible.value = true
    dialogTitle.value = '公告详情'
    isReadonly.value = true
    await nextTick()
    ruleFormRef.value?.resetFields()

    Object.assign(formModel, {
      id: detail.id,
      title: detail.title || '',
      content: detail.content || '',
      type: detail.type !== undefined ? detail.type : 0,
      targetType: detail.targetType !== undefined ? detail.targetType : 3,
      status: detail.status !== undefined ? detail.status : 0,
      pushTime: detail.pushTime || ''
    })
    // 回显角色
    if (detail.targetRoleIds && detail.targetRoleIds.length > 0) {
        targetUserType.value = 'role'
        selectedRoleIds.value = detail.targetRoleIds
        if (hasPerm('btn.sysUser.assignRole')) {
            const res = await getAllRolesApi()
            roleCache.value = (res.data || []).map(item => ({
                value: item.role_name,
                id: item.id
            }))
            const roleMap = {}
            roleCache.value.forEach(r => { roleMap[r.id] = r.value })
            selectedRoleNames.value = detail.targetRoleIds.map(id => roleMap[id] || String(id))
        } else {
            // 无角色权限：不回显角色名称、不调 getAllRolesApi
            selectedRoleNames.value = []
        }
        selectedUserNames.value = []
        selectedUserIds.value = []
    } else if (detail.pushScope === 2 && detail.targetUserIds && detail.targetUserIds.length > 0) {
        targetUserType.value = 'specific'
        selectedUserIds.value = detail.targetUserIds
        const userMap = {}
        userCache.value.forEach(u => { userMap[u.id] = u.value })
        selectedUserNames.value = detail.targetUserIds.map(id => userMap[id] || String(id))
        selectedRoleNames.value = []
        selectedRoleIds.value = []
    } else {
        targetUserType.value = 'all'
        selectedUserNames.value = []
        selectedUserIds.value = []
        selectedRoleNames.value = []
        selectedRoleIds.value = []
    }
  } catch (e) {
    // request.js 已统一提示接口错误，这里不重复弹错误
  }
}

// ============================================================
// 保存
// ============================================================
const handleConfirm = async () => {
    await ruleFormRef.value.validate()
    try {
        const params = {
            title: formModel.title,
            content: formModel.content,
            type: formModel.type,
            targetType: formModel.targetType
        }
        // pushScope + targetUserIds + targetRoleIds（角色→用户转换由后端内部完成）
        if (formModel.targetType === 2) {
            if (targetUserType.value === 'role') {
                // 无角色权限时兜底提交原角色 ID（防止编辑公告清空指定角色）
                const roleIds = hasPerm('btn.sysUser.assignRole') ? selectedRoleIds.value : originalTargetRoleIds.value
                if (roleIds.length > 0) {
                    params.pushScope = 2
                    params.targetRoleIds = roleIds
                }
            } else if (targetUserType.value === 'specific' && selectedUserIds.value.length > 0) {
                params.pushScope = 2
                params.targetUserIds = selectedUserIds.value
            }
        } else {
            params.pushScope = 1
            params.targetUserIds = null
        }
        if (!formModel.id) {
            await noticeAddApi(params)
        } else {
            await noticeUpdateApi({
                id: formModel.id,
                ...params
            })
        }
        msg.primary('操作成功')
        dialogVisible.value = false
        fetchNotices()
    } catch (error) {
        msg.error('操作失败')
    }
}

// ============================================================
// 删除
// ============================================================
const handleBatchDelete = async () => {
    if (selectedRows.value.length === 0) {
        msg.error('请先勾选要删除的行')
        return
    }
    const pushed = selectedRows.value.filter(r => r.status === 1)
    if (pushed.length > 0) {
        msg.error(`已推送的公告不能删除（共 ${pushed.length} 条），请先下架`)
        return
    }
    await ElMessageBox.confirm('你确认要进行删除么？', '温馨提示', {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
    })
    const ids = selectedRows.value.map(row => row.id)
    await handleDelete(ids)
}

const handleDelete = async (row) => {
    // 批量删除传的是 id 数组
    if (Array.isArray(row)) {
        await noticeRemoveApi(row)
    } else {
        if (row.status === 1) {
            msg.error('已推送的公告不能删除，请先下架')
            return
        }
        await noticeRemoveApi(row.id)
    }
    msg.primary('操作成功')
    fetchNotices()
    notifyRefresh()
}

// ============================================================
// 上架/下架/推送
// ============================================================
const notifyRefresh = () => window.dispatchEvent(new CustomEvent('notice-refresh'))

const handleCopyCodeSuccess = (e) => {
  const btn = e.target.closest('.v-md-copy-code-btn')
  if (!btn) return
  btn.classList.add('copied')
  setTimeout(() => btn.classList.remove('copied'), 1500)
}

const handleOnline = async (row) => {
    await noticeOnlineApi(row.id)
    msg.primary('上架成功')
    fetchNotices()
    notifyRefresh()
}

const handleOffline = async (row) => {
    await noticeOfflineApi(row.id)
    msg.primary('下架成功')
    fetchNotices()
    notifyRefresh()
}

const handlePush = async (row) => {
  if (row.status === 1) {
    msg.error('该公告已推送，不能重复推送')
    return
  }
  await noticePushApi(row.id)
  msg.primary('推送成功')
  fetchNotices()
  notifyRefresh()
}
</script>

<style scoped lang="scss">
.flex {
    display: flex;
}
.justify-between {
    justify-content: space-between;
}
.items-center {
    align-items: center;
}

/* 弹窗样式调整 */
:deep(.el-dialog) {
    .el-dialog__body {
        max-height: 80vh;
        overflow-y: auto;
    }
}

.notice-content-view {
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 100px;
  padding: 8px 12px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

/* 暗黑模式 — 参考 article/list.vue */
.dark-mode.detail-panel {
  :deep(.v-md-editor) {
    background-color: var(--el-bg-color) !important;
  }
  :deep(.v-md-editor__preview-wrapper) {
    background: var(--el-bg-color) !important;
  }
  :deep(.vuepress-markdown-body) {
    color: #fff;
    background: var(--el-bg-color) !important;
  }
}

.detail-panel {
  :deep(.github-markdown-body),
  :deep(.vuepress-markdown-body) {
    padding: 0 !important;
  }
}

/* 代码高亮 + 表格样式（同步 Markdown.vue scoped 块） */
.detail-panel {
  :deep(.vuepress-markdown-body code) {
    color: $code-color !important;
    .token .operator {
      background-color: transparent !important;
    }
    .token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string {
      background-color: transparent !important;
    }
  }
  :deep(.vuepress-markdown-body tr:nth-child(2n)) {
    color: black;
  }
  :deep(.v-md-editor-preview img) {
    display: block !important;
    width: $notice-img !important;
    margin: auto !important;
  }
  :deep(.v-md-copy-code-btn.copied svg) {
    display: none;
  }
  :deep(.v-md-copy-code-btn.copied::after) {
    content: "";
    position: absolute;
    left: 50%;
    top: 45%;
    width: 8px;
    height: 14px;
    border-right: 2.5px solid var(--el-color-white);
    border-bottom: 2.5px solid var(--el-color-white);
    transform: translate(-50%, -50%) rotate(45deg);
    border-radius: 1px;
  }
}
</style>