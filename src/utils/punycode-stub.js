/**
 * 给 markdown-it 用的 punycode 空实现：它只在 IDN 域名的 try/catch 里调用，本来就会抛错被吞掉，透传等价。
 * 不能留 Vite 的内置替身：那个替身被入口侧 crypto-js 共用，会把整个 editor chunk 拖进首屏（见 docs/admin/首屏包体优化-拆包陷阱与echarts懒加载.md）
 */
const passthrough = (input) => input

export const toASCII = passthrough
export const toUnicode = passthrough

export default { toASCII, toUnicode }
