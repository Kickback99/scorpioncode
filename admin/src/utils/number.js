// 统计数字展示：万以下补千分位，万/亿保留 1 位小数并去掉尾零
const trimZero = (v) => v.toFixed(1).replace(/\.0$/, '')

export const formatCount = (num) => {
  const n = Math.round(num ?? 0)
  if (n < 1e4) return n.toLocaleString('en-US')
  if (n >= 1e8) return trimZero(n / 1e8) + '亿'
  const wan = trimZero(n / 1e4)
  // 9999.95 万四舍五入会进位成 10000 万，改按 1 亿展示
  return wan === '10000' ? trimZero(n / 1e8) + '亿' : wan + '万'
}
