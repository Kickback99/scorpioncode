// 懒加载 pinyin-match（超大拼音字典），仅在真正需要拼音匹配时才动态加载，避免拖慢首屏
let cachePromise = null

export function loadPinyinMatch() {
  if (!cachePromise) {
    cachePromise = import('pinyin-match').then((m) => m.default ?? m)
  }
  return cachePromise
}
