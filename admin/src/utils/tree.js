/**
 * 按 name 在树形数组中查找行对象
 * @param {Array} list - 树形数组
 * @param {string} targetName - 目标 name
 * @returns {Object|null}
 */
export const findRowByName = (list, targetName) => {
  for (const row of list) {
    if (row.name === targetName) return row
    if (row.children) {
      const found = findRowByName(row.children, targetName)
      if (found) return found
    }
  }
  return null
}

/**
 * 按 id 在树形数组中查找行对象
 * @param {Array} list - 树形数组
 * @param {number|string} id - 目标 id
 * @returns {Object|null}
 */
export const findRowById = (list, id) => {
  for (const row of list) {
    if (row.id === id) return row
    if (row.children) {
      const found = findRowById(row.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * 按名称递归收集目标行及其所有祖先的 id
 * @param {Array} list - 树形数组
 * @param {string} targetName - 目标 name
 * @param {Array} ids - 收集 id 的数组（会被原地修改）
 * @returns {boolean} 是否找到
 */
export const findByName = (list, targetName, ids) => {
  for (const row of list) {
    if (row.name === targetName) {
      ids.push(row.id)
      return true
    }
    if (row.children && row.children.length) {
      ids.push(row.id)
      if (findByName(row.children, targetName, ids)) return true
      ids.pop()
    }
  }
  return false
}
