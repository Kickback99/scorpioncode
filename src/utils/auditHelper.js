// utils/auditHelper.js


/**
 * 检查选中项是否可通过
 * @param {Array} rows - 选中的行数据
 * @returns {Object} { valid: boolean, message: string, validRows: Array }
 */
export const checkApproveValid = (rows) => {
    if (!rows || rows.length === 0) {
        return {
            valid: false,
            message: '请先勾选要通过的评论',
            validRows: []
        }
    }
    
    // 过滤出已是通过状态的评论
    const alreadyApproved = rows.filter(row => row.status === 0)
    if (alreadyApproved.length > 0) {
        const names = alreadyApproved.slice(0, 3).map(r => {
            const preview = r.content?.substring(0, 20) || `ID:${r.id}`
            return `「${preview}」`
        }).join('、')
        const more = alreadyApproved.length > 3 ? `等${alreadyApproved.length}条` : ''
        return {
            valid: false,
            message: `${names}${more} 已是通过状态，无法重复通过`,
            validRows: []
        }
    }
    
    // 可通过的：待审核(2) 和 已驳回(1)
    const validRows = rows.filter(row => row.status === 2 || row.status === 1)
    
    return {
        valid: validRows.length === rows.length,
        message: validRows.length === rows.length ? '' : '部分评论状态异常',
        validRows
    }
}


/**
 * 检查选中项是否可以驳回
 * @param {Array} rows - 选中的行数据
 * @returns {Object} { valid: boolean, message: string, validRows: Array }
 */
export const checkRejectValid = (rows) => {
    if (!rows || rows.length === 0) {
        return {
            valid: false,
            message: '请先勾选要驳回的评论',
            validRows: []
        }
    }
    
    // 过滤出已经是驳回状态的评论
    const alreadyRejected = rows.filter(row => row.status === 1)
    if (alreadyRejected.length > 0) {
        const names = alreadyRejected.slice(0, 3).map(r => {
            const preview = r.content?.substring(0, 20) || `ID:${r.id}`
            return `「${preview}」`
        }).join('、')
        const more = alreadyRejected.length > 3 ? `等${alreadyRejected.length}条` : ''
        return {
            valid: false,
            message: `${names}${more} 已是驳回状态，无法重复驳回`,
            validRows: []
        }
    }
    
    // 可驳回的：待审核(2) 和 已通过(0)
    const validRows = rows.filter(row => row.status === 2 || row.status === 0)
    
    return {
        valid: validRows.length === rows.length,
        message: validRows.length === rows.length ? '' : '部分评论状态异常',
        validRows
    }
}


/**
 * 批量操作前的确认弹窗
 * @param {number} count - 要操作的数量
 * @param {string} action - 操作名称（通过/驳回/删除）
 * @param {Object} options - 额外选项
 * @returns {Promise<boolean>}
 */
export const confirmBatchAction = async (count, action, options = {}) => {
    const { type = 'warning', confirmText = '确认', cancelText = '取消' } = options
    
    let title = `你选择了${count}条评论，确认批量${action}吗？`
    
    // 删除操作的特殊提示
    if (action === '删除') {
        title = `你选择了${count}条评论，确认批量删除吗？`
    }
    
    await ElMessageBox.confirm(title, '温馨提示', {
        type,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText
    })
    
    return true
}