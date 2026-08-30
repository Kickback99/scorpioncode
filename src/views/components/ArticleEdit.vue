<template>
     <Mask :maskVisible="maskVisible" :backLabel="isWriteEntry ? '清空' : '返回'" @closeMask="handleCloseMask" @openDialog="handleOpenDialog">

        <el-form :model="blogData" ref="blogFormRef" :rules="rules">
            <el-form-item prop="title">
                    <el-input
                    ref="titleInputRef"
                    :style="{backgroundColor:userConfigStore.isDarkEnabled?'#000':'#fff'}"
                    :class="{'dark-mode':userConfigStore.isDarkEnabled}"
                    placeholder="请输入标题" v-model="blogData.title" />
            </el-form-item>

            <div
            :style="{ height: hasSelectedArticle ? IMAGE_REFERENCE_EXPANDED_HEIGHT : IMAGE_REFERENCE_COLLAPSED_HEIGHT }"
            style="transition: height 0.3s ease; overflow: hidden;"
            >
              <ImageReference
                ref="imageReferenceRef"
                :article-id="formModel.id"
                :article-title="blogData.title"
                layout="horizontal"
                title="引用图片"
                search-label="搜索"
                search-placeholder="请输入文章标题搜索已上传的图片"
                :show-clear="false"
                :show-hint="false"
                :disabled="false"
                :showImageTypeSwitch="true"
                image-type="all"
                empty-text="该文章暂无内容图"
                display-field="uuid"
                @select-article="handleImageSelectArticle"
                @remove-article="handleImageRemoveArticle"
                @insert-image="handleImageInsert"
                @clear="handleImageClear"
                @update:selected="handleSelectedChange"
              />
            </div>

            <el-form-item prop="content">
                <Markdown :height="395" v-model="blogData.content"></Markdown>
            </el-form-item>
        </el-form>

        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="30%" @close="hasSelectedArticle = (imageReferenceRef?.getImageList()?.length || 0) > 0">
            <el-form ref="formRef" :model="formModel" :rules="dialogRules" label-width="auto" size="small">
                <el-form-item label="文章描述" prop="description">
                    <el-radio-group v-model="formModel.descriptionType" @change="handleDescriptionTypeChange">
                        <el-radio :label="'auto'">自动生成</el-radio>
                        <el-radio :label="'empty'">留空</el-radio>
                        <el-radio :label="'custom'">自定义</el-radio>
                    </el-radio-group>
                </el-form-item>
                <!-- 自定义摘要输入框（条件渲染） -->
                <el-form-item v-if="formModel.descriptionType === 'custom'" prop="customDescription">
                    <el-input
                    v-model="formModel.customDescription"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入自定义摘要"
                    maxlength="150"
                    show-word-limit
                    />
                </el-form-item>
                <el-form-item label="文章分类" prop="categoryId">
                    <CateSelect v-model="formModel.categoryId"></CateSelect>
                </el-form-item>

              <!-- 将el-input-tag放在el-form-item中 -->
              <el-form-item label="文章标签" prop="tagNames">
                <SmartAutoComplete
                    v-model="formModel.tagNames"
                    :fetch-suggestions-api="fetchTags"
                    :separators="/[\s\-_\.\/:]+/"
                    placeholder="请输入标签名称"
                    :max="10"
                    :debounce-delay="100"
                    :min-search-length="1"
                />
              </el-form-item>

              <!-- 文章封面：支持文件上传 / 自定义链接 / 引用封面 三种模式 -->
              <el-form-item label="文章封面">
                  <el-radio-group v-model="formModel.coverOption" @change="handleCoverOptionChange">
                      <el-radio :label="'upload'">文件上传</el-radio>
                      <el-radio :label="'custom'">自定义链接</el-radio>
                       <el-radio :label="'ref'">引用封面</el-radio>
                  </el-radio-group>
              </el-form-item>

              <!-- 文件上传模式 -->
              <el-form-item v-if="formModel.coverOption === 'upload'" label=" " prop="cover">
                  <SmartUpload ref="uploadRef" v-model="formModel.cover" :onValidate="handleCoverValidate"></SmartUpload>
              </el-form-item>

              <!-- 自定义链接模式 -->
              <el-form-item v-if="formModel.coverOption === 'custom'" label=" " prop="customCoverLink">
                  <el-input
                      v-model="formModel.customCoverLink"
                      placeholder="请输入图片链接地址，如：https://example.com/cover.jpg"
                  />
                  <el-tooltip placement="right">
                      <template #content>
                          <div>输入图片的 URL 地址，将直接作为文章封面使用</div>
                      </template>
                      <el-icon class="form-tip-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
              </el-form-item>

              <!-- 引用封面模式 -->
              <el-form-item v-if="formModel.coverOption === 'ref'" label=" " prop="refCover">
                <div class="cover-reference-wrapper">
                  <SmartAutoComplete
                    v-model="selectedCoverArticle"
                    :fetch-suggestions-api="fetchArticleForCover"
                    placeholder="请输入文章标题搜索封面"
                    :max="1"
                    :debounce-delay="300"
                    :min-search-length="1"
                    :auto-search-on-enter="true"
                    :allow-custom="false"
                    custom-disabled-message="请选择已存在的文章"
                    style="width: 100%"
                    @tag-removed="handleCoverArticleRemoved"
                  />
                  <!-- 封面预览 -->
                  <div v-if="formModel.refCover" class="cover-preview">
                    <el-image
                      :src="formModel.refCover"
                      fit="contain"
                      class="cover-image"
                    />
                  </div>
                </div>
              </el-form-item>

              <!-- 文章开关设置：置顶 / 轮播 / 评论 -->
              <el-form-item label="文章设置">
                  <div class="article-switches">
                      <div class="switch-item">
                          <span class="switch-label">是否置顶</span>
                          <el-switch v-model="formModel.isTop" active-value="1" inactive-value="0" />
                      </div>
                      <div class="switch-item">
                          <span class="switch-label">是否轮播</span>
                          <el-switch v-model="carouselData.isCarousel" @change="handleCarouselChange" />
                      </div>
                      <div class="switch-item">
                          <span class="switch-label">是否评论</span>
                          <el-switch v-model="formModel.isComment" active-value="1" inactive-value="0" />
                      </div>
                  </div>
              </el-form-item>

              <!-- 轮播排序输入框（条件渲染） -->
              <el-form-item v-if="carouselData.isCarousel" label="轮播排序">
                  <el-input-number
                      v-model="carouselData.sort"
                      :min="0"
                      :max="999"
                      controls-position="right"
                      placeholder="自动"
                      style="width:150px;"
                      class="carousel-input"
                       @change="handleSortChange"
                  />
                  <el-tooltip placement="right">
                  <template #content>
                      <div>
                        <span>数字越小越靠前，留空自动排最后</span>
                      </div>
                  </template>
                  <el-icon class="form-tip-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </el-form-item>

            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button size="small" type="info" @click="dialogVisible = false; hasSelectedArticle = (imageReferenceRef?.getImageList()?.length || 0) > 0" plain>取消</el-button>
                    <el-button size="small" type="warning" @click="handlePublish(1)" plain>草稿</el-button>
                    <el-button size="small" type="primary" @click="handlePublish(0)" plain>发布</el-button>
                </span>
            </template>
        </el-dialog>
     </Mask>
</template>

<script setup>
// 框架核心
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'

// 组件
import Mask from './Mask.vue'
import Markdown from '@/components/Markdown.vue'
import CateSelect from './CateSelect.vue'
import SmartUpload from '@/views/components/SmartUpload.vue'
import SmartAutoComplete from './SmartAutoComplete.vue'
import ImageReference from '@/views/components/ImageReference.vue'

// Store
import { useUserConfigStore } from '@/store/userConfig'
import { useArticleDraftStore } from '@/store/articleDraft'
import { useConfigStore } from '@/store/config'

// 第三方
import PinyinMatch from 'pinyin-match'

// API / 工具
import { addApi, findApi, getCarouselByArticleApi, modifyApi, uploadCoverApi } from '@/api/article.js'
import { getTagListApi, getArticleBusinessDataApi } from '@/api/business'
import { fileMetaListApi } from '@/api/filemeta'
import msg from '@/components/msg'

// ============================================================
// 数据
// ============================================================

const route = useRoute()
const userConfigStore = useUserConfigStore()
const draftStore = useArticleDraftStore()
const configStore = useConfigStore()

const emit = defineEmits(['reRender'])

/** 是否从「写博客」顶层菜单进入（区别于文章管理页的编辑入口） */
const isWriteEntry = computed(() => route.path === '/write')

let mdHeight = window.innerHeight - 30 - 70 - 200

// 引用图片
const imageReferenceRef = ref(null)
const titleInputRef = ref(null)
const hasSelectedArticle = ref(false)
/** ImageReference 当前选中状态 — 由 @select-article / @clear 事件驱动，auto-save 直接读取 */
const imageRefSelectedArticle = ref([])
const imageRefSelectedArticleId = ref(null)
// 引用图片组件容器高度
const IMAGE_REFERENCE_EXPANDED_HEIGHT = '300px'
const IMAGE_REFERENCE_COLLAPSED_HEIGHT = '80px'

// 引用封面
const selectedCoverArticle = ref([])
const coverArticleCache = ref([])  // 缓存文章搜索结果

// 标签
const tagList = ref([])

// 文章
const blogData = ref({
  title: '',
  content: ''
})

const isCoverUploading = ref(false)

const defaultModel = {
  id: null,
  categoryId: null,
  status: null,
  descriptionType: 'auto',
  customDescription: '',
  description: null,
  tagNames: [],
  coverOption: 'upload',
  customCoverLink: '',
  cover: null,
  refCover: null,
  refCoverUuid: null,
  isTop: '0',
  isComment: '1'
}

const formModel = reactive({ ...defaultModel })

// 封面模式切换缓存：编辑只保留回显的原模式值，其余切换即清空
const originalCoverOption = ref(null)   // 回显时的封面模式（新增为 null）
const coverCache = ref(null)            // 离开原模式时缓存的值
const prevCoverOption = ref(null)       // 切换前的封面模式

const carouselData = ref({
  isCarousel: false,
  sort: null,
  carouselId: null,
  articleId: null
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const maskVisible = ref(false)
const isEditMode = ref(false)
const blogFormRef = ref(null)
const formRef = ref(null)

const rules = {
  title: [{ required: true, message: '请输入标题' }],
  content: [{ required: true, message: '请输入内容' }]
}

// ============================================================
// 弹窗表单校验
// ============================================================

/** 校验封面 — 文件上传模式 */
const validateCover = (rule, value, callback) => {
  if (formModel.coverOption === 'upload') {
    if (!formModel.cover) {
      callback(new Error('请上传文章封面'))
    } else {
      callback()
    }
    return
  }
  callback()
}

/** 校验封面 — 自定义链接模式 */
const validateCustomCoverLink = (rule, value, callback) => {
  if (formModel.coverOption === 'custom') {
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

/** 校验封面 — 引用封面模式 */
const validateCoverReference = (rule, value, callback) => {
  if (formModel.coverOption === 'ref' && !value) {
    callback(new Error('请选择要引用的文章封面'))
  } else {
    callback()
  }
}

const dialogRules = {
  cover: [
    { required: true, validator: validateCover, trigger: 'change'  }
  ],
  customCoverLink: [
    { required: true, validator: validateCustomCoverLink, trigger: 'blur'  }
  ],
  refCover: [
    { required: true, validator: validateCoverReference, trigger: 'blur'  }
  ]
}

const uploadRef = ref()

// 草稿
let saveTimer = null
const coverFileBase64 = ref(null)
const coverFileMeta = ref(null)

// ============================================================
// 渲染
// ============================================================

/** 聚焦标题输入框 */
const focusTitle = () => {
  nextTick(() => {
    titleInputRef.value?.focus()
  })
}

/**
 * Mask 关闭 / 清空
 * 写博客入口：清空草稿 + 重置表单 + mask 保持打开（立刻可写下一篇）
 * 文章管理入口：仅关闭 mask（草稿保留，下次可恢复）
 */
const handleCloseMask = () => {
  if (isWriteEntry.value) {
    draftStore.clearDraft()
    blogData.value = {}
    selectedCoverArticle.value = []
    imageRefSelectedArticle.value = []
    imageRefSelectedArticleId.value = null
    imageReferenceRef.value?.clear()
    Object.assign(formModel, defaultModel)
    resetCarouselData()
    focusTitle()
  } else {
    maskVisible.value = false
  }
  hasSelectedArticle.value = false
}

const handleOpenDialog = () => {
  handleOpen()
}

/** 暴露打开遮罩层方法 — 无论是添加还是编辑，都需要打开 mask 弹窗 */
const openMask = () => {
  maskVisible.value = !maskVisible.value
}

const handleOpen = async () => {
  const valid = await blogFormRef.value.validate().catch(() => false)
  if (!valid) return

  hasSelectedArticle.value = false
  dialogVisible.value = true

  // 等待对话框打开和内容渲染
  await nextTick()

  // 现在 SmartUpload 组件已经创建
  if (uploadRef.value && uploadRef.value.handleImage) {
    const imageUrl = formModel.cover instanceof File
      ? formModel.cover
      : (!formModel.id ? '' : formModel.cover)
    console.log('对话框打开后调用 handleImage:', imageUrl)
    uploadRef.value.handleImage(imageUrl)
  }
}

/**
 * 判断添加还是编辑：添加就重置文章数据，编辑就回显文章数据
 */
const handleToggle = async (param) => {
  if (!param.id) {
    // 添加
    isEditMode.value = false
    dialogTitle.value = '新增文章'

    // 尝试恢复草稿
    const draft = draftStore.restoreDraft()
    if (draft) {
      blogData.value = draft.blogData
      Object.assign(formModel, draft.formModel)
      carouselData.value = draft.carouselData
      selectedCoverArticle.value = draft.selectedCoverArticle || []
      // 文件上传封面：base64 还原为 File 对象
      if (draft.coverFileBase64 && draft.coverFileMeta) {
        coverFileBase64.value = draft.coverFileBase64
        coverFileMeta.value = draft.coverFileMeta
        formModel.cover = base64ToFile(
          draft.coverFileBase64,
          draft.coverFileMeta.name,
          draft.coverFileMeta.type
        )
      }
      // ImageReference：恢复选中的文章 + 容器高度
      if (draft.imageRefSelectedArticleId) {
        imageRefSelectedArticle.value = draft.imageRefSelectedArticle || []
        imageRefSelectedArticleId.value = draft.imageRefSelectedArticleId
        nextTick(async () => {
          await imageReferenceRef.value?.loadByArticleId(draft.imageRefSelectedArticleId, draft.imageRefSelectedArticle?.[0])
          hasSelectedArticle.value = (imageReferenceRef.value?.getImageList()?.length || 0) > 0
        })
      }
    } else {
      blogData.value = {}
      selectedCoverArticle.value = []
      // 重置数据
      Object.assign(formModel, defaultModel)
      resetCarouselData()
    }
    // 新增：无回显原模式，切换封面模式即清空之前的值
    originalCoverOption.value = null
    coverCache.value = null
    prevCoverOption.value = formModel.coverOption
    focusTitle()
  } else {
    // 回显
    isEditMode.value = true
    dialogTitle.value = '修改文章'
    const res = await findApi(param.id)
    console.log('回显res.data', res.data)

    const { title, content, ...rest } = res.data

    blogData.value = { title, content }

    Object.assign(formModel, rest)
    if (res.data.isAutoDescription === 0) {
      formModel.descriptionType = 'auto'
    } else if (res.data.isAutoDescription === 1) {
      formModel.descriptionType = 'empty'
    } else {
      formModel.descriptionType = 'custom'
      formModel.customDescription = res.data.description
    }

    // 根据后端返回的 coverMode 回显封面
    if (res.data.coverMode === 'upload') {
      formModel.coverOption = 'upload'
      formModel.cover = res.data.cover  // 完整 URL
      formModel.customCoverLink = ''
      formModel.refCover = null
      formModel.refCoverUuid = null
    } else if (res.data.coverMode === 'custom') {
      formModel.coverOption = 'custom'
      formModel.customCoverLink = res.data.cover
      formModel.cover = null
      formModel.refCover = null
      formModel.refCoverUuid = null
    } else if (res.data.coverMode === 'ref') {
      formModel.coverOption = 'ref'
      formModel.refCover = res.data.cover  // 完整 URL（预览用）
      formModel.refCoverUuid = rest.cover   // UUID（提交用）
      // 回显引用的文章标题到 SmartAutoComplete
      if (res.data.coverSourceTitle) {
        selectedCoverArticle.value = [res.data.coverSourceTitle]
      }
      formModel.cover = null
    }

    // 记录回显的原封面模式：切换时只保留该模式的值
    originalCoverOption.value = formModel.coverOption
    coverCache.value = null
    prevCoverOption.value = formModel.coverOption

    // 查询轮播信息并回显到 carouselData
    try {
      const carouselRes = await getCarouselByArticleApi(param.id)
      if (carouselRes.data) {
        carouselData.value.isCarousel = true
        carouselData.value.sort = carouselRes.data.sort
        carouselData.value.carouselId = carouselRes.data.id
        carouselData.value.articleId = param.id
      } else {
        resetCarouselData()
      }
    } catch (e) {
      // 没有轮播记录，保持默认状态
      resetCarouselData()
    }
  }
}

const handlePublish = async (status) => {
  hasSelectedArticle.value = false
  formModel.status = status

  // 弹窗表单校验（封面相关字段）
  try {
    await formRef.value?.validate()
  } catch (e) {
    return
  }

  // 最后一次确认 description 值
  if (formModel.descriptionType === 'custom') {
    formModel.description = formModel.customDescription
    // formModel.isAutoDescription = null; // 明确设置为null
  }

  let cover
  if (formModel.coverOption === 'custom') {
    cover = formModel.customCoverLink
  } else if (formModel.coverOption === 'ref') {
    cover = formModel.refCoverUuid
  } else if (formModel.coverOption === 'upload') {
    if (formModel.cover instanceof File) {
      cover = null // 新文件等待上传
    } else {
      cover = formModel.cover // 直接传，后端会提取 UUID
    }
  }

  const data = {
    article: {
      ...blogData.value,
      ...formModel,
      cover: cover
    },
    tagNames: formModel.tagNames,
    isCarousel: carouselData.value.isCarousel,
    sort: carouselData.value.sort || 0
  }

  // 移除临时字段
  delete data.article.descriptionType
  delete data.article.customDescription
  delete data.article.tagNames // 移除 tagNames 字段，因为 article 表中没有这个字段

  try {
    let articleId = formModel.id

    if (!formModel.id) {
      // t_article_request：文章新增请求
      const res = await addApi(data)
      articleId = res.data
      console.log('==================== articleId ====================', articleId)
      // 如果是文件上传模式，上传封面
      if (formModel.coverOption === 'upload' && formModel.cover instanceof File) {
        const coverUrl = await uploadCoverApi(articleId, formModel.cover)
        if (coverUrl) {
          formModel.cover = coverUrl
        }
      }
    } else {
      // t_article_request：文章修改请求
      await modifyApi(data)
      // 如果是文件上传模式，上传封面
      if (formModel.coverOption === 'upload' && formModel.cover instanceof File) {
        const coverUrl = await uploadCoverApi(articleId, formModel.cover)
        if (coverUrl) {
          formModel.cover = coverUrl
        }
      }
    }
    msg.primary(formModel.id ? '修改成功' : '添加成功')
    draftStore.clearDraft()
    dialogVisible.value = false
    openMask()
    if (isWriteEntry.value) {
      // 写博客入口：发布后自动打开空白表单，继续写下一篇
      nextTick(() => {
        openMask()
        handleToggle({})
      })
    } else {
      emit('reRender')
    }
  } catch (error) {
    msg.error('提交失败，请重试')
  }
}

// ============================================================
// 辅助函数
// ============================================================

/** 重置轮播数据 */
const resetCarouselData = () => {
  carouselData.value = {
    isCarousel: false,
    sort: null,
    carouselId: null,
    articleId: null
  }
}

/** 处理排序变化：0 自动转为 null（自动） */
const handleSortChange = (val) => {
  if (val === 0) {
    carouselData.value.sort = null
  }
}

/** 处理轮播开关变化 */
const handleCarouselChange = (val) => {
  if (!val) {
    carouselData.value.sort = null
  }
}

// ============================================================
// 标签
// ============================================================

/** 加载所有标签数据 */
const loadAllTags = async () => {
  const res = await getTagListApi(1, 999, {})
  const items = res.data?.items || []
  tagList.value = items
    .filter(item => item.name)
    .map(item => ({
      value: item.name.trim(),
      id: item.id,
      remark: item.remark
    }))
  console.log('加载所有标签:', tagList.value.length, '条')
}

/** 前端搜索标签 */
const fetchTags = async (params) => {
  const query = params.keyword || ''

  if (!query) {
    return tagList.value
  }

  const lowerQuery = query.toLowerCase()

  const matched = tagList.value.filter(item => {
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

// ============================================================
// 引用封面
// ============================================================

/**
 * 搜索文章（用于引用封面）
 */
const fetchArticleForCover = async (params) => {
  const query = params.keyword || ''

  try {
    const res = await getArticleBusinessDataApi()
    if (res.code === 200) {
      const data = (res.data || []).map(item => ({
        value: item.title,
        id: item.id
      }))
      coverArticleCache.value = data

      if (!query) {
        return data
      }

      const lowerQuery = query.toLowerCase()
      return data.filter(item => {
        const text = item.value
        const lowerText = text.toLowerCase()

        if (lowerText.includes(lowerQuery)) return true
        if (PinyinMatch.match(text, query)) return true

        const words = lowerText.split(/[\s\-_]+/)
        for (const word of words) {
          if (word.startsWith(lowerQuery)) return true
        }

        if (words.length > 1) {
          const initials = words.map(w => w[0]).join('')
          if (initials.includes(lowerQuery)) return true
        }

        return false
      })
    }
    return []
  } catch (error) {
    console.error('搜索文章失败:', error)
    return []
  }
}

/**
 * 监听 selectedCoverArticle 变化 → 用标题反查 ID → 加载封面
 */
watch(selectedCoverArticle, async (newVal) => {
  if (newVal.length > 0) {
    const title = newVal[0]
    // 从缓存中反查 ID
    const found = coverArticleCache.value.find(item => item.value === title)
    if (found) {
      try {
        const res = await fileMetaListApi(1, 1, {
          targetIds: found.id,
          fileType: 'cover'
        })
        if (res.code === 200 && res.data.items && res.data.items.length > 0) {
          const coverFileMeta = res.data.items[0]
          formModel.refCover = coverFileMeta.img        // 用于预览
          formModel.refCoverUuid = coverFileMeta.uuid   // 保存 UUID，用于提交
        } else {
          formModel.refCover = null
          formModel.refCoverUuid = null
          msg.warning('该文章暂无封面')
        }
      } catch (error) {
        console.error('获取封面失败:', error)
        formModel.refCoverUuid = null
        msg.warning('获取封面失败')
      }
    }
  } else {
    // 移除标签 → 清空封面
    formModel.refCover = null
    formModel.refCoverUuid = null
  }
}, { deep: true })

/**
 * 移除引用文章 → 清空封面
 */
const handleCoverArticleRemoved = () => {
  formModel.cover = null
}

/**
 * 缓存当前封面模式的值 — 用于编辑时保留回显的原模式值
 */
const cacheCoverValue = (option) => {
  coverCache.value = {
    option,
    cover: formModel.cover,
    customCoverLink: formModel.customCoverLink,
    refCover: formModel.refCover,
    refCoverUuid: formModel.refCoverUuid,
    selectedCoverArticle: [...selectedCoverArticle.value]
  }
}

/**
 * 恢复缓存中指定模式的值（仅缓存模式匹配时生效）
 */
const restoreCoverValue = (option) => {
  if (!coverCache.value || coverCache.value.option !== option) return false
  const cache = coverCache.value
  formModel.cover = cache.cover
  formModel.customCoverLink = cache.customCoverLink
  formModel.refCover = cache.refCover
  formModel.refCoverUuid = cache.refCoverUuid
  selectedCoverArticle.value = [...cache.selectedCoverArticle]
  return true
}

/**
 * 清空当前封面模式的值
 */
const clearCoverValue = () => {
  formModel.cover = null
  formModel.customCoverLink = ''
  formModel.refCover = null
  formModel.refCoverUuid = null
  selectedCoverArticle.value = []
}

/**
 * 封面选项切换
 * 编辑：离开回显的原模式时保留其值（切回自动恢复）；新增及其他模式的值切换即清空
 */
const handleCoverOptionChange = (val) => {
  // 离开回显的原模式 → 缓存当前值
  if (originalCoverOption.value !== null && prevCoverOption.value === originalCoverOption.value) {
    cacheCoverValue(prevCoverOption.value)
  }
  // 进入新模式：缓存命中则恢复，否则清空
  if (!restoreCoverValue(val)) {
    clearCoverValue()
  }
  prevCoverOption.value = val
  // 文件上传模式：重建 SmartUpload 内部状态
  if (val === 'upload') {
    nextTick(() => uploadRef.value?.handleImage(formModel.cover))
  }
  // 切换封面模式时清除相关字段的校验状态
  formRef.value?.clearValidate(['cover', 'customCoverLink', 'refCover'])
}

/** SmartUpload 图片变更时触发封面校验 */
const handleCoverValidate = () => {
  nextTick(() => {
    formRef.value?.validateField('cover')
  })
}

// ============================================================
// 引用图片
// ============================================================

/** 处理选中状态变化 */
const handleSelectedChange = (selected) => {
  hasSelectedArticle.value = selected
}

/**
 * 选择文章时触发 — 实时同步到草稿 ref，auto-save 直接读取无需
通过 ref 轮询 ImageReference
 */
const handleImageSelectArticle = (data) => {
  if (data) {
    imageRefSelectedArticle.value = [data.title]
    imageRefSelectedArticleId.value = data.id
  } else {
    imageRefSelectedArticle.value = []
    imageRefSelectedArticleId.value = null
  }
}

/**
 * 移除文章标签时触发 — 同步清空草稿引用图片数据
 */
const handleImageRemoveArticle = () => {
  imageRefSelectedArticle.value = []
  imageRefSelectedArticleId.value = null
}

/**
 * 插入图片时触发
 */
const handleImageInsert = (data) => {
  console.log('插入图片:', data)

  // 将图片插入到 Markdown 内容中
  const currentContent = blogData.value.content || ''
  blogData.value.content = currentContent + '\n' + data.markdown

  msg.primary(`图片 "${data.title || '图片'}" 已插入到内容末尾`)

  // 重置选中状态
  imageReferenceRef.value?.resetSelection()
}

/**
 * 清空时触发
 */
const handleImageClear = () => {
  imageRefSelectedArticle.value = []
  imageRefSelectedArticleId.value = null
}

// 编辑回显时展开，新增时收缩
// watch(() => formModel.id, (newVal) => {
//   if (newVal) {
//     hasSelectedArticle.value = true
//   }
// }, { immediate: true })

// ============================================================
// 表单校验
// ============================================================

/** 监听描述类型变化 */
const handleDescriptionTypeChange = (type) => {
  switch (type) {
    case 'auto':
      formModel.description = null // 传 null 表示自动生成
      break
    case 'empty':
      formModel.description = ''   // 传空字符串表示刻意留空
      break
    case 'custom':
      formModel.description = formModel.customDescription // 使用自定义内容
      break
  }
}

// ============================================================
// 草稿自动保存
// ============================================================

/** 获取安全的 formModel 副本 — File 对象无法 JSON 序列化，保存时置 null */
const safeFormModel = () => {
  const copy = { ...formModel }
  if (copy.cover instanceof File) copy.cover = null
  return copy
}

/** base64 转回 File 对象 — 用于草稿恢复 */
const base64ToFile = (base64, filename, mimeType) => {
  const arr = base64.split(',')
  const mime = mimeType || (arr[0].match(/:(.*?);/) || [])[1] || 'image/png'
  const bstr = atob(arr[1])
  const n = bstr.length
  const u8arr = new Uint8Array(n)
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i)
  return new File([u8arr], filename, { type: mime })
}

// 监听 cover 变化 — 当用户选择新文件时，异步读取 base64
watch(() => formModel.cover, (cover) => {
  if (cover instanceof File) {
    const reader = new FileReader()
    reader.onload = () => {
      coverFileBase64.value = reader.result
      coverFileMeta.value = {
        name: cover.name,
        size: cover.size,
        type: cover.type,
        lastModified: cover.lastModified
      }
    }
    reader.readAsDataURL(cover)
  } else {
    coverFileBase64.value = null
    coverFileMeta.value = null
  }
})

/** 防抖保存草稿 — 800ms 无变化后自动写入 sessionStorage（编辑模式受 config 控制，新增永远保存） */
const autoSaveDraft = () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (isEditMode.value && !configStore.getArticleSaveEdit()) return
    if (!maskVisible.value) return
    if (!blogData.value.title && !blogData.value.content) return
    draftStore.saveDraft({
      blogData: blogData.value,
      formModel: safeFormModel(),
      carouselData: { ...carouselData.value },
      selectedCoverArticle: [...selectedCoverArticle.value],
      coverFileBase64: coverFileBase64.value,
      coverFileMeta: coverFileMeta.value,
      imageRefSelectedArticle: [...imageRefSelectedArticle.value],
      imageRefSelectedArticleId: imageRefSelectedArticleId.value
    })
  }, 800)
}

// 深度监听表单数据变化 → 自动保存
watch([blogData, () => formModel, carouselData, selectedCoverArticle, imageRefSelectedArticle, imageRefSelectedArticleId], autoSaveDraft, { deep: true })

// 组件卸载时兜底保存
onBeforeUnmount(() => {
  if (isEditMode.value && !configStore.getArticleSaveEdit()) return
  if (maskVisible.value && (blogData.value.title || blogData.value.content)) {
    draftStore.saveDraft({
      blogData: blogData.value,
      formModel: safeFormModel(),
      carouselData: { ...carouselData.value },
      selectedCoverArticle: [...selectedCoverArticle.value],
      coverFileBase64: coverFileBase64.value,
      coverFileMeta: coverFileMeta.value,
      imageRefSelectedArticle: [...imageRefSelectedArticle.value],
      imageRefSelectedArticleId: imageRefSelectedArticleId.value
    })
  }
})

// ============================================================
// 生命周期
// ============================================================

onMounted(() => {
  loadAllTags()
})

defineExpose({
  handleToggle,
  openMask
})
</script>

<style scoped lang="scss">
  // 针对<el-input placeholder="请输入标题" v-model="blogData.title" />
  // 不管校验是否生效，都保持原来的样式！

 :deep(.el-form .el-form-item .el-form-item__content .el-input__wrapper){

	box-shadow: 0 0 0 1px var(--el-input-border-color, var(--el-border-color)) inset;
  .el-input__inner {
    color: #000;
  }
}
 :deep(.dark-mode .el-input__wrapper .el-input__inner){
   color: #fff !important;
 }


 .form-tip-icon {
  margin-left: 8px;
  color: #909399;
  font-size: 14px;
  cursor: help;
  vertical-align: middle;
}

:deep(.el-form .el-form-item .el-form-item__content .el-input__wrapper .el-input__inner ){
   color: var(--el-text-color-regular);
}

// 覆盖所有 el-form-item__content 会影响 原生 `label` 和 `el-form-item` 的布局
/* :deep(.el-form-item .el-form-item__content) {
    display: block !important;
    width: 100% !important;
    flex: none !important;
    align-items: stretch !important;
} */
// ============================================================
// 文章开关样式（置顶 / 轮播 / 评论）
// ============================================================

.article-switches {
  display: flex;
  gap: 32px;
  align-items: center;

  .switch-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .switch-label {
      color: var(--el-text-color-regular);
      white-space: nowrap;
    }
  }
}

// ============================================================
// 封面样式
// ============================================================

.cover-reference-wrapper {
  width: 100%;

  .cover-preview {
    position: relative;
    margin-top: 12px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-light);
    transition: all 0.3s ease;
    max-width: 120px;

    .cover-image {
      width: 100%;
      height: auto;
      display: block;
      aspect-ratio: 16 / 9;
      object-fit: cover;
    }
  }

}

</style>
