/**
 * Markdown 转纯文本，供文章列表摘要使用
 * 规则与后端 MarkdownUtils.toPlainText 保持一致：后端入库前已转纯文本，这里主要兜住存量旧数据
 * 只处理真实出现过的语法，未出现的一律不实现（斜体、图片、水平线），避免误伤正文
 */
export const mdToPlainText = (mdStr) => {
  // t_question：空值处理
  if (!mdStr) return '' // 处理null/undefined

  return mdStr
    .replace(/```[\s\S]*?(?:```|$)/g, ' ')          // 围栏代码块整块剔除（含未闭合：正文被截断时会剩半个围栏）
    .replace(/`([^`\n]*)`/g, '$1')                  // 行内代码只脱反引号、保留文本——技术文里行内代码常是句子的主语
    // 后端只对完整正文做纯文本化，这里多一步兜底：存量数据是从行内代码中间截断的，
    // 会留下落单的反引号。后端永远遇不到（实测 16 篇完整正文落单数为 0），故不重复实现
    .replace(/`/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')      // 图片/链接只留文字
    .replace(/^#{1,6}\s*/gm, '')                    // 标题标记
    .replace(/^\s*>\s?/gm, '')                      // 引用标记
    .replace(/^\s*[-*+]\s+/gm, '')                  // 无序列表标记
    .replace(/^\s*\d+\.\s+/gm, '')                  // 有序列表标记
    .replace(/^\s*\|?[\s:|-]{5,}\|[\s:|-]*$/gm, ' ') // 表格分隔行整行剔除
    .replace(/\|/g, ' ')                            // 其余表格竖线换空格
    .replace(/\*\*/g, '')                           // 粗体标记。单个 _ 和 * 不碰：全是 MYSQL_ROOT_PASSWORD 这类标识符
    .replace(/<!--[\s\S]*?-->/g, ' ')               // HTML 注释
    .replace(/<[^>]*>/g, ' ')                       // HTML 标签
    .replace(/\s+/g, ' ')                           // 空白归一
    .trim()
}
