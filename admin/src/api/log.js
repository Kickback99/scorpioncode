import http from '@/utils/request'

// t_log_api：日志管理

const API = {
    LOGIN_LOG_URL : '/admin/msg/loginLogs',

    OPER_LOG_URL  : '/admin/msg/operLogs',
    OPER_LOG_ENUMS_URL: '/admin/msg/operLogs/enums'
}


// 登录日志
export const loginLogListApi = (pageNum,pageSize,searchData) => http.get(`${API.LOGIN_LOG_URL}/${pageNum}/${pageSize}`,{params:searchData})
export const loginLogRemoveApi = (params) => http.delete(`${API.LOGIN_LOG_URL}/${params}`)

// 操作日志
export const operlogListApi = (pageNum,pageSize,searchData) => http.get(`${API.OPER_LOG_URL}/${pageNum}/${pageSize}`,{params:searchData})

export const operLogRemoveApi = (params) => http.delete(`${API.OPER_LOG_URL}/${params}`)
export const operlogEnumsListApi = () => http.get(API.OPER_LOG_ENUMS_URL)

