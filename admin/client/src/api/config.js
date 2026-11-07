import http from '@/utils/http'

const API = {
    CONFIG_URL: '/user/config'
}

/**
 * 查询全部配置
 * @returns {Promise}
 */
export const getConfigApi = () => http.get(`${API.CONFIG_URL}`)

/**
 * 查询单个配置项
 * @param {String} key 配置项 key
 * @returns {Promise}
 */
export const getConfigValueApi = (key) => http.get(`${API.CONFIG_URL}/getValue`, { params: { key } })
