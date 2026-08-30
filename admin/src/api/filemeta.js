import http from '@/utils/request'

/**
 * 分页查询文件元数据
 * @param {number} pageNum 页码
 * @param {number} pageSize 每页大小
 * @param {Object} searchData 查询条件
 * @returns {Promise}
 */
export const fileMetaListApi = (pageNum, pageSize, searchData) => 
    http.get(`/admin/resource/meta`, {
        params: {
            pageNum,
            pageSize,
            ...searchData
        },
        timeout: 15000
    })


/**
 * 恢复被软删除的文件元数据
 * @param {number} id 文件元数据ID
 * @returns {Promise}
 */
export const recoverFileMetaApi = (id) => 
    http.put(`/admin/resource/meta/recover/${id}`);
