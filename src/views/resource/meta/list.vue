<template>
    <div class="file-meta-container">
        <!-- 搜索区域 -->
        <el-collapse class="search-collapse" v-model="searchActiveNames">
            <el-collapse-item title="" name="search">
        <div class="flex justify-between items-center mb-4">
            <el-form ref="formRef" :model="searchModel" label-width="auto" inline size="small">
                <el-form-item label="业务ID">
                    <SmartAutoComplete
                        v-model="selectedTargetId"
                        :fetch-suggestions-api="fetchBusinessData"
                        placeholder="请输入文章标题/用户昵称/用户名搜索"
                        :max="1"
                        :debounce-delay="300"
                        :min-search-length="1"
                        :multiple-id-mode="true"
                        :auto-search-on-enter="true"
                        @select-multiple-ids="handleSelectMultipleIds"
                        @tag-removed="handleTagRemoved"
                        style="width: 260px"
                    />
                </el-form-item>

                <el-form-item>
                    <el-input
                        v-model="searchModel.targetId"
                        placeholder="业务ID搜索"
                        clearable
                        @input="handleTargetIdInput"
                        style="width: 200px"
                    />
                </el-form-item>

                <el-form-item label="文件类型">
                    <SmartSelector 
                        v-model="searchModel.fileType" 
                        :data="fileTypeOptions" 
                        placeholder="请选择文件类型"
                        style="width: 160px"
                    />
                </el-form-item>

                <el-form-item label="文件UUID">
                    <el-input 
                        v-model="searchModel.uuid" 
                        placeholder="请输入文件UUID" 
                        clearable
                        style="width: 200px"
                    />
                </el-form-item>
                
                <el-form-item label="删除状态">
                    <SmartSelector 
                        v-model="searchModel.isDeleted" 
                        :data="deleteStatusOptions" 
                        placeholder="请选择删除状态"
                        style="width: 160px"
                    />
                </el-form-item>

                <el-form-item>
                    <SmartSelector v-model="searchModel.sortField" :data="fields" style="width: 255px;" placeholder="请选择排序">
                    </SmartSelector>
                </el-form-item>

                <el-form-item>
                    <el-button size="small" :type="searchModel.sortOrder === 'ASC' ? 'primary' : ''" icon="Top" @click="setSortOrder('ASC')" circle plain />
                    <el-button size="small" :type="searchModel.sortOrder === 'DESC' ? 'primary' : ''" icon="Bottom" @click="setSortOrder('DESC')" circle plain />
                </el-form-item>

                <br>

                <el-form-item>
                    <el-select v-model="searchModel.timeField" placeholder="请选择时间" style="width: 120px">
                        <el-option label="请选择时间" value="" :disabled="true"/>
                        <el-option label="创建时间" value="create_time" />
                        <el-option label="修改时间" value="update_time" />
                    </el-select>
                </el-form-item>

                <!-- 快捷日期下拉选择 -->
                <el-form-item>
                    <SmartSelector v-model="quickDate" :data="quickDateOptions" style="width: 150px;" placeholder="快捷日期">
                    </SmartSelector>
                </el-form-item>

                <!-- 开始时间选择器（单边） -->
                <el-form-item label="开始时间">
                    <el-date-picker
                        v-model="startTime"
                        type="datetime"
                        placeholder="选择开始时间"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        :clearable="true"
                        @change="updateStartTime"
                    />
                </el-form-item>

                <!-- 结束时间选择器（单边） -->
                <el-form-item label="结束时间">
                    <el-date-picker
                        v-model="endTime"
                        type="datetime"
                        placeholder="选择结束时间"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        :clearable="true"
                        @change="updateEndTime"
                    />
                </el-form-item>

                <el-form-item>
                    <el-button size="small" type="primary" icon="Search" @click="onSearch" plain>搜索</el-button>
                    <el-button size="small" type="info" icon="Refresh" @click="onReset" plain>重置</el-button>
                </el-form-item>
            </el-form>
        </div>
            </el-collapse-item>
        </el-collapse>

        <!-- 表格区域 -->
        <el-table 
            :data="tableData" 
            style="width: 100%" 
            border
            v-loading="loading"
        >
            <el-table-column prop="id" label="ID" width="80" align="center" />
            
            <el-table-column label="图片" width="200" align="center">
                <template #default="{ row }">
                    <div style="width: 100px; aspect-ratio: 16/9; border-radius: 4px; overflow: hidden; border: 1px solid #ebeef5; margin: 4px auto;">
                        <el-image 
                            :src="row.img"
                            :fit="'cover'"
                            style="width: 100%; height: 100%; cursor: pointer;"
                            :preview-src-list="[row.img]"
                            preview-teleported
                            loading="lazy"
                        />
                    </div>
                </template>
            </el-table-column>

            <el-table-column label="业务名称" width="200" show-overflow-tooltip >
                  <template #default="{ row }">
                     {{  row.title ? row.title : '该业务不存在'  }}
                  </template>
            </el-table-column>
            
            <el-table-column prop="uuid" label="文件UUID" width="200" show-overflow-tooltip />
            
            <el-table-column prop="ossPath" label="OSS路径" min-width="250" show-overflow-tooltip />
            
            <el-table-column prop="fileType" label="文件类型" width="120" align="center">
                <template #default="{ row }">
                    <el-button size="small" :type="getFileTypeTag(row.fileType)" plain>
                        {{ row.targetId && row.targetId > 0 ? getFileTypeLabel(row.fileType): '孤儿' }}
                    </el-button>
                </template>
            </el-table-column>
            
            <el-table-column prop="targetId" label="业务ID" width="120" align="center">
                <template #default="{ row }">
                    <span v-if="row.targetId === 0">-</span>
                    <span v-else>{{ row.targetId }}</span>
                </template>
            </el-table-column>

            <el-table-column prop="isDeleted" label="删除状态" width="100" align="center">
                <template #default="{ row }">
                    <el-button size="small" :type="row.isDeleted === 0 ? 'success' : 'danger'" plain>
                        {{ row.isDeleted === 0 ? '正常' : '已删除' }}
                    </el-button>
                </template>
            </el-table-column>

            <el-table-column v-if="showPermColumn(['btn.meta.update'])" label="操作" width="100" align="center" fixed="right">
                <template #default="{ row }">
                    <el-popconfirm
                        title="确认恢复吗？恢复后正常访问"
                        @confirm="handleRecover(row)"
                    >
                        <template #reference>
                            <el-button size="small" type="danger" v-perm="'btn.meta.update'" :disabled="row.isDeleted === 0" plain>恢复</el-button>
                        </template>
                    </el-popconfirm>
                </template>
            </el-table-column>
            
            <el-table-column prop="createTime" label="创建时间" width="200" align="center">
                <template #default="{ row }">
                    {{ row.createTime }}
                </template>
            </el-table-column>
            
            <el-table-column prop="updateTime" label="更新时间" width="200" align="center">
                <template #default="{ row }">
                    {{ row.updateTime }}
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页区域 -->
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
import { fileMetaListApi, recoverFileMetaApi } from '@/api/filemeta'
import { showPermColumn } from '@/utils/permissions'
import { getAllBusinessDataApi } from '@/api/business'
import SmartSelector from '@/views/components/SmartSelector.vue';
import { reactive, ref, onMounted, watch } from 'vue';
import msg from '@/components/msg';
import SmartAutoComplete from '@/views/components/SmartAutoComplete.vue';
import { useConfigStore } from '@/store/config';
import { useTabStore } from '@/store/tabs';
import { useRoute } from 'vue-router';
import PinyinMatch from 'pinyin-match'
import { dayjs } from 'element-plus'

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

// ==================== 数据定义 ====================

const tableData = ref([]);
const total = ref(0);
const loading = ref(false);
// 缓存所有业务数据（用于联想搜索）
const businessDataCache = ref([]);
const selectedTargetId = ref([]);
// 存储选中的多个ID
const selectedIds = ref('');

// 排序字段选项
const fields = ref([
    { label: '请选择排序', value: '', disabled: true },
    { label: '业务主键ID', value: 'target_id' },
    { label: '创建时间', value: 'create_time' },
    { label: '修改时间', value: 'update_time' }
]);

// 独立的开始和结束时间
const startTime = ref('');
const endTime = ref('');

// 快捷日期下拉
const quickDate = ref('');
const quickDateOptions = [
    { label: '快捷日期', value: '', disabled: true },
    { label: '今天', value: 'today' },
    { label: '昨天', value: 'yesterday' },
    { label: '最近一周', value: 'week' },
    { label: '最近一月', value: 'month' }
];

// 分页参数
const pagination = reactive({
    pageNum: 1,
    pageSize: 10
});

// 搜索模型
const searchModel = reactive({
    uuid: '',
    fileType: '',
    targetIds: '',
    targetId: '',
    isDeleted: null,
    sortField: 'create_time',
    sortOrder: 'DESC',
    timeField: 'create_time',
    createTimeBegin: null,
    createTimeEnd: null,
    updateTimeBegin: null,
    updateTimeEnd: null
});

// ==================== 下拉选项配置 ====================

// 文件类型选项
const fileTypeOptions = [
    { label: '全部', value: '' },
    { label: '头像', value: 'avatar' },
    { label: '封面', value: 'cover' },
    { label: '轮播', value: 'carousel' },
    { label: '内容', value: 'content' },
    { label: '公告', value: 'notice' },
    { label: '孤儿', value: 'orphan' }
];

// 删除状态选项
const deleteStatusOptions = [
    { label: '全部（绕过逻辑删除）', value: null },
    { label: '正常', value: 0 },
    { label: '已删除', value: 1 }
];

// ==================== 工具函数 ====================

/**
 * 获取文件类型标签
 */
const getFileTypeLabel = (type) => {
    const map = {
        'avatar': '头像',
        'cover': '封面',
        'carousel': '轮播图',
        'content': '内容',
        'notice': '公告'
    };
    return map[type] || type;
};

/**
 * 获取文件类型标签颜色
 */
const getFileTypeTag = (type) => {
    const map = {
        'avatar': 'primary',
        'cover': 'success',
        'carousel': 'warning',
        'content': 'info',
        'notice': 'info'
    };
    return map[type] || '';
};

// ==================== SmartAutoComplete 联想搜索 ====================

/**
 * 加载所有业务数据（用于联想搜索）
 * 注意：这里需要包含已删除的记录
 */
const loadBusinessData = async () => {
    try {
        // 传入 true，包含已删除的文件记录
        const res = await getAllBusinessDataApi(true);
        if (res.code === 200) {
            businessDataCache.value = (res.data || []).map(item => ({
                value: item.title,
                id: item.id
            }));
            console.log('加载业务数据:', businessDataCache.value.length, '条');
        }
    } catch (error) {
        console.error('加载业务数据失败:', error);
    }
};

/**
 * 联想搜索函数（参考 fetchArticles 风格）
 */
const fetchBusinessData = async (params) => {
    const query = params.keyword || '';
    
    // 如果还没有加载数据，先加载
    if (businessDataCache.value.length === 0) {
        await loadBusinessData();
    }
    
    if (!query) {
        return businessDataCache.value;
    }
    
    const lowerQuery = query.toLowerCase();
    
    const matched = businessDataCache.value.filter(item => {
        const text = item.value;
        const lowerText = text.toLowerCase();
        
        // 1. 英文直接包含匹配
        if (lowerText.includes(lowerQuery)) {
            return true;
        }
        
        // 2. PinyinMatch（中文拼音）
        if (PinyinMatch.match(text, query)) {
            return true;
        }
        
        // 3. 单词前缀匹配
        const words = lowerText.split(/[\s\-_]+/);
        for (const word of words) {
            if (word.startsWith(lowerQuery)) {
                return true;
            }
        }
        
        // 4. 复合词首字母匹配
        if (words.length > 1) {
            const initials = words.map(word => word[0]).join('');
            if (initials.includes(lowerQuery)) {
                return true;
            }
        }
        
        // 5. 单词内字符匹配
        let charIndex = 0;
        for (let i = 0; i < lowerText.length && charIndex < lowerQuery.length; i++) {
            if (lowerText[i] === lowerQuery[charIndex]) {
                charIndex++;
            }
        }
        if (charIndex === lowerQuery.length) {
            return true;
        }
        
        return false;
    });
    
    return matched;
};

// 处理多ID选择事件
const handleSelectMultipleIds = (data) => {
    console.log('选中的标题:', data.title, '对应的所有ID:', data.ids);

    // 如果 ids 为空，清空搜索条件
    if (!data.ids || data.ids.length === 0) {
        selectedIds.value = ''
        searchModel.targetIds = ''
        onSearch()
        return
    }

    // 将多个ID用逗号拼接成字符串
    selectedIds.value = (data.ids || []).join(',');
    // 赋值给 searchModel.targetIds
    searchModel.targetIds = selectedIds.value;
    
    // 自动触发搜索
    if (selectedIds.value) {
        onSearch();
    }
};

// 处理标签移除事件
const handleTagRemoved = (data) => {
    console.log('标签已移除:', data.tag, '剩余标签:', data.remainingTags)
    
    // 清空选中的ID
    selectedIds.value = ''
    searchModel.targetIds = ''
    
    // 重新触发搜索（刷新列表）
    onSearch()
}

// 监听选中值变化
watch(selectedTargetId, (newVal) => {
    if (newVal.length > 0) {
        // 单个ID模式（当 multipleIdMode 为 false 时使用）
        // 但由于我们启用了 multipleIdMode，由 handleSelectMultipleIds 处理
        // 这里保留作为降级处理
        const selected = businessDataCache.value.find(item => item.value === newVal[0]);
        if (selected) {
            searchModel.targetIds = String(selected.id);
        }
    } else {
        // 清空时重置
        selectedIds.value = [];
    }
}, { deep: true });

// ==================== 排序 & 时间筛选 ====================

// 设置排序方向
const setSortOrder = (order) => {
    searchModel.sortOrder = order
}

// 监听 timeField 变化，重新映射时间参数
watch(() => searchModel.timeField, () => {
    remapTimeParams()
})

// 重新映射时间参数
const remapTimeParams = () => {
    searchModel.createTimeBegin = null
    searchModel.createTimeEnd = null
    searchModel.updateTimeBegin = null
    searchModel.updateTimeEnd = null

    if (searchModel.timeField === 'create_time') {
        searchModel.createTimeBegin = startTime.value || null
        searchModel.createTimeEnd = endTime.value || null
    } else {
        searchModel.updateTimeBegin = startTime.value || null
        searchModel.updateTimeEnd = endTime.value || null
    }
}

// 开始时间变化
const updateStartTime = (value) => {
    startTime.value = value || ''

    if (searchModel.timeField === 'create_time') {
        searchModel.createTimeBegin = value || null
    } else {
        searchModel.updateTimeBegin = value || null
    }
}

// 结束时间变化
const updateEndTime = (value) => {
    endTime.value = value || ''

    if (searchModel.timeField === 'create_time') {
        searchModel.createTimeEnd = value || null
    } else {
        searchModel.updateTimeEnd = value || null
    }
}

// 快捷日期设置
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
            start = new Date(now)
            start.setDate(start.getDate() - 1)
            start.setHours(0, 0, 0, 0)
            end = new Date(now)
            end.setHours(0, 0, 0, 0)
            break
        case 'week':
            start = new Date(now)
            start.setDate(start.getDate() - 7)
            break
        case 'month':
            start = new Date(now)
            start.setMonth(start.getMonth() - 1)
            break
    }

    startTime.value = start ? dayjs(start).format('YYYY-MM-DD HH:mm:ss') : ''
    endTime.value = end ? dayjs(end).format('YYYY-MM-DD HH:mm:ss') : ''

    updateStartTime(startTime.value)
    updateEndTime(endTime.value)
}

// 监听快捷日期变化
watch(quickDate, (val) => {
    if (val) {
        setQuickDate(val)
    }
})

// ==================== 数据请求 ====================

/**
 * 渲染表格数据
 */
const renderFileMeta = async () => {
    loading.value = true;
    try {
        // 过滤空值参数
        const params = {};
        if (searchModel.uuid) params.uuid = searchModel.uuid;
        if (searchModel.fileType) params.fileType = searchModel.fileType;
        if (searchModel.targetIds) params.targetIds = searchModel.targetIds;
        if (searchModel.targetId) params.targetId = searchModel.targetId;
        if (searchModel.isDeleted !== null && searchModel.isDeleted !== '') {
            params.isDeleted = searchModel.isDeleted;
        }
        // 排序参数
        if (searchModel.sortField) {
            params.sortField = searchModel.sortField;
            params.sortOrder = searchModel.sortOrder;
        }
        // 时间筛选参数
        if (searchModel.createTimeBegin) params.createTimeBegin = searchModel.createTimeBegin;
        if (searchModel.createTimeEnd) params.createTimeEnd = searchModel.createTimeEnd;
        if (searchModel.updateTimeBegin) params.updateTimeBegin = searchModel.updateTimeBegin;
        if (searchModel.updateTimeEnd) params.updateTimeEnd = searchModel.updateTimeEnd;

        const res = await fileMetaListApi(
            pagination.pageNum, 
            pagination.pageSize, 
            params
        );
        
        if (res.code === 200) {
            tableData.value = res.data.items || [];
            console.log("==================== res ====================",res)
            total.value = res.data.total || 0;
        } else {
            msg.error(res.msg || '查询失败');
        }
    } catch (error) {
        console.error('查询文件元数据失败:', error);
        msg.error('查询失败，请稍后重试');
    } finally {
        loading.value = false;
    }
};

// 初始加载
renderFileMeta();

// 预加载业务数据
onMounted(() => {
    loadBusinessData();
});

// ==================== 事件处理 ====================

// 业务ID搜索框：仅允许输入数字
const handleTargetIdInput = () => {
    searchModel.targetId = searchModel.targetId.replace(/\D/g, '')
}

/**
 * 页码变化
 */
const onCurrentChange = (page) => {
    pagination.pageNum = page;
    renderFileMeta();
};

/**
 * 每页条数变化
 */
const onSizeChange = (size) => {
    pagination.pageNum = 1;
    pagination.pageSize = size;
    renderFileMeta();
};

/**
 * 搜索
 */
const onSearch = () => {
    pagination.pageNum = 1;
    renderFileMeta();
};

/**
 * 重置
 */
const onReset = () => {
    pagination.pageNum = 1;
    selectedTargetId.value = [];
    selectedIds.value = '';
    Object.assign(searchModel, {
        uuid: '',
        fileType: '',
        targetIds: '',
        targetId: '',
        isDeleted: null,
        sortField: 'create_time',
        sortOrder: 'DESC',
        timeField: 'create_time',
        createTimeBegin: null,
        createTimeEnd: null,
        updateTimeBegin: null,
        updateTimeEnd: null
    });
    startTime.value = '';
    endTime.value = '';
    quickDate.value = '';
    renderFileMeta();
};


/**
 * 恢复文件元数据
 * @param row filemeta对应的一条记录
 */
const handleRecover = async (row) => {
    try {
        const res = await recoverFileMetaApi(row.id);
        if (res.code === 200) {
            msg.primary('恢复成功，缓存已清除');
            renderFileMeta(); // 刷新列表
        } else {
            msg.error(res.msg || '恢复失败');
        }
    } catch (error) {
        console.error('恢复失败:', error);
        msg.error('恢复失败，请稍后重试');
    }
};
</script>

<style scoped lang="scss">

</style>