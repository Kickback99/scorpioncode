import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

/** 编辑器高度安全余量(px)：吸收亚像素舍入，避免刚好溢出产生滚动条 */
const EDITOR_HEIGHT_GUTTER = 4

/** 编辑器兜底最小高度(px)：视口过矮时保证可编辑，溢出部分交给窗口滚动 */
const EDITOR_MIN_HEIGHT = 200

/**
 * 遮罩窗口内 Markdown 编辑器自动高度
 *
 * 按实测尺寸扣除编辑器上方内容（标题、引用图片面板）与页脚按钮占位，取整后得到编辑器应占
 * 高度，结果绑定到 Markdown 的 `height`。传数字而非用 CSS 撑高：v-md-editor 的内部布局由
 * `height` prop 驱动，CSS 撑高只会让外壳变高、内部编辑区不动，反而留出死区。
 *
 * 浏览器全屏/缩放只是把视口放大，`resize` 与 `fullscreenchange` 都会触发重算，因此非全屏与
 * 全屏共用同一套算法。结果与编辑器自身高度无关（只取决于它上方的内容），所以观察内容区高度
 * 变化触发的重算会稳定收敛，不会与 ResizeObserver 形成往复循环。
 *
 * 依赖页面结构：
 * - `.window` 遮罩窗口（`top:0; bottom:0`，高度随视口变化）
 * - `.window .v-md-editor` 编辑器
 * - `.window .footer` 页脚（`offsetHeight` 含内边距，连同 `.el-row` 外边距一起计入按钮占位）
 *
 * @param {import('vue').Ref<boolean>} isOpen 遮罩是否打开 — 打开后才挂载内容区观察器
 * @returns {{ editorHeight: import('vue').Ref<number> }} 绑定到 Markdown 的 height
 */
export function useEditorAutoHeight(isOpen) {
    const editorHeight = ref(395)
    let contentObserver = null

    /** 重新计算编辑器可用高度 */
    const recalcEditorHeight = () => {
        const winEl = document.querySelector('.window')
        if (!winEl) return
        const editorEl = winEl.querySelector('.v-md-editor')
        const footerEl = winEl.querySelector('.footer')
        if (!editorEl || !footerEl) return

        const winRect = winEl.getBoundingClientRect()
        const offsetTop = editorEl.getBoundingClientRect().top - winRect.top + winEl.scrollTop
        const footerRow = footerEl.querySelector('.el-row')
        const footerBlock = footerEl.offsetHeight + parseFloat(getComputedStyle(footerRow).marginTop || 0)

        const avail = winEl.clientHeight - offsetTop - footerBlock - EDITOR_HEIGHT_GUTTER
        editorHeight.value = Math.max(Math.floor(avail), EDITOR_MIN_HEIGHT)
    }

    /** 遮罩打开后观察内容区高度变化（引用图片面板 80↔300px 过渡、图片异步加载等） */
    watch(isOpen, (visible) => {
        contentObserver?.disconnect()
        contentObserver = null
        if (!visible) return

        nextTick(() => {
            recalcEditorHeight()
            const contentEl = document.querySelector('.window .content')
            if (contentEl && typeof ResizeObserver !== 'undefined') {
                contentObserver = new ResizeObserver(() => requestAnimationFrame(recalcEditorHeight))
                contentObserver.observe(contentEl)
            }
        })
    })

    onMounted(() => {
        // 浏览器全屏/缩放都会改变视口，编辑器高度需跟着重算
        window.addEventListener('resize', recalcEditorHeight)
        document.addEventListener('fullscreenchange', recalcEditorHeight)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', recalcEditorHeight)
        document.removeEventListener('fullscreenchange', recalcEditorHeight)
        contentObserver?.disconnect()
        contentObserver = null
    })

    return { editorHeight }
}
