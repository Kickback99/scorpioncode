import request from '@/utils/request'

const API = {
    FILE_PAGE : '/resource/file/page',
    FILE_UPDATE:'/resource/file',
    FILE_DELETE:'/resource/file',
    FILE_EXTS:'/resource/file/exts',
    FILE_DOWNLOAD:'/resource/file/download',
    FILE_SYNC_DELETE:'/resource/file/sync/delete',
    FILE_UPDATE_RECORDS:'/resource/file/update/records'
}

/**
 * 分页查询文件列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @param {Object} searchData 查询条件
 * @returns {Promise}
 */
export const listApi = (pageNum,pageSize,searchData) => request.get(`${API.FILE_PAGE}/${pageNum}/${pageSize}`,{params:searchData})

/**
 * 查询文件扩展名选项
 * @returns {Promise}
 */
export const extsApi = () => request.get(API.FILE_EXTS)

/**
 * 下载文件
 * @param {String} fileUUID 文件 UUID
 * @returns {Promise}
 */
export const downloadApi = (fileUUID) => request.get(`${API.FILE_DOWNLOAD}/${fileUUID}`, { responseType: 'blob' })

/**
 * 同步删除文件
 * @returns {Promise}
 */
export const syncDeleteApi = () => request.delete(`${API.FILE_SYNC_DELETE}`)

/**
 * 删除文件
 * @param {Number|Number[]} ids 文件 ID 或 ID 数组
 * @returns {Promise}
 */
export const removeApi = (ids) => request.delete(`${API.FILE_DELETE}/${ids}`)

/**
 * 更新文件记录
 * @returns {Promise}
 */
export const updateRecordApi = () => request.post(API.FILE_UPDATE_RECORDS)

/**
 * 重命名文件
 * @param {Number} id 文件 ID
 * @param {String} name 新文件名
 * @returns {Promise}
 */
export const modifyApi = (id,name) => {
    const params = new URLSearchParams()
    params.append('id', id)
    params.append('name', name)
    // 传 URLSearchParams 对象，axios 才会设置 x-www-form-urlencoded；传字符串会以 text/plain 发出，
    // 后端 @RequestParam 解析不到 body，重命名静默失效
    return request.put(API.FILE_UPDATE, params)
}
