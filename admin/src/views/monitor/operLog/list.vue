<template>
        <el-collapse class="search-collapse" v-model="searchActiveNames">
            <el-collapse-item title="" name="search">
        <el-form label-width="auto" inline size="small">
            <el-form-item>
                <el-input v-model="searchData.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item>
            <el-select style="width: 200px" v-model="searchData.module" placeholder="请选择模块类型">
                <el-option
                v-for="item in enumOptions.modules"
                :key="item.value"
                :label="displayMode === 'label' ? item.label : item.value"
                :value="item.value"
                />
            </el-select>
            </el-form-item>
            <el-form-item>
                <el-select style="width: 200px" v-model="searchData.type" placeholder="请选择操作类型">
                <el-option
                v-for="item in enumOptions.types"
                :key="item.value"
                :label="displayMode === 'label' ? item.label : item.value"
                :value="item.value"
                :disabled="disabledTypes.includes(item.value)"
                />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-select style="width: 200px" v-model="searchData.reqMode" placeholder="请选择请求方式">
                    <el-option value="POST">POST</el-option>
                    <el-option value="PUT">PUT</el-option>
                    <el-option value="DELETE">DELETE</el-option>
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-date-picker
                    v-model="searchData.createTimeBegin"
                    type="date"
                    placeholder="开始日期"
                    value-format="YYYY-MM-DD"
                    :disabled-date="(date) => searchData.createTimeEnd ? date > new Date(searchData.createTimeEnd) : false"
                />
                <span style="margin: 0 8px">至</span>
                <el-date-picker
                    v-model="searchData.createTimeEnd"
                    type="date"
                    placeholder="结束日期"
                    value-format="YYYY-MM-DD"
                    :disabled-date="(date) => searchData.createTimeBegin ? date < new Date(searchData.createTimeBegin) : false"
                />
            </el-form-item>
            <el-form-item>
                <el-button size="small" type="primary" icon="Search" @click="onSearch" plain>搜索</el-button>
                <el-button size="small" type="info" icon="Refresh" @click="onReset" plain>重置</el-button>
                <el-button size="small" type="danger" @click="deleteSelectRows()" plain>批量删除</el-button>
            </el-form-item>
            <el-form-item>
            <el-form-item label="显示模式">
                <el-radio-group v-model="displayMode" size="small">
                    <el-radio label="value">显示编码</el-radio>
                    <el-radio label="label">显示中文</el-radio>
                </el-radio-group>
            </el-form-item>
            </el-form-item>
        </el-form>
            </el-collapse-item>
        </el-collapse>
        <el-table :data="tableData" :style="{ width: '100%' }" @selection-change="removeMultiple">
            <el-table-column type="selection" :selectable="selectable" width="55" />
            <el-table-column type="index" label="序号"  width="60"/>
            <el-table-column prop="username" label="操作用户"  />
            <el-table-column  label="操作模块">
                <template #default="{row}">
                    {{ displayMode === 'label' ? row.moduleLabel : row.module }}
                </template>
            </el-table-column>
            <el-table-column label="操作类型">
                <template #default="{row}">
                    <el-tag :type="getTagType(row.type)" size="small">
                         {{ displayMode === 'label' ? row.typeLabel : row.type  }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column  label="请求方式">
                <template #default="{row}">
                       <el-tag :type="getTagType(row.reqMode)" size="small">{{ row.reqMode }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="createTime" label="操作时间" />
            <el-table-column width="150">
                <template #default="{row}">
                    <el-button size="small" type="info" @click="onDetail(row)" icon="MoreFilled" circle plain/>
                    <el-popconfirm :title="`你确定要删除这条数据吗`" @confirm="removeRow(row.id)" width="250px" icon="WarnTriangleFilled">
                        <template #reference>
                    <el-button size="small" type="danger" icon="Delete" circle plain/>
                        </template>
                    </el-popconfirm>
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

        <el-dialog v-model="dialogVisible" title="查看日志详情" width="50%">
          <!--   <el-form  :model="formModel" :rules="rules" label-width="120px" class="demo-ruleForm"
                :size="formSize" status-icon>
                <el-form-item label="IP地址" >
                    <el-input  v-model="formModel.ipaddr" />
                </el-form-item>

                <el-form-item label="请求路径" >
                    <el-input  v-model="formModel.reqUrl" />
                </el-form-item>

                <el-form-item label="方法名称" >
                    <el-input  v-model="formModel.method" />
                </el-form-item>

                <el-form-item label="请求参数" >
                    <el-input  v-model="formModel.reqParam" />
                </el-form-item>

                <el-form-item label="响应数据" >
                    <el-input  v-model="formModel.resData" />
                </el-form-item>
            </el-form> -->

              <el-tabs type="border-card">
                <!-- 基础信息 -->
                <el-tab-pane label="基础信息">
                <el-descriptions :column="1" border>
                    <el-descriptions-item label="IP地址">{{ formModel.ipaddr }}</el-descriptions-item>
                    <el-descriptions-item label="请求路径">{{ formModel.reqUrl }}</el-descriptions-item>
                    <el-descriptions-item label="方法名称">{{ formModel.method }}</el-descriptions-item>
                </el-descriptions>
                </el-tab-pane>

                <!-- 请求参数 -->
                <el-tab-pane label="请求参数">
                <!-- <v-md-editor 
                    :model-value="formatJson(formModel.reqParam)" 
                    mode="preview"
                    height="400px"
                    @copy-code-success="handleCopySuccess"
                /> -->

                    <component 
                    :is="MarkdownPreview" 
                    :model-value="formatJson(formModel.reqParam)"
                     mode="preview"
                    @copy-code-success="handleCopySuccess"
                    :key="userConfigStore.isDarkEnabled"
                      />  
                </el-tab-pane>

                <!-- 响应数据 -->
                <el-tab-pane label="响应数据">
                <!-- <v-md-editor 
                    :model-value="formatJson(formModel.resData)" 
                    mode="preview"
                    height="400px"
                    @copy-code-success="handleCopySuccess"
                /> -->

                    <component 
                    :is="MarkdownPreview" 
                    :model-value="formatJson(formModel.resData)"
                     mode="preview"
                    @copy-code-success="handleCopySuccess"
                    :key="userConfigStore.isDarkEnabled"
                      /> 
                </el-tab-pane>
            </el-tabs>
            <template #footer>
                <span class="dialog-footer">
                    <el-button size="small" type="info" @click="dialogVisible = false" plain>关闭</el-button>
                </span>
            </template>
        </el-dialog>
</template>

<script setup>
import { operlogEnumsListApi, operlogListApi, operLogRemoveApi } from '@/api/log';
import { reactive, ref,computed,watch } from 'vue';
import { useUserConfigStore } from '@/store/userConfig'
import { useConfigStore } from '@/store/config';
import { useTabStore } from '@/store/tabs';
import { useRoute } from 'vue-router';
import { createMarkdownPreview } from '@/utils/markdown-config'
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
// 使用 computed 每次重新创建组件
const MarkdownPreview = computed(() => {
  console.log('创建主题:', userConfigStore.isDarkEnabled?"vuepress":"github")
  return createMarkdownPreview(userConfigStore.isDarkEnabled?"vuepress":"github")
})

const tableData = ref([])

const params = reactive({
    pageNum: 1,
    pageSize: 10
})

const displayMode = ref('label')

const total = ref(null)

const searchData = reactive({})

const render = async() => {
    const res = await operlogListApi(params.pageNum,params.pageSize,searchData)
    tableData.value = res.data.items
    total.value = res.data.total
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

const enumOptions = ref({
  modules: [],
  types: []
})

// 获取枚举值
const loadEnums = async () => {
    const res = await operlogEnumsListApi()
    enumOptions.value = {
      modules: res.data.modules, // 已经是[{value, label}]格式
      types: res.data.types      // 已经是[{value, label}]格式
    }
}

loadEnums()

const onSearch = () => {
    params.pageNum = 1
    render()
}

const onReset = () => {
    params.pageNum = 1
    Object.assign(searchData,{username:'',module:'',type:'',reqMode:'',createTimeBegin:'',createTimeEnd:''})
    render()
}

const dialogVisible = ref(false)
const formModel = reactive({})

const onDetail = (row) => {
    dialogVisible.value = true
    Object.assign(formModel,{...row})
}

// JSON格式化（添加Markdown代码块语法）
const formatJson = (str) => {
  try {
    const parsed = JSON.parse(str)
    return '```json\n' + JSON.stringify(parsed, null, 2) + '\n```'
  } catch {
    return str // 非JSON数据保持原样
  }
}

const getTagType = (type) => {

// 如果类型以 BATCH_ 开头，返回 'danger'
  if (type?.startsWith('BATCH_')) {
    return 'danger';
  }

  if(type?.endsWith('_AUTH')){
    return 'success'
  }

  if(type?.includes('AUDIT')){
    return 'warning'
  }

  const typeMap = {
    INSERT: 'primary',
    UPDATE: 'warning',
    DELETE: 'danger',
    POST:'primary',
    PUT: 'warning'

  }
  return typeMap[type] || 'info'
}

const multipleSelection = ref([])

// t_log_request：操作日志删除请求
const removeRow = async(id) => {
    await operLogRemoveApi(id)
    msg.primary('删除成功')
    render()
}

const removeMultiple = (raw) =>{
    console.log(raw)
    multipleSelection.value = raw
    // console.log(multipleSelection.value)
}

// t_log_request：操作日志批量删除请求
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
   await removeRow(rowIds)

}

// 操作类型禁用
const disabledTypes = computed(() => {
  const { module } = searchData;

  // 未选择模块时，不禁用任何选项
  if (!module) {
    return [];
  }
  
  // 默认禁用项（适用于所有模块）
  const defaultDisabled = ['BATCH_INSERT', 'BATCH_UPDATE', 'USER_AUTH', 'ROLE_AUTH', 'AUDIT', "BATCH_AUDIT", 'PUSH'];
  
  // 按模块动态调整
  switch (module) {
    case 'CATE': // 分类管理
      return ['USER_AUTH', 'ROLE_AUTH', 'AUDIT', 'BATCH_AUDIT', 'PUSH'];
    case 'USER': // 用户管理
      return ['ROLE_AUTH', 'BATCH_INSERT', 'BATCH_UPDATE', 'AUDIT', 'BATCH_AUDIT', 'PUSH'];
    case 'ROLE': // 角色管理
      return ['USER_AUTH', 'BATCH_INSERT', 'BATCH_UPDATE', 'AUDIT', 'BATCH_AUDIT', 'PUSH'];
    case 'ARTICLE': // 文章管理
      return ['ROLE_AUTH', 'USER_AUTH', 'BATCH_INSERT', 'BATCH_UPDATE',  'BATCH_DELETE', 'AUDIT', 'BATCH_AUDIT', 'PUSH'];
    case 'COMMENT': // 评论管理
      return ['USER_AUTH', 'ROLE_AUTH', 'BATCH_INSERT', 'UPDATE', 'BATCH_UPDATE', 'PUSH'];
    case 'TASK': // 任务管理
      return ['USER_AUTH', 'ROLE_AUTH', 'BATCH_INSERT', 'BATCH_UPDATE', 'BATCH_DELETE', 'AUDIT', 'BATCH_AUDIT', 'PUSH'];
    case 'CAROUSEL': // 轮播管理
      return ['ROLE_AUTH', 'USER_AUTH', 'BATCH_INSERT', 'BATCH_UPDATE',  'BATCH_DELETE', 'AUDIT', 'BATCH_AUDIT', 'PUSH'];
    case 'META': // 元数据管理
      return ['INSERT', 'DELETE','ROLE_AUTH', 'USER_AUTH', 'BATCH_INSERT', 'BATCH_UPDATE',  'BATCH_DELETE', 'AUDIT', 'BATCH_AUDIT', 'PUSH'];
    case 'CONFIG': // 配置管理
      return ['ROLE_AUTH', 'USER_AUTH', 'BATCH_INSERT', 'BATCH_UPDATE',  'BATCH_DELETE', 'AUDIT', 'BATCH_AUDIT', 'PUSH'];
    case 'NOTICE': // 公告管理
      return ['ROLE_AUTH', 'USER_AUTH', 'BATCH_INSERT', 'BATCH_UPDATE', 'AUDIT', 'BATCH_AUDIT'];
    default: // 其他模块
      return defaultDisabled;
  }
});

watch(() => searchData.module, (newModule) => {
  searchData.type = ''; // 清空已选类型
});

// 处理用户选择复制回调
const handleCopySuccess = () => {
  const copyButtons = document.querySelectorAll('.v-md-copy-code-btn')
  
  copyButtons.forEach(btn => {
    // 添加copied类
    btn.classList.add('copied')
    
    // 1.5秒后移除
    setTimeout(() => {
      btn.classList.remove('copied')
    }, 1500)
  })
}

// 确保预览组件渲染完成后监听
onMounted(() => {
  const preview = document.querySelector('.v-md-editor-preview')
  if (preview) {
    new MutationObserver(() => {
      // 重新绑定事件监听器
    }).observe(preview, { childList: true, subtree: true })
  }
})

</script>

<style scoped lang="scss">
/* 调整编辑器内边距 */
.v-md-editor-preview {
  padding: 0 16px;
}

/* 标签页高度控制 */
.el-tabs {
  max-height: auto;
  overflow: auto;
}

/* 基础信息描述列表样式 */
.el-descriptions {
  margin-top: 10px;
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

:deep(.v-md-editor-preview .vuepress-markdown-body){
  background: black !important;
}

// vuepress主题下的v-md-editor-右边的预览区 代码块颜色
:deep(.v-md-editor__preview-wrapper .vuepress-markdown-body code){
    color: $code-color !important;
    .token .operator{
        background-color: transparent !important;
    }

    .token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string{
        background-color: transparent !important;
    }
}
</style>