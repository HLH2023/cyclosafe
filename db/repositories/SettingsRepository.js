/**
 * 设置仓储类
 * 负责应用设置的键值对存储
 */

import { getDatabase } from '../database.js';

class SettingsRepository {
  constructor(db) {
    this.db = db || getDatabase();
  }

  /**
   * 保存设置
   * @param {string} key 设置键名
   * @param {any} value 设置值（会被JSON序列化）
   * @returns {boolean} 是否保存成功
   */
  saveSetting(key, value) {
    try {
      // 将值序列化为JSON字符串
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

      this.db.run(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `, [key, valueStr, Date.now()]);

      this.db.saveDatabaseToFile();

      console.log('设置已保存:', key);
      return true;
    } catch (error) {
      console.error('保存设置失败:', error);
      return false;
    }
  }

  /**
   * 获取设置
   * @param {string} key 设置键名
   * @param {any} defaultValue 默认值
   * @returns {any} 设置值
   */
  getSetting(key, defaultValue = null) {
    try {
      const result = this.db.executeOne(`
        SELECT value FROM settings WHERE key = ?
      `, [key]);

      if (!result) {
        return defaultValue;
      }

      // 尝试解析JSON，如果失败则返回原始字符串
      try {
        return JSON.parse(result.value);
      } catch {
        return result.value;
      }
    } catch (error) {
      console.error('获取设置失败:', error);
      return defaultValue;
    }
  }

  /**
   * 删除设置
   * @param {string} key 设置键名
   * @returns {boolean} 是否删除成功
   */
  deleteSetting(key) {
    try {
      this.db.run('DELETE FROM settings WHERE key = ?', [key]);
      this.db.saveDatabaseToFile();

      console.log('设置已删除:', key);
      return true;
    } catch (error) {
      console.error('删除设置失败:', error);
      return false;
    }
  }

  /**
   * 获取所有设置
   * @returns {Object} 设置键值对对象
   */
  getAllSettings() {
    try {
      const results = this.db.execute('SELECT key, value FROM settings');

      const settings = {};
      results.forEach(row => {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      });

      return settings;
    } catch (error) {
      console.error('获取所有设置失败:', error);
      return {};
    }
  }

  /**
   * 批量保存设置
   * @param {Object} settings 设置对象
   * @returns {Promise<boolean>} 是否保存成功
   */
  async batchSaveSettings(settings) {
    try {
      const result = await this.db.transaction(async (txDb) => {
        const now = Date.now();

        Object.entries(settings).forEach(([key, value]) => {
          const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

          txDb.run(`
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES (?, ?, ?)
          `, [key, valueStr, now]);
        });

        return true;
      });

      console.log('批量保存设置成功，共', Object.keys(settings).length, '项');
      return result;
    } catch (error) {
      console.error('批量保存设置失败:', error);
      return false;
    }
  }

  /**
   * 清空所有设置（保留系统设置）
   * @param {Array<string>} preserveKeys 需要保留的键名列表
   * @returns {boolean} 是否清空成功
   */
  clearSettings(preserveKeys = ['db_version']) {
    try {
      if (preserveKeys.length > 0) {
        const placeholders = preserveKeys.map(() => '?').join(',');
        this.db.run(`
          DELETE FROM settings WHERE key NOT IN (${placeholders})
        `, preserveKeys);
      } else {
        this.db.run('DELETE FROM settings');
      }

      this.db.saveDatabaseToFile();

      console.log('设置已清空');
      return true;
    } catch (error) {
      console.error('清空设置失败:', error);
      return false;
    }
  }

  /**
   * 检查设置是否存在
   * @param {string} key 设置键名
   * @returns {boolean} 是否存在
   */
  hasSetting(key) {
    try {
      const result = this.db.executeOne(`
        SELECT 1 FROM settings WHERE key = ?
      `, [key]);

      return result !== null;
    } catch (error) {
      console.error('检查设置失败:', error);
      return false;
    }
  }

  /**
   * 获取设置的更新时间
   * @param {string} key 设置键名
   * @returns {number|null} 更新时间戳
   */
  getSettingUpdatedAt(key) {
    try {
      const result = this.db.executeOne(`
        SELECT updated_at FROM settings WHERE key = ?
      `, [key]);

      return result ? result.updated_at : null;
    } catch (error) {
      console.error('获取设置更新时间失败:', error);
      return null;
    }
  }
}

// 创建单例实例
let instance = null;

/**
 * 获取设置仓储实例（单例）
 * @returns {SettingsRepository}
 */
export function getSettingsRepository() {
  if (!instance) {
    instance = new SettingsRepository();
  }
  return instance;
}

export default SettingsRepository;
