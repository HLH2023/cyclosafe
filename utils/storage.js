/**
 * 本地存储工具类
 * 使用 wx.setStorage 作为底层存储
 */

import { STORAGE_KEYS } from './constants';
import { getRidingRecordRepository, getSettingsRepository } from '@/db/repositories/index.js';

// 延迟获取仓储实例（在首次使用时获取，确保数据库已初始化）
let ridingRecordRepo = null;
let settingsRepo = null;

function ensureRepositories() {
  if (!ridingRecordRepo) {
    ridingRecordRepo = getRidingRecordRepository();
  }
  if (!settingsRepo) {
    settingsRepo = getSettingsRepository();
  }
}

/**
 * 保存骑行记录
 * @param {Object} record 骑行记录对象
 */
export async function saveRidingRecord(record) {
  try {
    ensureRepositories();
    // 使用 RidingRecordRepository 保存
    const result = await ridingRecordRepo.saveRecord(record);
    return result;
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
    ensureRepositories();
    return ridingRecordRepo.getRecord(id);
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
    ensureRepositories();
    return ridingRecordRepo.getRecordList();
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
  try {
    ensureRepositories();
    return ridingRecordRepo.getAllRecords();
  } catch (err) {
    console.error('获取所有记录失败:', err);
    return [];
  }
}

/**
 * 删除骑行记录
 * @param {string} id 记录ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteRidingRecord(id) {
  try {
    ensureRepositories();
    return await ridingRecordRepo.deleteRecord(id);
  } catch (err) {
    console.error('删除骑行记录失败:', err);
    return false;
  }
}

/**
 * 清空所有骑行记录
 * @returns {Promise<boolean>} 是否清空成功
 */
export async function clearAllRecords() {
  try {
    ensureRepositories();
    return await ridingRecordRepo.clearAllRecords();
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
    ensureRepositories();
    return settingsRepo.saveSetting(key, value);
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
    ensureRepositories();
    return settingsRepo.getSetting(key, defaultValue);
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
  try {
    ensureRepositories();
    return ridingRecordRepo.getStatistics();
  } catch (err) {
    console.error('获取统计数据失败:', err);
    return {
      totalRides: 0,
      totalDistance: 0,
      totalDuration: 0,
      maxSpeed: 0,
      avgSpeed: 0
    };
  }
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
