<template>
    <div class="flex justify-between">
        <el-form ref="formRef" :model="searchModel" label-width="auto" inline size="small">
            <el-form-item>
                <el-input v-model="searchModel.keyword" placeholder="请输入轮播标题/文章标题" />
            </el-form-item>
            <el-form-item>
                <el-button size="small" type="primary" icon="Search" @click="onSearch" plain>搜索</el-button>
                <el-button size="small" type="info" icon="Refresh" @click="onReset" plain>重置</el-button>
            </el-form-item>
        </el-form>
        <div>
            <el-button v-perm="'btn.carousel.add'"  size="small" type="primary" icon="Plus" @click="handleAdd" plain>新增轮播</el-button>
        </div>
    </div>

    <el-table :data="tableData" style="width: 100%" ref="multipleTableRef" @selection-change="handleMultiple">
        <el-table-column prop="id" label="轮播ID" width="80" />

        <el-table-column label="轮播图" width="120">
            <template #default="{ row }">
                <el-image style="width: 80px; height: 45px; border-radius: 4px;" :src="row.img" :fit="'cover'" preview-teleported :preview-src-list="[row.img]"/>
            </template>
        </el-table-column>

        <!-- <el-table-column prop="articleTitle" label="文章标题" min-width="150" show-overflow-tooltip /> -->

        <el-table-column label="轮播标题" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
                <!-- 显示标题 -->
                <span style="position: relative;">{{ row.articleId ? (row.title || row.articleTitle) : (row.title || '未命名') }}</span>
                
                <!-- 自定义标题标识：articleId存在 且 title存在 且 title不等于文章标题 -->
                <el-text 
                    v-if="row.articleId && row.title && row.title !== row.articleTitle" 
                    type="warning" 
                    size="small" 
                    effect="plain" 
                    style="position: relative; top: -6px; font-size: 10px; margin-left: 2px;"
                >
                    改
                </el-text>
                
                <!-- 外链标识：没有articleId -->
                <el-text 
                    v-if="!row.articleId" 
                    type="info" 
                    size="small" 
                    effect="plain" 
                    style="position: relative; top: -6px; font-size: 10px; margin-left: 2px;"
                >
                    外链
                </el-text>
            </template> 
        </el-table-column>

        <!-- 类型列 -->
        <el-table-column label="类型" width="80" align="center">
            <template #default="{ row }">
                <el-text v-if="row.articleId" size="small" type="success">文章</el-text>
                <el-text v-else size="small" type="info">外链</el-text>
            </template>
        </el-table-column>

        <el-table-column label="状态" width="180" align="center">
            <template #default="{ row }">
                <!-- 有进度且未完成 -->
                <div v-if="uploadProgressMap.has(row.id) && uploadProgressMap.get(row.id) < 100">
                    <el-progress 
                        :percentage="uploadProgressMap.get(row.id)" 
                        :stroke-width="16"
                        :text-inside="true"
                        :striped="true"
                        style="width: 100%;"
                    />
                </div>
                <!-- 已完成 -->
                <el-tag v-else-if="row.uploadStatus === 'SUCCESS'" type="success" size="small">
                    已完成
                </el-tag>
                <!-- 失败 -->
                <el-tag v-else-if="row.uploadStatus === 'FAILED'" type="danger" size="small">
                    上传失败
                </el-tag>
                <!-- 等待 -->
                <el-tag v-else-if="row.uploadStatus === 'PENDING'" type="warning" size="small">
                    等待上传
                </el-tag>
                <el-tag v-else type="info" size="small">未知</el-tag>
            </template>
        </el-table-column>

        <!-- <el-table-column prop="description" label="轮播描述" min-width="150" show-overflow-tooltip /> -->
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="跳转链接" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
                <span>{{ row.articleId ? '文章详情' : '外链' }}</span>
            </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="200" />
        <el-table-column label="操作" width="150">
            <template #default="{ row }">
                <!-- 失败状态显示重试按钮 -->
                <el-button
                    v-if="row.uploadStatus === 'FAILED'"
                    @click="handleRetry(row)"
                    size="small"
                    type="primary"
                    icon="Refresh"
                    circle
                    plain
                >
                </el-button>
                <el-button v-else v-perm="'btn.carousel.update'" @click="handleEdit(row)" size="small" type="warning" icon="Edit" circle plain />
                <el-popconfirm :title="`你确定要删除「${row.articleTitle}」的轮播吗？`" @confirm="handleDelete(row.id)" width="250px" icon="WarnTriangleFilled">
                    <template #reference>
                        <el-button v-perm="'btn.carousel.remove'" size="small" type="danger" icon="Delete" circle plain />
                    </template>
                </el-popconfirm>
            </template>
        </el-table-column>
    </el-table>

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

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="45%">
        <el-form ref="ruleFormRef" :model="formModel" :rules="rules" label-width="auto" status-icon size="small">

            <!-- 轮播类型（仅新增时显示） -->
            <el-form-item v-if="!formModel.id" label="轮播类型">
                <el-radio-group v-model="formModel.carouselType" @change="handleTypeChange">
                    <el-radio :label="0">关联文章</el-radio>
                    <el-radio :label="1">外链</el-radio>
                </el-radio-group>
            </el-form-item>

            <!-- 关联文章 - 文章选择（仅新增时显示） -->
            <el-form-item v-if="!formModel.id && formModel.carouselType === 0" label="选择文章" prop="articleId">
                <SmartAutoComplete
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

            <!-- 外链 - 标题（仅新增时显示） -->
            <el-form-item v-if="!formModel.id && formModel.carouselType === 1" label="轮播标题" prop="title">
                <el-input v-model="formModel.title" placeholder="请输入轮播标题" />
            </el-form-item>

            <!-- 关联文章（只读）- 编辑时显示 -->
            <el-form-item v-if="formModel.id && formModel.articleId" label="关联文章">
                <el-input :value="formModel.articleTitle" disabled />
            </el-form-item>

            <!-- 轮播标题（编辑/新增通用） -->
            <el-form-item label="轮播标题" v-if="formModel.carouselType === 0">
                <el-radio-group v-model="formModel.hasCustomTitle">
                    <el-radio :label="true">自定义标题</el-radio>
                    <el-radio :label="false">使用文章标题</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item v-if="formModel.hasCustomTitle" label="标题内容" prop="title">
                <el-input
                    v-model="formModel.title"
                    placeholder="请输入自定义标题"
                    maxlength="100"
                    show-word-limit
                />
                <el-tooltip placement="right">
                    <template #content>
                        <div>自定义标题将覆盖默认标题</div>
                    </template>
                    <el-icon class="form-tip-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
            </el-form-item>

            <!-- 排序 -->
            <el-form-item label="轮播排序">
                <el-input-number
                    v-model="formModel.sort"
                    :min="0"
                    :max="999"
                    controls-position="right"
                    placeholder="自动"
                    style="width:150px;"
                    @change="handleSortChange"
                />
                <el-tooltip placement="right">
                    <template #content>
                        <div>数字越小越靠前，0 表示自动排序</div>
                    </template>
                    <el-icon class="form-tip-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
            </el-form-item>

            <!-- 专用图：根据类型显示不同内容 -->
            <template v-if="formModel.carouselType === 0">
                <el-form-item label="轮播图">
                     <el-radio-group v-model="formModel.imgOption" @change="handleImgOptionChange">
                        <el-radio :label="0">使用文章封面</el-radio>
                        <el-radio :label="1">使用专用图</el-radio>
                        <el-radio :label="2">自定义链接</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="formModel.imgOption === 1" label="上传图片" prop="img">
                    <SmartUpload
                        ref="uploadRef" 
                        v-model="formModel.img"
                        :onValidate="handleImgValidate"
                        shape="rectangle"
                    />
                </el-form-item>
                <el-form-item v-if="formModel.imgOption === 2" label="图片链接" prop="customImgLink">
                    <el-input
                        v-model="formModel.customImgLink"
                        placeholder="请输入图片链接地址，如：https://example.com/image.jpg"
                    />
                    <el-tooltip placement="right">
                        <template #content>
                            <div>输入图片的 URL 地址</div>
                        </template>
                        <el-icon class="form-tip-icon"><QuestionFilled /></el-icon>
                    </el-tooltip>
                </el-form-item>
            </template>

            <template v-if="formModel.carouselType === 1">
                <el-form-item label="轮播图">
                    <el-radio-group v-model="formModel.imgOption" @change="handleImgOptionChange">
                        <el-radio :label="1">使用专用图</el-radio>
                        <el-radio :label="2">自定义链接</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="formModel.imgOption === 1" label="轮播图" prop="img">
                    <SmartUpload
                        ref="uploadRef" 
                        v-model="formModel.img"
                        :onValidate="handleImgValidate"
                        shape="rectangle"
                    />
                </el-form-item>
                <el-form-item v-if="formModel.imgOption === 2" label="图片链接" prop="customImgLink">
                    <el-input
                        v-model="formModel.customImgLink"
                        placeholder="请输入图片链接地址，如：https://example.com/image.jpg"
                    />
                    <el-tooltip placement="right">
                        <template #content>
                            <div>输入图片的 URL 地址</div>
                        </template>
                        <el-icon class="form-tip-icon"><QuestionFilled /></el-icon>
                    </el-tooltip>
                </el-form-item>
            </template>

            <!-- 自定义链接：根据类型显示不同内容 -->
            <template v-if="formModel.carouselType === 0">
                <el-form-item label="轮播链接">
                    <el-radio-group v-model="formModel.hasCustomLink">
                        <el-radio :label="false">跳文章详情</el-radio>
                        <el-radio :label="true">自定义链接</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="formModel.hasCustomLink" label="链接地址" prop="link">
                    <el-input
                        v-model="formModel.link"
                        placeholder="请输入链接地址，如：https://example.com"
                    />
                    <el-tooltip placement="right">
                        <template #content>
                            <div>留空则跳转文章详情页</div>
                        </template>
                        <el-icon class="form-tip-icon"><QuestionFilled /></el-icon>
                    </el-tooltip>
                </el-form-item>
            </template>

            <template v-if="formModel.carouselType === 1">
                <el-form-item label="轮播链接" prop="link">
                    <el-input
                        v-model="formModel.link"
                        placeholder="请输入链接地址，如：https://example.com"
                    />
                    <el-tooltip placement="right">
                        <template #content>
                            <div>外链跳转地址为必填项</div>
                        </template>
                        <el-icon class="form-tip-icon"><QuestionFilled /></el-icon>
                    </el-tooltip>
                </el-form-item>
            </template>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button size="small" type="info" @click="dialogVisible = false" plain>取消</el-button>
                <el-button size="small" type="primary" @click="handleConfirm" plain>确认</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import msg from '@/components/msg'
import { Plus, QuestionFilled } from '@element-plus/icons-vue'
import { getCarouselListApi, getCarouselByIdApi, updateCarouselApi, removeCarouselApi, addCarouselApi } from '@/api/article'
import { getAllArticlesApi } from '@/api/business'
import { hasPerm } from '@/utils/permissions'
import SmartAutoComplete from '@/views/components/SmartAutoComplete.vue'
import PinyinMatch from 'pinyin-match'
import SmartUpload from '@/views/components/SmartUpload.vue'

// ==================== 数据 ====================

const tableData = ref([])
const total = ref(0)

const pagination = reactive({
    pageNum: 1,
    pageSize: 10
})

const searchModel = reactive({
    keyword: ''
})

// 缓存所有已发布的文章列表
const articleList = ref([])
// 上传组件 ref
const uploadRef = ref(null)

// 进度 Map
const uploadProgressMap = ref(new Map())

// ==================== 渲染列表 ====================

// 加载所有文章
const loadAllArticles = async () => {
    const res = await getAllArticlesApi()
    articleList.value = (res.data || []).map(item => ({
        value: item.title,
        id: item.id
    }))
    console.log('加载所有文章:', articleList.value.length, '条')
}

const renderCarouselList = async () => {
    const res = await getCarouselListApi(pagination.pageNum, pagination.pageSize, searchModel)
    tableData.value = res.data.items || []
    total.value = res.data.total || 0
}

// ==================== 分页 ====================

const onSizeChange = (size) => {
    pagination.pageNum = 1
    pagination.pageSize = size
    renderCarouselList()
}

const onCurrentChange = (page) => {
    pagination.pageNum = page
    renderCarouselList()
}

// ==================== 搜索/重置 ====================

const onSearch = () => {
    pagination.pageNum = 1
    renderCarouselList()
}

const onReset = () => {
    pagination.pageNum = 1
    Object.assign(searchModel, { keyword: '' })
    renderCarouselList()
}

// ==================== 弹窗 ====================

const dialogVisible = ref(false)
const dialogTitle = ref('')
const ruleFormRef = ref(null)

// 用于 SmartAutoComplete 的选中值
const selectedArticles = ref([])

// 表单默认值
const defaultForm = {
    id: null,
    carouselType: 0,        // 0=关联文章, 1=外链
    articleId: null,
    articleTitle: '',
    title: '',              // 轮播标题
    hasCustomTitle: false,  // 是否自定义标题
    sort: null,
    imgOption: 0,           // 图片选项 0=使用文章封面/默认, 1=使用专用图, 2=自定义链接
    img: '',
    customImgLink: '',      // 自定义图片链接
    link: '',
    hasCustomLink: false,
    uploadStatus: '',
}

const formModel = reactive({ ...defaultForm })

// 自定义校验器
const validateTitle = (rule, value, callback) => {
    // 外链：title 必填
    if (formModel.carouselType === 1) {
        if (!value || !value.trim()) {
            callback(new Error('请输入轮播标题'))
        } else {
            callback()
        }
        return
    }

    // 关联文章 + 自定义标题：title 必填
    if (formModel.carouselType === 0 && formModel.hasCustomTitle) {
        if (!value || !value.trim()) {
            callback(new Error('请输入自定义标题'))
        } else {
            callback()
        }
        return
    }

    // 关联文章 + 使用文章标题：不需要校验 title
    callback()
}

const validateArticleId = (rule, value, callback) => {
    // 关联文章：articleId 必填
    if (formModel.carouselType === 0 && !value) {
        callback(new Error('请选择关联文章'))
    } else {
        callback()
    }
}

const validateArticleTitle = (rule, value, callback) => {
    // 编辑时关联文章：articleTitle 必填
    if (formModel.id && formModel.articleId && !value) {
        callback(new Error('关联文章不能为空'))
    } else {
        callback()
    }
}

// 自定义校验器：校验轮播图
const validateImg = (rule, value, callback) => {
    // 外链：img 必填
    if (formModel.imgOption === 1) {
        if (!formModel.img) {
            callback(new Error('请上传轮播图'))
        } else {
            callback()
        }
        return
    }
    // 关联文章：img 可选
    callback()
}

// 校验自定义图片链接
const validateCustomImgLink = (rule, value, callback) => {
    if (formModel.imgOption === 2) {
        const link = value ? value.trim() : ''
        if (!link) {
            callback(new Error('请输入图片链接地址'))
        } else if (!/^(http|https):\/\/.*$/.test(link)) {
            // 对齐后端 SystemConstants.URL_PATTERN = "^(http|https)://.*$"
            callback(new Error('请输入以 http:// 或 https:// 开头的图片链接地址'))
        } else {
            callback()
        }
        return
    }
    callback()
}


// 校验规则
const rules = {
    title: [
        { required: true, validator: validateTitle, trigger: 'blur' }
    ],
    articleId: [
        { required: true, validator: validateArticleId, trigger: 'blur' }
    ],
    articleTitle: [
        { required: true, validator: validateArticleTitle, trigger: 'blur' }
    ],
    link:[
        { required: true, message:'请填写外链', trigger: 'blur' }
    ],
    img: [
        { required: true, validator: validateImg, trigger: 'change' }
    ],
    customImgLink: [
        { required: true, validator: validateCustomImgLink, trigger: 'blur' }
    ]
}

// ==================== SmartAutoComplete 联想搜索 ====================

// 前端搜索函数（参考 fetchTags 风格）
const fetchArticles = async (params) => {
    const query = params.keyword || ''
    
    // 如果还没有加载文章列表，先加载
    if (hasPerm('btn.carousel.add') && articleList.value.length === 0) {
        await loadAllArticles()
    }
    
    if (!query) {
        return articleList.value
    }
    
    const lowerQuery = query.toLowerCase()
    
    const matched = articleList.value.filter(item => {
        const text = item.value
        const lowerText = text.toLowerCase()
        
        // 1. 英文直接包含匹配
        if (lowerText.includes(lowerQuery)) {
            return true
        }
        
        // 2. PinyinMatch（中文拼音）
        if (PinyinMatch.match(text, query)) {
            return true
        }
        
        // 3. 单词前缀匹配
        const words = lowerText.split(/[\s\-_]+/)
        for (const word of words) {
            if (word.startsWith(lowerQuery)) {
                return true
            }
        }
        
        // 4. 复合词首字母匹配
        if (words.length > 1) {
            const initials = words.map(word => word[0]).join('')
            if (initials.includes(lowerQuery)) {
                return true
            }
        }
        
        // 5. 单词内字符匹配
        let charIndex = 0
        for (let i = 0; i < lowerText.length && charIndex < lowerQuery.length; i++) {
            if (lowerText[i] === lowerQuery[charIndex]) {
                charIndex++
            }
        }
        if (charIndex === lowerQuery.length) {
            return true
        }
        
        return false
    })
    
    return matched
}

// 监听选中变化，正确获取文章 ID
watch(selectedArticles, (newVal) => {
    if (newVal.length > 0) {
        // 从所有文章列表中查找对应的文章
        const selected = articleList.value.find(item => item.value === newVal[0])
        if (selected) {
            formModel.articleId = selected.id
            formModel.articleTitle = selected.title || selected.value
        }
    } else {
        formModel.articleId = null
        formModel.articleTitle = ''
    }
    // 手动触发 articleId 校验
    // ruleFormRef.value?.validateField('articleId')
}, { deep: true })

// ==================== 新增 ====================

const handleAdd = async () => {
    dialogVisible.value = true
    dialogTitle.value = '新增轮播'

    await nextTick()
    // 重置表单校验状态
    ruleFormRef.value?.resetFields()

    // 重置表单
    Object.assign(formModel, {
        ...defaultForm,
        carouselType: 0
    })
    
    selectedArticles.value = []

    if(formModel.imgOption === 1){
        // 清空上传组件
        uploadRef.value.handleImage('')
    }
}


// ==================== 编辑 ====================

const handleEdit = async (row) => {

    const savedUploadStatus =  formModel.uploadStatus

    // 获取详情
    const res = await getCarouselByIdApi(row.id)
    const data = res.data

    // 详情加载成功后再打开弹窗，避免权限不足时出现空白编辑框
    dialogVisible.value = true
    dialogTitle.value = '编辑轮播'

    await nextTick()

    // 重置表单校验状态
    ruleFormRef.value?.resetFields()

    // 重置表单
    Object.assign(formModel, defaultForm)

    // 回显
    formModel.id = data.id

    // 判断类型：articleId 为 null 则是外链
    if (data.articleId) {
        formModel.carouselType = 0  // 关联文章
        formModel.articleId = data.articleId
        formModel.articleTitle = data.articleTitle
    } else {
        formModel.carouselType = 1  // 外链
        formModel.articleId = null
        formModel.articleTitle = '外链'
    }


    // 轮播标题回显
    if (data.title) {
        formModel.hasCustomTitle = true
        formModel.title = data.title
    } else {
        formModel.hasCustomTitle = false
        formModel.title = ''
    }

    formModel.sort = data.sort || null

    // 如果是从重试进来的，保持 imgOption = 1
    if (savedUploadStatus === 'FAILED') {
        formModel.imgOption = 1
    }

    // 专用图回显
    // 如果是失败状态重试，保留 imgOption = 1，清空图片
    if (savedUploadStatus  === 'FAILED') {
        formModel.imgOption = 1
        formModel.img = ''
        formModel.customImgLink = ''
        await nextTick()
        uploadRef.value.handleImage('')
    } else {
        // 正常编辑，回显图片
        if (data.img) {
            if(data.img && data.img.startsWith('http')){
                // 如果 img 存在且是 http 开头，可能是自定义链接
                formModel.imgOption = 2
                formModel.customImgLink = data.img
            }else {
                formModel.imgOption = 1
                formModel.img = data.img
                formModel.customImgLink = ''
                await nextTick()
                uploadRef.value.handleImage(data.img)
            }
        }else {
            formModel.imgOption = 0
            formModel.img = ''
            formModel.customImgLink = ''
            /* await nextTick()
            uploadRef.value.handleImage('') */
        }
    }

    // 链接回显
    if (data.link) {
        formModel.hasCustomLink = true
        formModel.link = data.link
    } else {
        formModel.hasCustomLink = false
        formModel.link = ''
    }
}

// ==================== 重试 ====================
const handleRetry = (row) => {
    try {
        formModel.uploadStatus = 'FAILED' 
        // 跳转到编辑弹窗，让用户重新上传图片
        handleEdit(row)
        // 在弹窗中，用户可以重新选择图片并提交
        msg.info('请重新选择图片并提交')
    } catch (error) {
        msg.error('打开编辑失败')
    }
}

// ==================== 图片上传（本地预览） ====================

// 图片校验回调
const handleImgValidate = () => {
    nextTick(() => {
        ruleFormRef.value?.validateField('img')
    })
}

// ==================== 切换事件 ====================

// 轮播类型切换
const handleTypeChange = (val) => {
    // 1. 清空所有相关字段
    formModel.articleId = null
    formModel.articleTitle = ''
    formModel.title = ''
    formModel.hasCustomTitle = false
    formModel.imgOption = val === 0 ? 0 : 1
    formModel.img = ''
    formModel.customImgLink = ''
    formModel.link = ''
    formModel.hasCustomLink = false
    selectedArticles.value = []
    
    // 2. 切换类型
    formModel.carouselType = val
    
    // 3. 清除校验状态
    nextTick(() => {
        ruleFormRef.value?.clearValidate(['link', 'title', 'articleId', 'customImgLink'])
    })
}

const handleSortChange = (val) => {
    if (val === 0) {
        formModel.sort = null
    }
}

// 图片选项切换
const handleImgOptionChange = async(val) => {

    if (val === 1){
        await nextTick()
        uploadRef.value.handleImage(formModel.img)
    }
    ruleFormRef.value?.clearValidate(['img', 'customImgLink'])
}

// ==================== 保存 ====================
const handleConfirm = async () => {
        try {

       // 触发表单校验
        await ruleFormRef.value?.validate()

        // 根据 imgOption 构建 img
        let img = null
        if (formModel.imgOption === 1) {
            img = formModel.img
        } else if (formModel.imgOption === 2) {
            img = formModel.customImgLink
        } else {
            img = null
        }

        // 根据 imgOption 决定 uploadStatus
        let uploadStatus = 'PENDING'
        if (formModel.imgOption === 0) {
            // 使用文章封面：图片已存在，无需上传
            uploadStatus = 'SUCCESS'
        } else if (formModel.imgOption === 2 && formModel.customImgLink) {
            // 自定义链接：图片已存在，无需上传
            uploadStatus = 'SUCCESS'
        } else if (formModel.imgOption === 1 && formModel.img) {
            // 使用专用图：需要判断是文件还是已有 URL
            if (formModel.img instanceof File) {
                uploadStatus = 'PENDING'  // 文件需要异步上传
            } else {
                uploadStatus = 'SUCCESS'  // 已有 URL（编辑回显）
            }
        }

        // 构建提交参数
        const params = {
            id: formModel.id,
            articleId: formModel.articleId,
            sort: formModel.sort || 0,
            img: img,
            uploadStatus: uploadStatus
        }

        // 根据类型处理标题和 articleId
        if (formModel.carouselType === 1) {
            // 外链：articleId 为 null，title 为输入的标题
            params.articleId = null
            params.title = formModel.title || null
            params.link = formModel.link || null
        } else {
            // 关联文章：articleId 有值，title 根据 hasCustomTitle 决定
            params.articleId = formModel.articleId
            params.title = formModel.hasCustomTitle ? formModel.title : null
            params.link = formModel.hasCustomLink ? formModel.link : null
        }

        if (formModel.id) {
            // 编辑
            const res = await updateCarouselApi(params)
            msg.primary({
                message: res.message?res.message:'添加成功',
                customClass: 'message-right-top'
            })
        } else {
            // 新增
            const res = await addCarouselApi(params)
            msg.primary({
                message: res.message?res.message:'修改成功',
                customClass: 'message-right-top'
            })
        }
        dialogVisible.value = false
        renderCarouselList()
    } catch (error) {
        console.log(error.message)
        // msg.error(formModel.id ? '修改失败' : '添加失败')
    }
}

// ==================== 删除 ====================

const handleDelete = async (id) => {
    try {
        await removeCarouselApi(id)
        msg.primary('删除成功')
        renderCarouselList()
    } catch (error) {
        msg.error('删除失败')
    }
}

// ==================== 批量选择 ====================

const multipleSelection = ref([])

const handleMultiple = (raw) => {
    multipleSelection.value = raw
}


// 监听进度
const handleCarouselProgress = (event) => {
    const { carouselId, progress } = event.detail
    uploadProgressMap.value.set(carouselId, progress)
}

// 轮播图上传完成回调
const handleCarouselUploadComplete = (event) => {
    const {message} = event.detail
    renderCarouselList()
    msg.primary({
        message,
        customClass: 'message-right-top'
    })
    // formModel.uploadStatus = 'SUCCESS'
}

const handleCarouselUploadFailed = (event) => {
    const { message,businessId } = event.detail
    // 刷新列表，显示占位图或提示
    renderCarouselList()
        msg.error({
          message,
          customClass: 'message-right-top'
    })
    // formModel.uploadStatus = 'FAILED' 
}

onMounted(() => {
    renderCarouselList()

    // 监听轮播图上传事件
    window.addEventListener('carousel-upload-progress', handleCarouselProgress)
    window.addEventListener('carousel-upload-complete', handleCarouselUploadComplete)
    window.addEventListener('carousel-upload-failed', handleCarouselUploadFailed)
})

onUnmounted(()=> {
    
    // 移除事件监听
    window.removeEventListener('carousel-upload-progress', handleCarouselProgress)
    window.removeEventListener('carousel-upload-complete', handleCarouselUploadComplete)
    window.removeEventListener('carousel-upload-failed', handleCarouselUploadFailed)
})
</script>

<style scoped lang="scss">
.form-tip-icon {
    margin-left: 8px;
    color: #909399;
    font-size: 14px;
    cursor: help;
    vertical-align: middle;
}

.avatar-uploader {
    :deep(.el-upload) {
        border: 1px dashed var(--el-border-color);
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: var(--el-transition-duration-fast);
        width: 178px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            border-color: var(--el-color-primary);
        }
    }
}

.avatar {
    width: 178px;
    height: 100px;
    display: block;
    object-fit: cover;
}

.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
