import http from '@/utils/request'

const API = {
    LOGIN_LOG_URL : '/admin/msg/loginLogs',

    OPER_LOG_URL  : '/admin/msg/operLogs',
    OPER_LOG_ENUMS_URL: '/admin/msg/operLogs/enums'
}

// 登录日志
/**
 * 分页查询登录日志列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @param {Object} searchData 查询条件
 * @returns {Promise}
 */
export const loginLogListApi = (pageNum,pageSize,searchData) => http.get(`${API.LOGIN_LOG_URL}/${pageNum}/${pageSize}`,{params:searchData})

/**
 * 删除登录日志
 * @param {Number|Number[]} params 日志 ID 或 ID 数组
 * @returns {Promise}
 */
export const loginLogRemoveApi = (params) => http.delete(`${API.LOGIN_LOG_URL}/${params}`)

// 操作日志
/**
 * 分页查询操作日志列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @param {Object} searchData 查询条件
 * @returns {Promise}
 */
export const operlogListApi = (pageNum,pageSize,searchData) => http.get(`${API.OPER_LOG_URL}/${pageNum}/${pageSize}`,{params:searchData})

/**
 * 删除操作日志
 * @param {Number|Number[]} params 日志 ID 或 ID 数组
 * @returns {Promise}
 */
export const operLogRemoveApi = (params) => http.delete(`${API.OPER_LOG_URL}/${params}`)

/**
 * 查询操作日志枚举选项
 * @returns {Promise}
 */
export const operlogEnumsListApi = () => http.get(API.OPER_LOG_ENUMS_URL)
