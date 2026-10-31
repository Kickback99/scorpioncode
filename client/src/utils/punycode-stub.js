/**
 * 给 markdown-it 用的 punycode 空实现：它只在 IDN 域名的 try/catch 里调用，本来就会抛错被吞掉，透传等价。
 * 用它替换 Vite 的 node 内置替身，可消除「Module "punycode" has been externalized」构建警告。
 */
const passthrough = (input) => input

export const toASCII = passthrough
export const toUnicode = passthrough

export default { toASCII, toUnicode }
