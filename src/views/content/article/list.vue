<template>
    <el-collapse class="search-collapse" v-model="searchActiveNames">
        <el-collapse-item title="" name="search">
            <div class="layout">
                <el-form ref="formRef" label-width="auto" inline size="small">
            <el-form-item>
                <el-input v-model="searchData.keyword" placeholder="请输入标题 | 内容" />
            </el-form-item>
            <el-form-item>
                <CateSelect v-model="searchData.categoryId"></CateSelect>
            </el-form-item>
            <el-form-item>
                    <el-select  style="width: 200px" v-model="searchData.isTop" placeholder="请选择置顶">
                        <el-option label="置顶" value="1" />
                        <el-option label="非置顶" value="0" />
                    </el-select>
            </el-form-item>
            <el-form-item>
                    <el-select  style="width: 200px" v-model="searchData.status" placeholder="请选择状态">
                        <el-option label="已发布" value="0" />
                        <el-option label="草稿" value="1" />
                    </el-select>
            </el-form-item>

            <el-form-item>

            </el-form-item>

            <el-form-item>
                <SmartSelector v-model="searchData.sortField" :data="fields" style="width: 255px; margin-right: 15px;" placeholder="请选择排序(默认置顶+创建时间)"></SmartSelector>
                <el-button size="small" :type="searchData.sortOrder === 'ASC' ? 'primary' : ''" icon="Top" @click="setSortOrder('ASC')" circle plain />
                <el-button size="small" :type="searchData.sortOrder === 'DESC' ? 'primary' : ''" icon="Bottom" @click="setSortOrder('DESC')" circle plain />
            </el-form-item>
            
            <br>

            <el-form-item>
                <el-select v-model="searchData.timeField" placeholder="请选择时间" style="width: 120px">
                    <el-option label="请选择时间" value="" :disabled="true"/>
                    <el-option label="创建时间" value="create_time" />
                    <el-option label="修改时间" value="update_time" />
                </el-select>
            </el-form-item>

            <!-- 快捷选择按钮组 -->
            <el-form-item>
                <el-button-group>
                    <el-button size="small" :type="activeQuickDate === 'today' ? 'primary' : ''" @click="setQuickDate('today')" plain>今天</el-button>
                    <el-button size="small" :type="activeQuickDate === 'yesterday' ? 'primary' : ''" @click="setQuickDate('yesterday')" plain>昨天</el-button>
                    <el-button size="small" :type="activeQuickDate === 'week' ? 'primary' : ''" @click="setQuickDate('week')" plain>最近一周</el-button>
                    <el-button size="small" :type="activeQuickDate === 'month' ? 'primary' : ''" @click="setQuickDate('month')" plain>最近一月</el-button>
                </el-button-group>
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
                
            <template class="flex">
                <el-form-item>
                        <el-button size="small" type="primary" icon="Search" @click="onSearch" plain>搜索</el-button>
                        <el-button size="small" type="info" icon="Refresh" @click="onReset" plain>重置</el-button>
                </el-form-item>

                <el-form-item style="margin-left:auto; margin-right:0">
                    <el-button size="small" type="primary" v-perm="'btn.article.add'" icon="Plus" @click="handleAdd({})" plain>新增</el-button>
                </el-form-item>
            </template>
        </el-form>
            </div>
        </el-collapse-item>
    </el-collapse>

    <el-table v-loading="loading" :data="tableData" :style="{ width: '100%' }" :max-height="tableMaxHeight">
        <el-table-column type="index" label="序号" width="55"></el-table-column>
        <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip/>
        <el-table-column label="封面" width="124px">
            <template #default="{row}">
                <el-image style="width: 100px; height: 56px; border-radius: 4px;"  :src="handleImage(row)" :fit="'cover'" preview-teleported :preview-src-list="[handleImage(row)]"/>
            </template>
        </el-table-column>
        <el-table-column prop="cateName" label="分类" min-width="100" align="center"/>
        <el-table-column label="置顶" min-width="90">
            <template #default="{row}">
                <el-switch v-model="row.isTop" size="small" active-value="1" inactive-value="0" @change="modifySwitch(row)"/>
            </template>
        </el-table-column>
        <el-table-column label="状态" min-width="90">
              <template #default="{row}">
                 <el-button size="small" type="success" v-if="row.status === '0'" plain>已发布</el-button>
                 <el-button size="small" type="info" v-else plain>草稿</el-button>
              </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建日期" width="185" />
        <el-table-column prop="updateTime" label="修改日期" width="185" />
        <el-table-column label="操作" width="270" fixed="right">
            <template #default="{row}">
                <el-button size="small" type="info" @click="handlePreview(row)" plain>预览</el-button>
                <el-button size="small" type="warning" v-perm="'btn.article.update'" @click="handleEdit(row)" plain>编辑</el-button>
                <el-popconfirm :title="`你确定要删除 ${row.title} 吗`" @confirm="handleDelete(row.id)" width="250px" icon="WarnTriangleFilled">
                    <template #reference>
                        <el-button size="small" type="danger" v-perm="'btn.article.remove'" plain>删除</el-button>
                    </template>
                </el-popconfirm>
                <el-button size="small" type="success" @click="handleDownload(row)" plain>下载</el-button>
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

    <ArticleEdit ref="maskRef" @reRender="render"></ArticleEdit>

    <!-- 文章预览弹窗 -->
    <el-dialog v-model="previewVisible" :title="previewTitle" width="50%" top="2vh" destroy-on-close
        class="preview-dialog">
        <div :class="{ 'dark-mode': userConfigStore.isDarkEnabled }">
            <component :is="MarkdownPreview" :key="userConfigStore.isDarkEnabled" :text="previewContent" @click="handleCopyCodeSuccess" />
        </div>
    </el-dialog>
   
</template>

<script setup>
import { isTopApi, listApi, removeApi } from '@/api/article';
import CateSelect from '@/views/components/CateSelect.vue';
import { ref, watch, defineAsyncComponent, computed } from 'vue';
import SmartSelector from '@/views/components/SmartSelector.vue';
import { dayjs, ElMessageBox } from 'element-plus';
import msg from '@/components/msg';
import { useUserConfigStore } from '@/store/userConfig';
import { useArticleDraftStore } from '@/store/articleDraft';
import { useSettingStore } from '@/setting';
import { useTabStore } from '@/store/tabs';
import { useRoute } from 'vue-router';
import { useTableAutoHeight } from '@/utils/useTableAutoHeight';
const userConfigStore = useUserConfigStore()
// 懒加载文章编辑器（完整 markdown 编辑器），仅打开新增/编辑弹窗时加载
const ArticleEdit = defineAsyncComponent(() => import('@/views/components/ArticleEdit.vue'))
const draftStore = useArticleDraftStore()
const settingStore = useSettingStore()
const tabStore = useTabStore()

// 搜索面板折叠：优先读 tabStore 保存的偏好，无记录时回退 settingStore 本地默认值
const route = useRoute()
const saved = tabStore.collapseStates[route.path]
const searchActiveNames = ref(
    saved !== undefined ? saved : (settingStore.collapseSearchEnabled ? [] : ['search'])
)
watch(searchActiveNames, (val) => {
    tabStore.setCollapseState(route.path, val)
})

// 表格高度自适应：扣除搜索面板与分页占位，保证页面永不溢出
const { tableMaxHeight } = useTableAutoHeight()

import cover from '@/assets/images/cover-rect.png'

const handleImage = (row) => {
    if(row.cover) return row.cover
    else return cover
}

//搜索相关
const searchData = ref({
        // sortField: 'create_time',  // 保留默认排序字段
        sortOrder: 'DESC',           // 保留默认排序方向
        timeField: 'create_time',  // 默认按创建时间筛选
})

const params = ref({
    pageNum :1,
    pageSize : 10
})

const total = ref(null)

const tableData = ref([])

// 默认关闭loading
const loading = ref(false)

// 独立的开始和结束时间
const startTime = ref('')
const endTime = ref('')

// t_article_request：文章列表请求
const render = async() => {
    // 开启loading动效
    loading.value = true
    try {
        const res = await listApi(params.value.pageNum,params.value.pageSize,searchData.value)
        console.log(res)
        tableData.value = res.data.items
        total.value = res.data.total
    } catch (e) {
    } finally {
        // 关闭loading动效
        loading.value = false
    }
}

render()

//点击分页事件
const onSizeChange = (size) => {
    //console.log(`onSizeChange：每页显示${size}条`)
    //每页条数发生变化时，重新从第一页渲染
    params.value.pageNum = 1
    //更新每页条数
    params.value.pageSize = size
    //重新渲染
    render()
}

const onCurrentChange = (page) => {
    //console.log(`onCurrentChange：当前第${page}页`)
    //更新当前页
    params.value.pageNum = page
    //重新渲染
    render()
}

const onSearch = () => {
    /* if(Boolean(searchData.value.sortField) != Boolean(searchData.value.sortOrder)){
        msg.error(searchData.value.sortField?'请选择排序':'请选择排序字段')
    } */
    params.value.pageNum = 1
    render()
}

const onReset = () => {
    params.value.pageNum = 1
    searchData.value = {
        // sortField: 'create_time',  // 保留默认排序字段
        sortOrder: 'DESC',           // 保留默认排序方向
        timeField: 'create_time',  // 默认按创建时间筛选
    }
    startTime.value = ''   // 清空开始时间
    endTime.value = ''     // 清空结束时间
    activeQuickDate.value = ''  // 清空快捷按钮高亮状态
    render()
}

const maskRef = ref()

const handleAdd = async (param) => {
    if (draftStore.hasDraft) {
      try {
        await ElMessageBox.confirm(
          '检测到未完成的草稿，是否继续编辑？',
          '提示',
          { confirmButtonText: '继续编辑', cancelButtonText: '新建文章', type: 'info' }
        )
      } catch {
        // 用户选择"新建文章" — 清除草稿
        draftStore.clearDraft()
      }
    }
    maskRef.value.openMask()
    maskRef.value.handleToggle(param)
}

const handleEdit = (param) => {
    maskRef.value.openMask()
    maskRef.value.handleToggle(param)
}

// t_article_request：文章删除请求
const handleDelete = async(id) => {
    console.log(id)
    await removeApi(id)
    msg.primary('删除成功')
    render()
}

//  t_article_request：更改文章状态请求
const modifySwitch = async(row) =>{
    
   const res = await isTopApi(row.id,row.isTop)
    // row.isTop === "1" ? msg.primary('已置顶'):msg.error('已取消置顶')
    // 根据返回的 message 显示不同的提示
    if (res.message && res.message.includes("自动取消")) {
        msg.warning(res.message)  // 警告提示
    } else {
        msg.primary(res.message)  // 成功提示
    }
    render()
}

// 设置排序方向
const setSortOrder = (order) => {
  searchData.value.sortOrder = order
}

const fields = ref([
    {label:'请选择排序(默认置顶+创建时间)',value:''},
    {label:'文章标题',value:'title'},
    {label:'创建时间',value:'create_time'},
    {label:'修改时间',value:'update_time'},
])


// 监听 timeField 变化，重新生成时间参数
watch(() => searchData.value.timeField, () => {
    // 重新映射当前的时间值到新的时间字段
    remapTimeParams()
})

// 重新映射时间参数
const remapTimeParams = () => {
    // 清空所有时间字段
    searchData.value.createTimeBegin = null
    searchData.value.createTimeEnd = null
    searchData.value.updateTimeBegin = null
    searchData.value.updateTimeEnd = null
    
    // 根据当前 timeField 设置对应的时间字段
    if (searchData.value.timeField === 'create_time') {
        searchData.value.createTimeBegin = startTime.value || null
        searchData.value.createTimeEnd = endTime.value || null
    } else {
        searchData.value.updateTimeBegin = startTime.value || null
        searchData.value.updateTimeEnd = endTime.value || null
    }
}

// 开始时间变化
const updateStartTime = (value) => {
    startTime.value = value || ''
    
    if (searchData.value.timeField === 'create_time') {
        searchData.value.createTimeBegin = value || null
    } else {
        searchData.value.updateTimeBegin = value || null
    }
}

// 结束时间变化
const updateEndTime = (value) => {
    endTime.value = value || ''
    
    if (searchData.value.timeField === 'create_time') {
        searchData.value.createTimeEnd = value || null
    } else {
        searchData.value.updateTimeEnd = value || null
    }
}

// 添加激活状态
const activeQuickDate = ref('')

// 快捷日期设置
const setQuickDate = (type) => {

    // 更新激活状态
    activeQuickDate.value = type

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
    
    // 触发时间更新
    updateStartTime(startTime.value)
    updateEndTime(endTime.value)
}

// ==================== 预览相关 ====================
const previewVisible = ref(false)
const previewTitle = ref('')
const previewContent = ref('')

// Markdown 预览组件：懒加载 v-md-editor + 跟随深浅模式实时切换主题（computed + key）
const MarkdownPreview = computed(() => {
  const theme = userConfigStore.isDarkEnabled ? 'vuepress' : 'github'
  return defineAsyncComponent(() =>
    import('@/utils/markdown-config').then((m) =>
      m.createMarkdownPreview(theme, true),
    ),
  )
})

const handlePreview = (row) => {
  previewTitle.value = row.title
  previewContent.value = row.content || ''
  previewVisible.value = true
}

/** 下载文章为 .md 文件 */
const handleDownload = (row) => {
  const blob = new Blob([row.content || ''], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${row.title || 'article'}.md`
  a.click()
  URL.revokeObjectURL(url)
}

/** copy-code 插件复制成功后显示 ✓ — click 事件委托只标记被点击的按钮 */
const handleCopyCodeSuccess = (e) => {
  const btn = e.target.closest('.v-md-copy-code-btn')
  if (!btn) return
  btn.classList.add('copied')
  setTimeout(() => btn.classList.remove('copied'), 1500)
}

</script>

<style lang="scss" scoped>
.layout {
    @include flex(space-between,null,null);

    :deep(.el-form) {
        width: 100%;
    }
}
</style>

<style lang="scss">
/* 预览弹窗毛玻璃遮罩 — :has() 精确定位该 dialog 的 overlay */
.el-overlay:has(.preview-dialog) {
  background-color: rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
}

/* 预览弹窗滚动条 — 半透明模拟 config 模块风格 */
.el-overlay:has(.preview-dialog) .el-overlay-dialog::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.el-overlay:has(.preview-dialog) .el-overlay-dialog::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--el-color-primary-light-5) 45%, transparent);
  border-radius: 2px;
}

.el-overlay:has(.preview-dialog) .el-overlay-dialog::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--el-color-primary) 60%, transparent);
}

.el-overlay:has(.preview-dialog) .el-overlay-dialog::-webkit-scrollbar-track {
  background: transparent;
}
</style>