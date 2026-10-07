import http from '@/utils/request'

// t_tag_api：标签管理

const API = {
    TAG_URL : '/admin/content/tag',
}

export const addApi = (params) => http.post(API.TAG_URL,params)

export const removeApi = (params) => http.delete(`${API.TAG_URL}/${params}`)

export const modifyApi = (params) => http.put(API.TAG_URL,params)

export const listApi = (pageNum,pageSize,searchData) => http.get(`${API.TAG_URL}/${pageNum}/${pageSize}`,{params:searchData})

