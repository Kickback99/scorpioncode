/**
 * 伪装存储工具 - 支持 localStorage 和 sessionStorage
 * 让存储的数据看起来像其他东西
 */
export const StealthStorage = {
  // 存储映射表
  _map: new Map(),
  
  /**
   * 初始化映射关系
   * @param {string} type - 存储类型: 'localStorage' 或 'sessionStorage'
   * @param {string} realKey - 真实的业务 key
   * @param {string} fakeKey - 对外显示的伪装 key
   * @param {string} salt - 可选，防简单篡改的盐值
   */
  init(type, realKey, fakeKey, salt = '') {
    if (!['localStorage', 'sessionStorage'].includes(type)) {
      throw new Error('type 必须是 localStorage 或 sessionStorage');
    }
    this._map.set(realKey, { type, fakeKey, salt });
    return this;
  },
  
  // 获取对应的存储对象
  _getStorage(type) {
    return type === 'localStorage' ? localStorage : sessionStorage;
  },
  
  // 设置值
  set(realKey, value) {
    const config = this._map.get(realKey);
    if (!config) {
      throw new Error(`未找到 key: ${realKey} 的映射配置，请先调用 init()`);
    }
    
    const { type, fakeKey, salt } = config;
    const storage = this._getStorage(type);
    const strValue = String(value);
    const encoded = btoa(encodeURIComponent(strValue + salt));
    storage.setItem(fakeKey, encoded);
    return this;
  },
  
  // 获取值
  get(realKey) {
    const config = this._map.get(realKey);
    if (!config) {
      throw new Error(`未找到 key: ${realKey} 的映射配置，请先调用 init()`);
    }
    
    const { type, fakeKey, salt } = config;
    const storage = this._getStorage(type);
    const raw = storage.getItem(fakeKey);
    if (!raw) return null;
    
    try {
      const decoded = decodeURIComponent(atob(raw));
      if (salt && !decoded.endsWith(salt)) return null;
      const value = salt ? decoded.slice(0, -salt.length) : decoded;
      return value; // 直接返回字符串
    } catch(e) {
      return null;
    }
  },
  
  // 删除
  remove(realKey) {
    const config = this._map.get(realKey);
    if (!config) {
      throw new Error(`未找到 key: ${realKey} 的映射配置，请先调用 init()`);
    }
    
    const { type, fakeKey } = config;
    const storage = this._getStorage(type);
    storage.removeItem(fakeKey);
    return this;
  },
  
  // 检查是否存在
  has(realKey) {
    const config = this._map.get(realKey);
    if (!config) return false;
    
    const { type, fakeKey } = config;
    const storage = this._getStorage(type);
    return storage.getItem(fakeKey) !== null;
  },
  
  // 查看所有已配置的映射（调试用）
  debug() {
    const result = [];
    for (const [realKey, config] of this._map.entries()) {
      const { type, fakeKey, salt } = config;
      const storage = this._getStorage(type);
      const raw = storage.getItem(fakeKey);
      result.push({ realKey, type, fakeKey, salt, raw });
    }
    return result;
  }
};

