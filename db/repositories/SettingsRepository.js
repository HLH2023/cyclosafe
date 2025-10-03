/**
 * 设置仓储类
 * 负责应用设置的键值对存储
 * 基于 wx.setStorage 实现
 */

import { COLLECTIONS } from '@/utils/storage-engine.js';

class SettingsRepository {
  /**
   * 保存设置
   * @param {string} key 设置键名
   * @param {any} value 设置值（会被JSON序列化）
   * @returns {boolean} 是否保存成功
   */
  saveSetting(key, value) {
    try {
      const settings = wx.getStorageSync(COLLECTIONS.SETTINGS) || {};
      const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);

      settings[key] = {
        value: valueToStore,
        updated_at: Date.now()
      };

      wx.setStorageSync(COLLECTIONS.SETTINGS, settings);

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
      const settings = wx.getStorageSync(COLLECTIONS.SETTINGS) || {};
      const setting = settings[key];

      if (!setting) {
        return defaultValue;
      }

      const valueStr = setting.value;

      // 尝试解析JSON，如果失败则返回原始字符串
      try {
        return JSON.parse(valueStr);
      } catch {
        return valueStr;
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
      const settings = wx.getStorageSync(COLLECTIONS.SETTINGS) || {};
      delete settings[key];
      wx.setStorageSync(COLLECTIONS.SETTINGS, settings);

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
      const settings = wx.getStorageSync(COLLECTIONS.SETTINGS) || {};
      const result = {};

      Object.entries(settings).forEach(([key, setting]) => {
        const valueStr = setting.value;
        try {
          result[key] = JSON.parse(valueStr);
        } catch {
          result[key] = valueStr;
        }
      });

      return result;
    } catch (error) {
      console.error('获取所有设置失败:', error);
      return {};
    }
  }

  /**
   * 批量保存设置
   * @param {Object} settingsToSave 设置对象
   * @returns {boolean} 是否保存成功
   */
  batchSaveSettings(settingsToSave) {
    try {
      const settings = wx.getStorageSync(COLLECTIONS.SETTINGS) || {};
      const now = Date.now();

      Object.entries(settingsToSave).forEach(([key, value]) => {
        const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
        settings[key] = {
          value: valueToStore,
          updated_at: now
        };
      });

      wx.setStorageSync(COLLECTIONS.SETTINGS, settings);

      console.log('批量保存设置成功，共', Object.keys(settingsToSave).length, '项');
      return true;
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
      const settings = wx.getStorageSync(COLLECTIONS.SETTINGS) || {};
      const newSettings = {};

      // 保留指定的设置
      preserveKeys.forEach(key => {
        if (settings[key]) {
          newSettings[key] = settings[key];
        }
      });

      wx.setStorageSync(COLLECTIONS.SETTINGS, newSettings);

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
      const settings = wx.getStorageSync(COLLECTIONS.SETTINGS) || {};
      return settings.hasOwnProperty(key);
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
      const settings = wx.getStorageSync(COLLECTIONS.SETTINGS) || {};
      const setting = settings[key];
      return setting ? setting.updated_at : null;
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
