/**
 * 本地存储工具类
 */

import { STORAGE_KEYS } from './constants';

/**
 * 保存骑行记录
 * @param {Object} record 骑行记录对象
 */
export function saveRidingRecord(record) {
  try {
    const key = `${STORAGE_KEYS.RIDING_RECORD_PREFIX}${record.id}`;
    uni.setStorageSync(key, JSON.stringify(record));

    // 更新记录列表
    const list = getRecordList();
    if (!list.includes(record.id)) {
      list.unshift(record.id);
      uni.setStorageSync(STORAGE_KEYS.RIDING_LIST, JSON.stringify(list));
    }

    return true;
  } catch (err) {
    console.error('保存骑行记录失败:', err);
    return false;
  }
}

/**
 * 获取骑行记录
 * @param {string} id 记录ID
 * @returns {Object|null} 骑行记录对象
 */
export function getRidingRecord(id) {
  try {
    const key = `${STORAGE_KEYS.RIDING_RECORD_PREFIX}${id}`;
    const data = uni.getStorageSync(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('获取骑行记录失败:', err);
    return null;
  }
}

/**
 * 获取记录列表（ID数组）
 * @returns {Array} 记录ID数组
 */
export function getRecordList() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.RIDING_LIST);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('获取记录列表失败:', err);
    return [];
  }
}

/**
 * 获取所有骑行记录
 * @returns {Array} 骑行记录数组
 */
export function getAllRecords() {
  const ids = getRecordList();
  return ids.map(id => getRidingRecord(id)).filter(record => record !== null);
}

/**
 * 删除骑行记录
 * @param {string} id 记录ID
 * @returns {boolean} 是否删除成功
 */
export function deleteRidingRecord(id) {
  try {
    const key = `${STORAGE_KEYS.RIDING_RECORD_PREFIX}${id}`;
    uni.removeStorageSync(key);

    // 更新记录列表
    const list = getRecordList();
    const newList = list.filter(item => item !== id);
    uni.setStorageSync(STORAGE_KEYS.RIDING_LIST, JSON.stringify(newList));

    return true;
  } catch (err) {
    console.error('删除骑行记录失败:', err);
    return false;
  }
}

/**
 * 清空所有骑行记录
 * @returns {boolean} 是否清空成功
 */
export function clearAllRecords() {
  try {
    const list = getRecordList();

    // 删除所有记录
    list.forEach(id => {
      const key = `${STORAGE_KEYS.RIDING_RECORD_PREFIX}${id}`;
      uni.removeStorageSync(key);
    });

    // 清空列表
    uni.setStorageSync(STORAGE_KEYS.RIDING_LIST, '[]');

    return true;
  } catch (err) {
    console.error('清空骑行记录失败:', err);
    return false;
  }
}

/**
 * 保存设置
 * @param {string} key 设置键名
 * @param {any} value 设置值
 */
export function saveSetting(key, value) {
  try {
    uni.setStorageSync(key, value);
    return true;
  } catch (err) {
    console.error('保存设置失败:', err);
    return false;
  }
}

/**
 * 获取设置
 * @param {string} key 设置键名
 * @param {any} defaultValue 默认值
 * @returns {any} 设置值
 */
export function getSetting(key, defaultValue = null) {
  try {
    const value = uni.getStorageSync(key);
    return value !== '' && value !== undefined ? value : defaultValue;
  } catch (err) {
    console.error('获取设置失败:', err);
    return defaultValue;
  }
}

/**
 * 获取统计数据
 * @returns {Object} 统计数据
 */
export function getStatistics() {
  const records = getAllRecords();

  const stats = {
    totalRides: records.length,
    totalDistance: 0,
    totalDuration: 0,
    maxSpeed: 0,
    avgSpeed: 0
  };

  records.forEach(record => {
    stats.totalDistance += record.distance || 0;
    stats.totalDuration += record.duration || 0;
    stats.maxSpeed = Math.max(stats.maxSpeed, record.maxSpeed || 0);
  });

  if (stats.totalDuration > 0) {
    stats.avgSpeed = (stats.totalDistance / stats.totalDuration) * 3600;
  }

  return stats;
}

export default {
  saveRidingRecord,
  getRidingRecord,
  getRecordList,
  getAllRecords,
  deleteRidingRecord,
  clearAllRecords,
  saveSetting,
  getSetting,
  getStatistics
};
