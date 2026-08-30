import http from '@/utils/request'

// t_category_api：分类管理

const API = {
    CATEGORY_URL : '/admin/content/category',
}

export const addApi = (params) => http.post(API.CATEGORY_URL,params)

export const removeApi = (params) => http.delete(`${API.CATEGORY_URL}/${params}`)

export const modifyApi = (params) => http.put(API.CATEGORY_URL,params)

// 报错：属性名跟后端接收的参数名不一致
// export const listApi = (params) => http.get(`${API.CATEGORY_URL}`,{params:{params:params}})
// 报错：没有这种语法
// export const listApi = (params) => http.get(`${API.CATEGORY_URL}`,{params:{cateIds:params + ’‘}})

// 正确
export const listApi = (params) => http.get(`${API.CATEGORY_URL}`,{params:{cateIds:params}})

