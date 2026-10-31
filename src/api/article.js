import http from '@/utils/request'

const API = {
    ARTICLE_URL : '/admin/blog/article',
    ARTICLE_BY_ID_URL : '/admin/blog/article/find',
    ARTICLE_BY_ISTOP : '/admin/blog/article/isTop',
    UPLOAD_COVER_URL : '/admin/upload/cover',
    UPLOAD_CONTENT_URL : '/admin/upload/content',
    CAROUSEL_URL : '/admin/blog/carousel',
    CAROUSEL_BY_ARTICLE_URL : '/admin/blog/carousel/findByArticle'
}

/**
 * 新增文章
 * @param {Object} params 文章数据
 * @returns {Promise}
 */
export const addApi = (params) => http.post(`${API.ARTICLE_URL}`,params)

/**
 * 删除文章
 * @param {Number} aId 文章 ID
 * @returns {Promise}
 */
export const removeApi = (aId) => http.delete(`${API.ARTICLE_URL}/${aId}`)

/**
 * 修改文章
 * @param {Object} params 文章数据
 * @returns {Promise}
 */
export const modifyApi = (params) => http.put(`${API.ARTICLE_URL}`,params)

/**
 * 根据 ID 查询文章
 * @param {Number} articleId 文章 ID
 * @returns {Promise}
 */
export const findApi = (articleId) => http.get(`${API.ARTICLE_BY_ID_URL}/${articleId}`)

/**
 * 分页查询文章列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @param {Object} searchData 查询条件
 * @returns {Promise}
 */
export const listApi = (pageNum,pageSize,searchData) => http.get(`${API.ARTICLE_URL}/${pageNum}/${pageSize}`,{params:searchData})

/**
 * 上传内容图片
 * @param {FormData} formData 图片表单
 * @returns {Promise}
 */
export const uploadApi = (formData) => http.post(API.UPLOAD_CONTENT_URL,formData,{
    timeout: 35000 // 本次内容图上传请求超时 35 秒
})

/**
 * 上传文章封面
 * @param {Number} articleId 文章 ID
 * @param {File} cover 封面文件
 * @returns {Promise}
 */
export const uploadCoverApi = (articleId,cover) => {
    const formData = new FormData()
    formData.append('articleId', articleId)
    formData.append('cover', cover)
    return http.post(API.UPLOAD_COVER_URL,formData,{ timeout: 35000 }) // 封面上传超时 35 秒
}

/**
 * 修改文章置顶
 * @param {Number} id 文章 ID
 * @param {Number} isTop 是否置顶
 * @returns {Promise}
 */
export const isTopApi = (id,isTop) => http.put(`${API.ARTICLE_BY_ISTOP}/${id}/${isTop}`)

// ============================================================
// 文章编辑页轮播设置
// ============================================================
/**
 * 根据文章 ID 查询轮播信息
 * @param {Number} articleId 文章 ID
 * @returns {Promise}
 */
export const getCarouselByArticleApi = (articleId) => http.get(`${API.CAROUSEL_BY_ARTICLE_URL}/${articleId}`)

/**
 * 删除轮播（按轮播 ID 或文章 ID）
 * @param {Number} id 轮播 ID
 * @param {Number} articleId 文章 ID
 * @returns {Promise}
 */
export const removeCarouselApi = (id, articleId) => {
    if (id) {
        return http.delete(`${API.CAROUSEL_URL}/${id}`)
    } else if (articleId) {
        return http.delete(`${API.CAROUSEL_URL}/byArticle/${articleId}`)
    }
}

// ============================================================
// 轮播管理
// ============================================================

/**
 * 分页查询轮播列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @param {Object} searchData 查询条件
 * @returns {Promise}
 */
export const getCarouselListApi = (pageNum, pageSize, searchData) =>
    http.get(`${API.CAROUSEL_URL}/${pageNum}/${pageSize}`, { params: searchData })

/**
 * 根据 ID 查询轮播详情
 * @param {Number} id 轮播 ID
 * @returns {Promise}
 */
export const getCarouselByIdApi = (id) =>
    http.get(`${API.CAROUSEL_URL}/${id}`)

/**
 * 构建 FormData（通用函数）
 */
const buildFormData = (params) => {
    const formData = new FormData()
    for (const key in params) {
        if (params[key] != null && params[key] !== '') {
            formData.append(key, params[key])
        }
    }
    return formData
}

/**
 * 更新轮播
 * @param {Object} params 轮播数据
 * @returns {Promise}
 */
export const updateCarouselApi = (params) => {
    const formData = buildFormData(params)
    return http.put(`${API.CAROUSEL_URL}`, formData)
}

/**
 * 新增轮播
 * @param {Object} params 轮播数据
 * @returns {Promise}
 */
export const addCarouselApi = (params) => {
    const formData = buildFormData(params)
    return http.post(`${API.CAROUSEL_URL}/add`, formData)
}
