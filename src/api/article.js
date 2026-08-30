import http from '@/utils/request'

// t_article_api：文章管理

const API = {
    ARTICLE_URL : '/admin/content/article',
    ARTICLE_BY_ID_URL : '/admin/content/article/find',
    ARTICLE_BY_ISTOP : '/admin/content/article/isTop',
    UPLOAD_COVER_URL : '/admin/upload/cover',
    UPLOAD_CONTENT_URL : '/admin/upload/content',
    CAROUSEL_URL : '/admin/content/carousel',
    CAROUSEL_BY_ARTICLE_URL : '/admin/content/carousel/findByArticle'
}

export const addApi = (params) => http.post(`${API.ARTICLE_URL}`,params)

export const removeApi = (aId) => http.delete(`${API.ARTICLE_URL}/${aId}`)

export const modifyApi = (params) => http.put(`${API.ARTICLE_URL}`,params)

export const findApi = (articleId) => http.get(`${API.ARTICLE_BY_ID_URL}/${articleId}`)

export const listApi = (pageNum,pageSize,searchData) => http.get(`${API.ARTICLE_URL}/${pageNum}/${pageSize}`,{params:searchData})

//t_upload_api
export const uploadApi = (formData) => http.post(API.UPLOAD_CONTENT_URL,formData,{
    timeout: 15000 //本次内容图上传请求超时15秒
})

//t_upload_api
export const uploadCoverApi = (articleId,cover) => {
    const formData = new FormData()
    formData.append('articleId', articleId)
    formData.append('cover', cover)
    http.post(API.UPLOAD_COVER_URL,formData)
}

// 修改文章置顶
export const isTopApi = (id,isTop) => http.put(`${API.ARTICLE_BY_ISTOP}/${id}/${isTop}`)


// ==================== 文章编辑页轮播设置相关api ====================
// 根据文章ID查询轮播信息
export const getCarouselByArticleApi = (articleId) => http.get(`${API.CAROUSEL_BY_ARTICLE_URL}/${articleId}`)
// 删除轮播（通过ID或文章ID）
export const removeCarouselApi = (id, articleId) => {
    if (id) {
        return http.delete(`${API.CAROUSEL_URL}/${id}`)
    } else if (articleId) {
        return http.delete(`${API.CAROUSEL_URL}/byArticle/${articleId}`)
    }
}


// ==================== 轮播管理相关api ====================

// 分页查询轮播列表
export const getCarouselListApi = (pageNum, pageSize, searchData) => 
    http.get(`${API.CAROUSEL_URL}/${pageNum}/${pageSize}`, { params: searchData })

// 根据ID查询轮播详情
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

// 更新轮播
export const updateCarouselApi = (params) => {
    const formData = buildFormData(params)
    return http.put(`${API.CAROUSEL_URL}`, formData)
}

// 新增轮播
export const addCarouselApi = (params) => {
    const formData = buildFormData(params)
    return http.post(`${API.CAROUSEL_URL}/add`, formData)
}
