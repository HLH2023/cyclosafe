/**
 * 本地存储引擎
 * 基于 wx.setStorage 的简单封装
 */

// 存储键名前缀
const PREFIX = 'cyclosafe_';

// 集合名称
const COLLECTIONS = {
  RIDING_RECORDS: `${PREFIX}riding_records`,
  TRACK_POINTS: `${PREFIX}track_points`,
  DANGER_POINTS: `${PREFIX}danger_points`,
  SETTINGS: `${PREFIX}settings`,
  INDEXES: `${PREFIX}indexes`
};

class StorageEngine {
  constructor() {
    this.isInitialized = false;
    this.isNewDatabase = false;
  }

  /**
   * 初始化存储引擎
   * @returns {Promise<boolean>}
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      // 检查是否为新数据库
      try {
        const indexes = wx.getStorageSync(COLLECTIONS.INDEXES);
        this.isNewDatabase = !indexes;
      } catch (e) {
        this.isNewDatabase = true;
      }

      // 如果是新数据库，初始化基础结构
      if (this.isNewDatabase) {
        wx.setStorageSync(COLLECTIONS.RIDING_RECORDS, {});
        wx.setStorageSync(COLLECTIONS.TRACK_POINTS, {});
        wx.setStorageSync(COLLECTIONS.DANGER_POINTS, {});
        wx.setStorageSync(COLLECTIONS.SETTINGS, {});
        wx.setStorageSync(COLLECTIONS.INDEXES, {
          riding_records_by_time: [],
          danger_points_by_time: []
        });
        console.log('已创建新存储');
      } else {
        console.log('已加载现有存储');
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('初始化存储引擎失败:', error);
      return false;
    }
  }

  /**
   * 导出数据库（用于备份）
   * @returns {Object}
   */
  exportDatabase() {
    return {
      riding_records: wx.getStorageSync(COLLECTIONS.RIDING_RECORDS) || {},
      track_points: wx.getStorageSync(COLLECTIONS.TRACK_POINTS) || {},
      danger_points: wx.getStorageSync(COLLECTIONS.DANGER_POINTS) || {},
      settings: wx.getStorageSync(COLLECTIONS.SETTINGS) || {},
      indexes: wx.getStorageSync(COLLECTIONS.INDEXES) || {}
    };
  }

  /**
   * 导入数据库（用于恢复）
   * @param {Object} data 数据库数据
   */
  importDatabase(data) {
    if (data.riding_records) wx.setStorageSync(COLLECTIONS.RIDING_RECORDS, data.riding_records);
    if (data.track_points) wx.setStorageSync(COLLECTIONS.TRACK_POINTS, data.track_points);
    if (data.danger_points) wx.setStorageSync(COLLECTIONS.DANGER_POINTS, data.danger_points);
    if (data.settings) wx.setStorageSync(COLLECTIONS.SETTINGS, data.settings);
    if (data.indexes) wx.setStorageSync(COLLECTIONS.INDEXES, data.indexes);
  }
}

// 创建单例实例
let instance = null;

/**
 * 获取存储引擎实例（单例模式）
 * @returns {StorageEngine}
 */
export function getStorageEngineInstance() {
  if (!instance) {
    instance = new StorageEngine();
  }
  return instance;
}

/**
 * 初始化存储引擎
 * @returns {Promise<StorageEngine>}
 */
export async function initStorageEngine() {
  const engine = getStorageEngineInstance();
  await engine.initialize();
  return engine;
}

// 导出集合名称常量
export { COLLECTIONS };

export default {
  getStorageEngineInstance,
  initStorageEngine,
  COLLECTIONS
};
