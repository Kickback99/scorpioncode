<template>
    <el-collapse class="search-collapse" v-model="searchActiveNames">
        <el-collapse-item title="" name="search">
    <div class="layout">

        <el-form ref="formRef" :model="form" label-width="auto" inline size="small">

            <!-- 模式切换按钮组 - 新增挑拣模式（只读，不可选择） -->
            <el-form-item>
                <el-radio-group v-model="viewMode" @change="handleModeChange">
                    <el-radio-button label="normal">正常模式</el-radio-button>
                    <!-- 挑拣模式(动态只读)：只有进入挑拣模式时才解除禁用，其他模式时禁用 -->
                    <el-radio-button label="pick" :disabled="viewMode !== 'pick'">挑拣模式</el-radio-button>
                    <el-radio-button label="audit">审核模式</el-radio-button>
                </el-radio-group>
            </el-form-item>

            <el-form-item>
                 <el-input v-model="searchData.keyword" placeholder="请输入标题 | 用户名"></el-input>   
            </el-form-item>

            <el-form-item>
                    <el-select  style="width: 200px" v-model="searchData.type" placeholder="请选择评论类型">
                        <el-option label="文章评论" value="0" />
                        <el-option label="友链评论" value="1" />
                    </el-select>
            </el-form-item>

            <el-form-item>
                    <el-select  style="width: 200px" v-model="searchData.status" placeholder="请选择评论状态">
                        <el-option label="请选择评论状态" value="" />
                        <el-option label="已通过" :value="0" />
                        <el-option label="已驳回" :value="1" />
                        <el-option label="待审核" :value="2" />
                    </el-select>
            </el-form-item>

            <el-form-item>
                    <el-select  style="width: 200px" v-model="searchData.rootId" placeholder="请选择评论类型">
                        <el-option label="请选择评论层级" value="" />
                        <el-option label="根评论" :value="-1" :disabled="viewMode === 'pick'" />
                        <el-option label="子评论" :value="0"  :disabled="viewMode === 'pick'" />
                    </el-select>
            </el-form-item>

            <el-form-item>
                <SmartSelector v-model="searchData.sortField" :data="fields" style="width: 255px;" placeholder="请选择排序(默认创建时间)">
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

        <!-- 顶部操作栏：新增「回复」按钮 -->
        <div class="top-action-bar">
            <el-button v-perm="'btn.comment.add'" size="small" type="primary" @click="handleTopReply" plain>
                回复
            </el-button>
        </div>

    </div>

    <div class="action-bar">
        <div class="action-buttons">
            <el-button v-perm="'btn.comment.audit'" size="small" type="primary" @click="batchApproveRows()"  plain>批量通过</el-button>
            <el-button v-perm="'btn.comment.audit'" size="small" type="danger" @click="batchRejectRows()"  plain>批量驳回</el-button>
            <el-button v-perm="'btn.comment.audit'" size="small" type="danger" @click="batchDeleteRows()"  plain>批量删除</el-button>
        </div>

        <!-- 统计区域：按钮显示状态文字，数字单独显示 -->
        <div class="statistics-buttons">
            <!-- 总评论 -->
            <div class="stat-item">
                <el-button size="small" type="primary" plain>
                    <span class="stat-label">总评论</span>
                </el-button>
                <span class="stat-number">{{ statistics.total }}</span>
            </div>

            <!-- 待审核 -->
            <div class="stat-item">
                <el-button size="small" type="warning" plain>
                    <span class="stat-label">待审核</span>
                </el-button>
                <span class="stat-number">{{ statistics.pending }}</span>
            </div>

            <!-- 已通过 -->
            <div class="stat-item">
                <el-button size="small" type="success" plain>
                    <span class="stat-label">已通过</span>
                </el-button>
                <span class="stat-number">{{ statistics.approved }}</span>
            </div>

            <!-- 已驳回 -->
            <div class="stat-item">
                <el-button size="small" type="danger" plain>
                    <span class="stat-label">已驳回</span>
                </el-button>
                <span class="stat-number">{{ statistics.rejected }}</span>
            </div>
        </div>

    </div>
        </el-collapse-item>
    </el-collapse>


    <el-table :data="tableData" style="width: 100%"
    v-loading="loading"
    ref="multipleTableRef"
    @selection-change="handleMultiple"
    >
        <el-table-column type="selection" :selectable="selectable" width="55" />
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
        <el-table-column label="评论类型" >
            <template #default="{row}">
                {{ row.type === '0' ? '文章评论':'友链评论' }}
            </template>
        </el-table-column>
        <el-table-column label="评论层级">
            <template #default="{row}">
                {{ row.rootId === -1 ? '根评论':'子评论' }}
            </template>
        </el-table-column>
        <el-table-column prop="content" label="评论内容" show-overflow-tooltip />
        <el-table-column prop ="status" label="评论状态">
            <template #default="{row}">
                <el-button size="small" type="success" v-if="row.status === 0" plain>已通过</el-button>
                <el-button size="small" type="danger" v-if="row.status === 1" plain>已驳回</el-button>
                <el-button size="small" type="warning" v-if="row.status === 2" plain>待审核</el-button>
            </template>
        </el-table-column>
        <el-table-column prop="username" label="创建者" />
        <el-table-column prop="createTime" label="创建日期" width="190"/>
        <!-- 操作列 - 根据模式动态显示不同按钮 -->
        <el-table-column label="操作" width="280" >
            <template #default="{ row }">
                <!--  审核模式：显示 通过/驳回/删除/详情 -->
                <template v-if="viewMode === 'audit'">
                    <el-popconfirm 
                        title="确认通过该评论吗？" 
                        @confirm="handleApprove(row)" 
                        width="200px"
                        :disabled="row.status === 0"
                    >
                        <template #reference>
                            <el-button
                                size="small"
                                type="primary"
                                :disabled="row.status === 0"
                                plain
                            >通过</el-button>
                        </template>
                    </el-popconfirm>
                    
                    <el-popconfirm 
                        title="确认驳回该评论吗？" 
                        @confirm="handleReject(row)" 
                        width="200px"
                        :disabled="row.status === 1"
                    >
                        <template #reference>
                            <el-button
                                size="small"
                                type="warning"
                                :disabled="row.status === 1"
                                plain
                            >驳回</el-button>
                        </template>
                    </el-popconfirm>
                    
                    <el-popconfirm :title="handleTitle(row.rootId)" @confirm="handleDelete(row.id)" width="250px" icon="WarnTriangleFilled">
                        <template #reference>
                            <el-button size="small" type="danger" plain>删除</el-button>
                        </template>
                    </el-popconfirm>

                    <el-button size="small" type="info" @click="handleInfo(row)" plain>详情</el-button>
                </template>

                <!-- 正常模式/挑拣模式：显示 回复/挑拣/删除/详情 -->
                <template v-else>
                    <el-button v-perm="'btn.comment.add'" size="small" type="primary" @click="handleReply(row)" plain>回复</el-button>
                    <el-button size="small" type="success" @click="row.rootId === -1 ? handleSelectChildren(row) : handleSelectParent(row)" plain>
                        挑拣
                    </el-button>
                    <el-popconfirm :title="handleTitle(row.rootId)" @confirm="handleDelete(row.id)" width="250px" icon="WarnTriangleFilled">
                        <template #reference>
                            <el-button v-perm="'btn.comment.remove'" size="small" type="danger" plain>删除</el-button>
                        </template>
                    </el-popconfirm>
                    <el-button size="small" type="info" @click="handleInfo(row)" plain>详情</el-button>
                </template>
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

    <!-- 重构：回复对话框（支持原内容 或 评论类型选择） -->
    <el-dialog v-model="replyDialogVisible" :title="replyDialogTitle" width="40%">
        <el-form :model="replyModel" :rules="replyRules" ref="replyModelRef" label-width="auto" size="small">
            
            <!-- 如果是父评论（顶部回复），显示类型选择 -->
            <template v-if="replyModel.isTopReply">
                <el-form-item label="评论类型" prop="type">
                    <el-radio-group v-model="replyModel.type" @change="onSwitchCommentType">
                        <el-radio :label="'0'">文章评论</el-radio>
                        <el-radio :label="'1'">友链评论</el-radio>
                        <el-radio :label="'2'">留言板</el-radio>
                    </el-radio-group>
                </el-form-item>
                
                <!-- 文章评论时显示文章选择 -->
                <el-form-item v-if="replyModel.type === '0'" label="选择文章" prop="articleId">
                    <SmartAutoComplete
                        ref="articleAutoCompleteRef"
                        v-model="selectedArticles"
                        :fetch-suggestions-api="fetchArticles"
                        placeholder="请输入文章标题搜索"
                        :max="1"
                        :debounce-delay="300"
                        :min-search-length="1"
                        :allow-custom="false"
                        custom-disabled-message="请输入已存在的文章标题"
                        :auto-search-on-enter="true"
                    />
                </el-form-item>
            </template>

            <!-- 子评论（回复已有评论），显示原内容 -->
            <template v-else>
                <el-form-item label="原内容">
                    <el-input :disabled="true" :model-value="replyModel.originalContent"/>
                </el-form-item>
            </template>

            <el-form-item label="回复内容" prop="content">
                <el-input 
                    v-model="replyModel.content" 
                    type="textarea" 
                    ref="replyInputRef"
                    :rows="4" 
                    placeholder="请输入回复内容"
                    maxlength="512"
                    show-word-limit
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button size="small" type="info" @click="replyDialogVisible = false" plain>取消</el-button>
            <el-button size="small" type="primary" @click="submitReply" plain>确定</el-button>
        </template>
    </el-dialog>

    <!-- 右侧抽屉 - 评论详情 -->
    <el-drawer
        v-model="drawerVisible"
        title="评论详情"
        direction="rtl"
        size="50%"
        :with-header="true"
        destroy-on-close
    >
        <template #header>
        <div class="drawer-header">
            <span class="drawer-title">评论详情</span>
            <el-button class="me-1" :type="currentDetailComment?.rootId === -1 ? 'primary' : 'info'" size="small" plain>
            {{ currentDetailComment?.rootId === -1 ? '根评论' : '子评论' }}
            </el-button>
        </div>
        </template>
        
        <!-- 加载状态 -->
        <div v-if="drawerLoading" class="drawer-loading">
        <span class="load-spinner"></span>
        <span>加载中...</span>
        </div>
        
        <!-- 详情内容 -->
        <CommentDetail 
        v-else
        ref="detailRef"
        :comment="currentDetailComment"
        :sortField="searchData.sortField"
        :sortOrder="searchData.sortOrder"
        @loaded="onDetailLoaded"
        @error="onDetailError"
        />
    </el-drawer>

</template>

<script setup>
import { addCommentApi, auditCommentApi, auditCommentsApi, getCommentsApi, getCommentStatisticsApi, removeCommentApi } from '@/api/comment';
import { nextTick, reactive, ref, computed, watch } from 'vue';
import { checkRejectValid, checkApproveValid, confirmBatchAction } from '@/utils/auditHelper'
import SmartSelector from '@/views/components/SmartSelector.vue';
import { storeToRefs } from 'pinia'
import { useUserConfigStore } from '@/store/userConfig';
import { useConfigStore } from '@/store/config';
import { useTabStore } from '@/store/tabs';
import { useRoute } from 'vue-router';
import PinyinMatch from 'pinyin-match'
import { getAllArticlesApi } from '@/api/business';
import { hasPerm } from '@/utils/permissions';
import SmartAutoComplete from '@/views/components/SmartAutoComplete.vue';
import msg from '@/components/msg'

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
const { isDarkEnabled: isDark } = storeToRefs(userConfigStore)

// 视图模式：normal-正常模式，audit-审核模式，pick-挑拣模式
const viewMode = ref('normal')
const currentPickComment = ref(null)

const tableData = ref([])

const params = reactive({
    pageNum:1,
    pageSize:10
})

const total = ref(null)
// 默认关闭loading
const loading = ref(false)

const searchData = reactive({
    rootId: -1,
    sortOrder:'DESC',
    sortField:'create_time',

})

const render = async () => {
    // 开启loading动效
    loading.value = true
    try{
        let res

        // 审核模式 + 从挑拣进来的（有 currentPickComment 说明是从挑拣进来的）
        if (viewMode.value === 'audit' && currentPickComment.value) {
            const searchParams = { ...searchData }
                const isRootComment = currentPickComment.value.rootId === -1
                searchParams.rootId = isRootComment ? currentPickComment.value.id : currentPickComment.value.rootId
                if (isRootComment) {
                    searchParams.pickChildren = true
                } else {
                    searchParams.pickParent = true
                    searchParams.currentCommentId = currentPickComment.value.id
                }
            
            res = await getCommentsApi(params.pageNum, params.pageSize, searchParams)
            tableData.value = res.data.items
            total.value = res.data.total
            await loadStatistics()
            return
        }

        // 挑拣模式逻辑（整合 v1 后端的 pickParent 逻辑）
        if (viewMode.value === 'pick' && currentPickComment.value) {
            const isRootComment = currentPickComment.value.rootId === -1
            const searchParams = {
                // 子集模式：传当前评论id作为 rootId
                // 父集模式：传当前评论的 rootId 作为 rootId
                rootId: isRootComment ? currentPickComment.value.id : currentPickComment.value.rootId
            }
            
            // 区分挑拣子集和挑拣父集
            if (isRootComment) {
                // 子集模式（点击的是根评论）
                searchParams.pickChildren = true
            } else {
                // 父集模式（点击的是子评论）
                searchParams.pickParent = true
                searchParams.currentCommentId = currentPickComment.value.id
            }
            
            // 添加其他筛选条件
            if (searchData.keyword) searchParams.keyword = searchData.keyword
            if (searchData.type) searchParams.type = searchData.type
            if (searchData.status !== undefined && searchData.status !== null && searchData.status !== '') searchParams.status = searchData.status
            if (searchData.sortField) searchParams.sortField = searchData.sortField
            if (searchData.sortOrder) searchParams.sortOrder = searchData.sortOrder
            
            res = await getCommentsApi(params.pageNum, params.pageSize, searchParams)
            tableData.value = res.data.items
            total.value = res.data.total
        } else {
            // 正常模式/审核模式
            const searchParams = { ...searchData }
            res = await getCommentsApi(params.pageNum, params.pageSize, searchParams)
            tableData.value = res.data.items
            total.value = res.data.total
        }

        await loadStatistics()
    }finally{
        // 关闭loading动效
        loading.value = false
    }
}

render()

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
    /* if(Boolean(searchData.value.sortField) != Boolean(searchData.value.sortOrder)){
        msg.error(searchData.value.sortField?'请选择排序':'请选择排序字段')
    } */
    // 只有切换到正常模式时才清空挑拣上下文
    // 切换到审核模式时，保留 currentPickComment（因为需要它的数据）
    if (viewMode.value === 'normal') {
        currentPickComment.value = null
    }
    params.pageNum = 1
    render()
}

const onReset = () => {
    // 重置时退出挑拣模式，恢复到正常模式
    if (viewMode.value === 'pick') {
        viewMode.value = 'normal'
    }
    if(viewMode.value === 'normal'){
        Object.assign(searchData, { keyword: '', type: null, rootId: -1, status: null, sortOrder: 'DESC', sortField: 'create_time' })
    }else {
        Object.assign(searchData, { keyword: '', type: null, rootId: '', status: 2, sortOrder: 'DESC', sortField: 'status' })
    }
    currentPickComment.value = null
    params.pageNum = 1    
    render()
}

// 挑选子集
const handleSelectChildren = async (row) => {
    // console.log('挑选子集', row)
    viewMode.value = 'pick' // 此时 pick 按钮的 disabled 变为 false
    searchData.sortField = 'group'
    searchData.sortOrder = 'DESC'
    searchData.rootId = ''
    searchData.keyword = ''
    // pickMode.value = 'children'
    currentPickComment.value = row
    // searchData.rootId = ''
    params.pageNum = 1
    await render()
    msg.primary(`正在查看「${row.content}」的子评论`)
}

// 挑拣父集
const handleSelectParent = async (row) => {
    // console.log('挑拣父集', row)
    viewMode.value = 'pick' //  此时 pick 按钮的 disabled 变为 false
    searchData.sortField = 'group'
    searchData.sortOrder = 'DESC'
    searchData.rootId = ''
    searchData.keyword = ''
    // pickMode.value = 'parent'
    updateModeSettings()  // 手动调用
    currentPickComment.value = row
    // searchData.rootId = ''
    params.pageNum = 1
    await render()
    msg.primary(`正在查看「${row.content}」的父评论及其所有子评论`)
}

// 抽离公共方法
const updateModeSettings = () => {
    if (viewMode.value === 'audit') {
        searchData.sortField = 'status'
        searchData.sortOrder = 'DESC'
        searchData.status = 2
        // 没有挑拣上下文时清空 rootId（说明是从正常模式进来的）
        if (!currentPickComment.value) {
            searchData.rootId = ''
        }else {
            // 否则是挑拣模式进来的
            /* searchData.sortField = 'group'
            searchData.sortOrder = 'DESC' */
        }
    } else if (viewMode.value === 'normal') {
        searchData.sortField = 'create_time'
        searchData.sortOrder = 'DESC'
        searchData.rootId = -1
        searchData.status = null
    }
}

// 切换模式（用户点击正常/审核模式时自动退出挑拣模式）
const handleModeChange = () => {
    updateModeSettings()
    const isPickToAudit = (viewMode.value === 'audit' && currentPickComment.value)

    if (!isPickToAudit) {
        params.pageNum = 1
    }
    if (viewMode.value === 'normal') {
        currentPickComment.value = null
    }
    render()
}


// 返回根评论列表（挑拣父集）
/* const backToRootList = () => {
    // 返回时重置模式
    pickMode.value = null
    currentPickComment.value = null

    
    // 重置搜索条件
    searchData.rootId = -1
    
    // 重置分页
    params.pageNum = 1
    
    // 重新渲染
    render()
    
    msg.info('已返回根评论列表')
} */

// ==================== 回复相关 ====================

const replyDialogVisible = ref(false)
const replyModelRef = ref()
const replyInputRef = ref(null)

// 文章列表（用于联想搜索）
const articleList = ref([])

// 用于 SmartAutoComplete 的选中值
const selectedArticles = ref([])

// 加载所有文章
const loadAllArticles = async () => {
    const res = await getAllArticlesApi()
    articleList.value = (res.data || []).map(item => ({
        value: item.title,
        id: item.id
    }))
    console.log('加载所有文章:', articleList.value.length, '条')
}

// 前端搜索函数
const fetchArticles = async (params) => {
    const query = params.keyword || ''
    
    if (hasPerm('btn.comment.add') && articleList.value.length === 0) {
        await loadAllArticles()
    }
    
    if (!query) {
        return articleList.value
    }
    
    const lowerQuery = query.toLowerCase()
    
    const matched = articleList.value.filter(item => {
        const text = item.value
        const lowerText = text.toLowerCase()
        
        if (lowerText.includes(lowerQuery)) return true
        if (PinyinMatch.match(text, query)) return true
        
        const words = lowerText.split(/[\s\-_]+/)
        for (const word of words) {
            if (word.startsWith(lowerQuery)) return true
        }
        
        if (words.length > 1) {
            const initials = words.map(word => word[0]).join('')
            if (initials.includes(lowerQuery)) return true
        }
        
        let charIndex = 0
        for (let i = 0; i < lowerText.length && charIndex < lowerQuery.length; i++) {
            if (lowerText[i] === lowerQuery[charIndex]) charIndex++
        }
        if (charIndex === lowerQuery.length) return true
        
        return false
    })
    
    return matched
}

// 监听选中变化
watch(selectedArticles, (newVal) => {
    if (newVal.length > 0) {
        const selected = articleList.value.find(item => item.value === newVal[0])
        if (selected) {
            replyModel.articleId = selected.id
        }
    } else {
        replyModel.articleId = null
    }
}, { deep: true })

// 回复对话框标题
const replyDialogTitle = ref('回复评论')

// 回复模型
const replyModel = reactive({
    isTopReply: false,      // 是否是父评论（顶部回复）
    type: '0',              // 评论类型：0=文章评论，1=友链评论，2=留言板
    articleId: null,        // 文章ID（文章评论时需要）
    originalContent: '',    // 原内容（子评论时显示）
    content: '',            // 回复内容
    rootId: -1,             // 根评论ID（固定为-1）
    toCommentId: -1,        // 目标评论ID（固定为-1）
    toCommentUserId: -1     // 目标评论用户ID（固定为-1）
})

// 回复校验规则
const replyRules = {
    type: [
        { required: true, message: '请选择评论类型', trigger: 'change' }
    ],
    articleId: [
        { required: true, message: '请选择关联文章', trigger: 'blur' }
    ],
    content: [
        { required: true, message: '请输入回复内容', trigger: 'blur' },
        { min: 1, max: 512, message: '长度在 1 到 512 个字符', trigger: 'blur' }
    ]
}

// 声明 ref
const articleAutoCompleteRef = ref(null)

// 评论类型切换
const onSwitchCommentType = (val) => {
    replyModelRef.value?.resetFields(['content'])

    nextTick(()=>{
        if (val === '0') {
            // 切换到文章评论，聚焦 SmartAutoComplete
            articleAutoCompleteRef.value?.focus()
        } else {
            // 切换到其他类型，聚焦回复内容输入框
            if (replyInputRef.value) {
                const textarea = replyInputRef.value.$el.querySelector('textarea')
                textarea?.focus()
            }
        }
    })
}

// 顶部回复按钮 - 父评论
const handleTopReply = () => {
    // console.log('顶部回复 - 父评论')
    
    // 重置模型为父评论模式
    replyModel.isTopReply = true
    replyModel.type = '0'
    replyModel.articleId = null
    replyModel.originalContent = ''
    replyModel.content = ''
    replyModel.rootId = -1
    replyModel.toCommentId = -1
    replyModel.toCommentUserId = -1
    
    selectedArticles.value = []
    replyDialogTitle.value = '发布根评论'
    
    // 打开对话框
    replyDialogVisible.value = true
    
    nextTick(() => {
        replyModelRef.value?.resetFields(['content', 'articleId'])
        setTimeout(() => {
            articleAutoCompleteRef.value?.focus()
        })
    })
}

// 子评论回复（点击表格中的回复按钮）
const handleReply = (row) => {
    // console.log('回复的评论:', row)
    
    // 重置为子评论模式
    replyModel.isTopReply = false
    replyModel.originalContent = row.content
    replyModel.content = ''
    replyModel.type = row.type
    
    // 设置请求参数
    replyModel.articleId = row.articleId
    
    if (row.rootId === -1) {
        // 回复根评论
        replyModel.rootId = row.id
        replyModel.toCommentId = row.id
        replyModel.toCommentUserId = row.createBy
    } else {
        // 回复子评论
        replyModel.rootId = row.rootId
        replyModel.toCommentId = row.id
        replyModel.toCommentUserId = row.createBy
    }
    
    replyDialogTitle.value = '回复评论'
    
    // 打开对话框
    replyDialogVisible.value = true
    
    nextTick(() => {
        replyModelRef.value?.resetFields(['content'])
        setTimeout(() => {
            if (replyInputRef.value) {
                const textarea = replyInputRef.value.$el.querySelector('textarea')
                textarea?.focus()
            }
        })
    })
}

// 提交回复
const submitReply = async () => {
    // 表单验证
    await replyModelRef.value.validate()
    
    let requestData
    
    if (replyModel.isTopReply) {
        // 父评论：rootId = -1, toCommentId = -1, toCommentUserId = -1
        requestData = {
            type: replyModel.type,
            rootId: -1,
            toCommentId: -1,
            toCommentUserId: -1,
            content: replyModel.content
        }
        
        // 文章评论需要 articleId
        if (replyModel.type === '0') {
            requestData.articleId = replyModel.articleId
        }
    } else {
        // 子评论
        requestData = {
            articleId: replyModel.articleId,
            type: replyModel.type,
            rootId: replyModel.rootId,
            toCommentId: replyModel.toCommentId,
            toCommentUserId: replyModel.toCommentUserId,
            content: replyModel.content
        }
    }
    
    console.log('提交数据:', requestData)
    
    await addCommentApi(requestData)
    msg.primary('回复成功')
    replyDialogVisible.value = false
    
    // 刷新列表
    render()
}

// 抽屉相关
const drawerVisible = ref(false)
const drawerLoading = ref(false)
const currentDetailComment = ref(null)
const detailRef = ref()

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

/**
 * 详情按钮逻辑 - 打开右侧抽屉
 */
const handleInfo = async (comment) => {
  console.log('🔍 点击详情按钮，评论数据:', comment)
  
  // 设置当前评论
  currentDetailComment.value = comment
  
  // 打开抽屉并显示加载状态
  drawerVisible.value = true
  drawerLoading.value = true
  
  // 等待详情组件加载完成
  await nextTick()
  
  // 延迟一点关闭加载状态（让组件有时间加载）
  setTimeout(() => {
    drawerLoading.value = false
  }, 500)
}

// 详情加载完成回调
const onDetailLoaded = (data) => {
  console.log('✅ 详情加载完成:', data)
}

// 详情加载错误回调
const onDetailError = (error) => {
  console.error('❌ 详情加载失败:', error)
  msg.error('加载详情失败')
  drawerLoading.value = false
}

const handleTitle = (rootId) => {
    if(rootId === -1) return '删除父评论，该子评论一律删除'
    else return '你确定要删除这条评论吗？' 
}

// 批量业务相关
const multipleTableRef = ref()
const multipleSelection = ref([])

const handleMultiple = (raw) => {
    console.log(raw)
    multipleSelection.value = raw
}


// 批量通过
const batchApproveRows = async () => {
    // 检查选中项是否全部为待通过状态
    const check = checkApproveValid(multipleSelection.value)
    
    if (!check.valid) {
        msg.warning(check.message)
        return
    }
    
    await confirmBatchAction(check.validRows.length, '通过')
    
    const ids = multipleSelection.value.map(row => row.id)
    await auditCommentsApi(ids, 0)
    msg.primary(`成功通过${ids.length}条评论`)
    render()
}

// 批量驳回
const batchRejectRows = async () => {
    const check = checkRejectValid(multipleSelection.value)
    
    if (!check.valid) {
        msg.warning(check.message)
        return
    }
    
    await confirmBatchAction(check.validRows.length, '驳回')
    
    const ids = multipleSelection.value.map(row => row.id)
    await auditCommentsApi(ids, 1)
    msg.primary(`成功驳回${ids.length}条评论`)
    render()
}


// 批量删除
const batchDeleteRows = async() => {
    let title;
    if(multipleSelection.value.length === 0){
        msg.error('请先勾选要删除的评论')
        return
    }
    const rowIds = multipleSelection.value.map(row => row.id)
    const rootIds = multipleSelection.value.map(row => row.rootId)
    if(rootIds.length > 0){
        title = 
        `你选择了${rootIds.length}个根评论，你确认要删除吗？
        删除后，子评论也一律删除
        `
        console.log('rootIds',rootIds)
    }else title = '你确认要进行删除么'

    await ElMessageBox.confirm(title,'温馨提示', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
    handleDelete(rowIds)

}

const handleApprove = async (row) => {
    await auditCommentApi(row.id, 0)
    msg.primary('审核通过')
    render()
}

const handleReject = async (row) => {
    await auditCommentApi(row.id, 1)
    msg.primary('已驳回')
    render()
}

const handleDelete = async(ids) => {
    await removeCommentApi(ids)
    msg.primary('删除成功')
    render()
}

// 设置排序方向
const setSortOrder = (order) => {
  searchData.sortOrder = order
}

const fields = computed(() => [
    {label:'请选择排序(默认创建时间)', value:''},
    {label:'评论内容', value:'content'},
    {label:'评论状态', value:'status'},
    {label:'创建时间', value:'create_time'},
    {label:'修改时间', value:'update_time'},
    {label:'自定义分组', value:'group', disabled: viewMode.value != 'pick'},
])

const statistics = reactive({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
})

// 构建统计参数（通用方法）
const buildStatsParams = () => {
    const statsParams = { ...searchData }
    
    // 审核模式：只有当用户没有主动选择状态时，才默认查询待审核状态
    /* if (viewMode.value === 'audit') {
        // 检查 searchData.status 是否为空（未选择）或为 undefined
        const hasUserSelectedStatus = searchData.status !== undefined 
                                    && searchData.status !== null 
                                    && searchData.status !== ''
        if (!hasUserSelectedStatus) {
            statsParams.status = 2  // 默认查询待审核
        }
    } */
    
    // 如果有挑拣上下文（无论是 pick 模式还是 audit 模式从挑拣进来）
    if (currentPickComment.value) {
        const isRootComment = currentPickComment.value.rootId === -1
        if (isRootComment) {
            statsParams.rootId = currentPickComment.value.id
            statsParams.pickChildren = true
            delete statsParams.pickParent
        } else {
            statsParams.rootId = currentPickComment.value.rootId
            statsParams.pickParent = true
            statsParams.currentCommentId = currentPickComment.value.id
            delete statsParams.pickChildren
        }
    }
    
    return statsParams
}

/**
 * 加载统计数据（复用当前筛选条件）
 */
const loadStatistics = async () => {
    try {
        const statsParams = buildStatsParams()
        const res = await getCommentStatisticsApi(statsParams)
        if (res.code === 200 && res.data) {
            statistics.total = res.data.total || 0
            statistics.pending = res.data.pending || 0
            statistics.approved = res.data.approved || 0
            statistics.rejected = res.data.rejected || 0
        }
    } catch (error) {
        console.error('加载统计数据失败:', error)
    }
}

</script>

<style scoped lang="scss">
.layout {
    @include flex(space-between, null, null);
    // margin-bottom: 20px;
}

// 顶部操作栏
.top-action-bar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
}

// 抽屉头部样式
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  
  .drawer-title {
    font-size: 18px;
    // font-weight: bold;
  }
}

// 加载样式
.drawer-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: var(--el-color-primary);
  font-size: 14px;
  
  .el-icon {
    font-size: 24px;
  }
}

/* ==================== 统计卡片样式 ==================== */
/* 操作栏布局 */
.action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    margin-right: 20px;
    flex-wrap: wrap;
    gap: 16px;
}

.action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

/* 统计按钮组 */
.statistics-buttons {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    align-items: center;
}

/* 单个统计项 */
.stat-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

/* 统计数字样式 */
.stat-number {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1;
}

.load-spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--el-border-color-light);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: load-spin .7s linear infinite;
}
@keyframes load-spin {
  to { transform: rotate(360deg); }
}
</style>
