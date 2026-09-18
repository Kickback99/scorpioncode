import { ref, onMounted, onUnmounted } from 'vue'

/** 表格高度安全余量(px)：吸收亚像素舍入，避免页面刚好溢出 */
const TABLE_HEIGHT_GUTTER = 4

/** 表格兜底最小高度(px)：视口过矮时表格不至于被压没 */
const TABLE_MIN_HEIGHT = 200

/**
 * 列表页表格自动高度
 *
 * 按实测尺寸扣除搜索面板与分页占位，取整后得到表格应占高度。
 * 结果绑定到 el-table 的 `height`（而非 `max-height`）：固定高度让表格撑满可用空间，
 * 数据不足时空白留在表格内、分页贴底；用 max-height 则表格只按内容高度收缩，
 * 放大窗口 / 全屏后底部会空出一大片。
 *
 * 取整且不超出可用空间，保证页面永不溢出 —— 页面一旦溢出，滚轮滚的就是外层页面，
 * 表格会停在亚像素位置导致内容重绘抖动。
 *
 * 折叠面板与分页都取实测高度，因此搜索栏增删筛选项后面板变高，表格会自动让位；
 * 面板折叠/展开是动画过渡（高度逐帧变化），用 ResizeObserver 跟随重算。
 *
 * 依赖页面结构（所有列表页一致）：
 * - `.main-scrollbar > .el-scrollbar__wrap` 内容区滚动容器
 * - `.search-collapse` 搜索折叠面板
 * - `.el-pagination` 分页（缺失时按 0 计）
 *
 * @returns {{ tableHeight: import('vue').Ref<string> }} 绑定到 el-table 的 height
 */
export function useTableAutoHeight() {
    const tableHeight = ref('500')
    let collapseObserver = null
    let retryTimers = []

    /** 重新计算表格可用高度 */
    const recalcTableHeight = () => {
        const wrap = document.querySelector('.main-scrollbar > .el-scrollbar__wrap')
        const collapse = document.querySelector('.search-collapse')
        if (!wrap || !collapse) return
        const pagination = document.querySelector('.el-pagination')
        const pagBlock = pagination
            ? pagination.offsetHeight + parseFloat(getComputedStyle(pagination).marginTop || 0)
            : 0
        const avail = wrap.clientHeight - collapse.offsetHeight - pagBlock - TABLE_HEIGHT_GUTTER
        tableHeight.value = `${Math.max(Math.floor(avail), TABLE_MIN_HEIGHT)}px`
    }

    onMounted(() => {
        recalcTableHeight()
        window.addEventListener('resize', recalcTableHeight)
        const collapse = document.querySelector('.search-collapse')
        if (collapse && typeof ResizeObserver !== 'undefined') {
            collapseObserver = new ResizeObserver(() => requestAnimationFrame(recalcTableHeight))
            collapseObserver.observe(collapse)
        }
        // 表格与分页是异步渲染的，挂载初期分页可能尚未占位（高度为 0），
        // 会让表格被算高一个分页的量，延时补算兜底
        retryTimers = [50, 200, 600, 1500].map((delay) => setTimeout(recalcTableHeight, delay))
    })

    onUnmounted(() => {
        window.removeEventListener('resize', recalcTableHeight)
        collapseObserver?.disconnect()
        retryTimers.forEach(clearTimeout)
    })

    return { tableHeight }
}
