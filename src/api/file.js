import request from '@/utils/request'

// t_file_api：文件管理
const API = {
    FILE_PAGE : '/resource/file/page',
    FILE_UPDATE:'/resource/file',
    FILE_DELETE:'/resource/file',
    FILE_EXTS:'/resource/file/exts',
    FILE_DOWNLOAD:'/resource/file/download',
    FILE_SYNC_DELETE:'/resource/file/sync/delete',
    FILE_UPDATE_RECORDS:'/resource/file/update/records'
}

export const listApi = (pageNum,pageSize,searchData) => request.get(`${API.FILE_PAGE}/${pageNum}/${pageSize}`,{params:searchData})
export const extsApi = () => request.get(API.FILE_EXTS)
// export const downloadApi = (fileUUID) => request.get(`${API.FILE_DOWNLOAD}/${fileUUID}`)
export const syncDeleteApi = () => request.delete(`${API.FILE_SYNC_DELETE}`)
export const removeApi = (ids) => request.delete(`${API.FILE_DELETE}/${ids}`)
export const updateRecordApi = () => request.post(API.FILE_UPDATE_RECORDS)
export const modifyApi = (id,name) => {
    const params = new URLSearchParams()
    params.append('id', id)
    params.append('name', name)
    return request.put(API.FILE_UPDATE, params.toString())    
}