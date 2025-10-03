/**
 * 数据库初始化和管理
 * 基于 wx.setStorage 的本地存储方案
 */

import { getStorageEngineInstance, initStorageEngine, COLLECTIONS } from '@/utils/storage-engine.js';

/**
 * 初始化数据库系统
 * @returns {Promise<StorageEngine>}
 */
export async function setupDatabase() {
  try {
    console.log('开始初始化本地存储...');
    const db = await initStorageEngine();
    console.log('✅ 本地存储初始化成功');
    return db;
  } catch (error) {
    console.error('本地存储初始化失败:', error);
    throw error;
  }
}

/**
 * 获取数据库实例
 * @returns {StorageEngine}
 */
export function getDatabase() {
  return getStorageEngineInstance();
}

/**
 * 清空所有数据（用于测试或重置）
 */
export function clearAllData() {
  try {
    wx.setStorageSync(COLLECTIONS.TRACK_POINTS, {});
    wx.setStorageSync(COLLECTIONS.RIDING_RECORDS, {});
    wx.setStorageSync(COLLECTIONS.DANGER_POINTS, {});
    // 清空索引
    const indexes = wx.getStorageSync(COLLECTIONS.INDEXES) || {};
    indexes.riding_records_by_time = [];
    indexes.danger_points_by_time = [];
    wx.setStorageSync(COLLECTIONS.INDEXES, indexes);

    console.log('所有数据已清空');
    return true;
  } catch (error) {
    console.error('清空数据失败:', error);
    return false;
  }
}

/**
 * 清空所有危险点（用于设置页面）
 */
export function clearAllDangerPointsData() {
  try {
    wx.setStorageSync(COLLECTIONS.DANGER_POINTS, {});
    // 清空危险点索引
    const indexes = wx.getStorageSync(COLLECTIONS.INDEXES) || {};
    indexes.danger_points_by_time = [];
    wx.setStorageSync(COLLECTIONS.INDEXES, indexes);

    console.log('所有危险点已清空');
    return true;
  } catch (error) {
    console.error('清空危险点失败:', error);
    return false;
  }
}

/**
 * 导出数据库统计信息
 * @returns {Object} 统计信息
 */
export function getDatabaseStats() {
  try {
    const ridingRecords = wx.getStorageSync(COLLECTIONS.RIDING_RECORDS) || {};
    const trackPoints = wx.getStorageSync(COLLECTIONS.TRACK_POINTS) || {};
    const dangerPoints = wx.getStorageSync(COLLECTIONS.DANGER_POINTS) || {};
    const settings = wx.getStorageSync(COLLECTIONS.SETTINGS) || {};

    // 计算轨迹点总数
    let totalTrackPoints = 0;
    Object.values(trackPoints).forEach(points => {
      if (Array.isArray(points)) {
        totalTrackPoints += points.length;
      }
    });

    return {
      totalRecords: Object.keys(ridingRecords).length,
      totalTrackPoints: totalTrackPoints,
      totalDangerPoints: Object.keys(dangerPoints).length,
      totalSettings: Object.keys(settings).length
    };
  } catch (error) {
    console.error('获取数据库统计失败:', error);
    return {
      totalRecords: 0,
      totalTrackPoints: 0,
      totalDangerPoints: 0,
      totalSettings: 0
    };
  }
}

export default {
  setupDatabase,
  getDatabase,
  clearAllData,
  clearAllDangerPointsData,
  getDatabaseStats
};
