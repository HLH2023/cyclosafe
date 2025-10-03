/**
 * 骑行记录仓储类
 * 负责骑行记录和轨迹点的CRUD操作
 * 基于 wx.setStorage 实现
 */

import { COLLECTIONS } from '@/utils/storage-engine.js';

/**
 * 更新骑行记录索引
 * @param {string} id 记录ID
 * @param {number} startTime 开始时间
 */
function updateRidingRecordIndex(id, startTime) {
  const indexes = wx.getStorageSync(COLLECTIONS.INDEXES) || { riding_records_by_time: [], danger_points_by_time: [] };

  // 移除旧索引
  const oldIndex = indexes.riding_records_by_time.indexOf(id);
  if (oldIndex > -1) {
    indexes.riding_records_by_time.splice(oldIndex, 1);
  }

  // 找到插入位置（保持时间倒序）
  const ridingRecords = wx.getStorageSync(COLLECTIONS.RIDING_RECORDS) || {};
  const insertIndex = indexes.riding_records_by_time.findIndex(existingId => {
    const existingRecord = ridingRecords[existingId];
    return startTime > (existingRecord?.start_time || 0);
  });

  if (insertIndex === -1) {
    indexes.riding_records_by_time.push(id);
  } else {
    indexes.riding_records_by_time.splice(insertIndex, 0, id);
  }

  wx.setStorageSync(COLLECTIONS.INDEXES, indexes);
}

/**
 * 从索引中移除骑行记录
 * @param {string} id 记录ID
 */
function removeFromRidingRecordIndex(id) {
  const indexes = wx.getStorageSync(COLLECTIONS.INDEXES) || { riding_records_by_time: [], danger_points_by_time: [] };
  const index = indexes.riding_records_by_time.indexOf(id);
  if (index > -1) {
    indexes.riding_records_by_time.splice(index, 1);
    wx.setStorageSync(COLLECTIONS.INDEXES, indexes);
  }
}

class RidingRecordRepository {
  /**
   * 保存骑行记录（包含轨迹点）
   * @param {Object} record 骑行记录对象
   * @returns {boolean} 是否保存成功
   */
  saveRecord(record) {
    try {
      const now = Date.now();
      const ridingRecords = wx.getStorageSync(COLLECTIONS.RIDING_RECORDS) || {};
      const trackPointsStorage = wx.getStorageSync(COLLECTIONS.TRACK_POINTS) || {};

      // 保存骑行记录
      ridingRecords[record.id] = {
        id: record.id,
        start_time: record.startTime,
        end_time: record.endTime,
        duration: record.duration,
        distance: record.distance,
        avg_speed: record.avgSpeed,
        max_speed: record.maxSpeed,
        total_ascent: record.totalAscent || 0,
        total_descent: record.totalDescent || 0,
        created_at: now,
        updated_at: now
      };
      wx.setStorageSync(COLLECTIONS.RIDING_RECORDS, ridingRecords);

      // 保存轨迹点
      if (record.trackPoints && record.trackPoints.length > 0) {
        trackPointsStorage[record.id] = record.trackPoints.map((point, index) => ({
          latitude: point.latitude,
          longitude: point.longitude,
          altitude: point.altitude || 0,
          speed: point.speed || 0,
          timestamp: point.timestamp,
          sequence: index
        }));
        wx.setStorageSync(COLLECTIONS.TRACK_POINTS, trackPointsStorage);
      }

      // 更新索引
      updateRidingRecordIndex(record.id, record.startTime);

      console.log('骑行记录保存成功:', record.id);
      return true;
    } catch (error) {
      console.error('保存骑行记录失败:', error);
      return false;
    }
  }

  /**
   * 获取单条骑行记录（含轨迹点）
   * @param {string} id 记录ID
   * @returns {Object|null} 骑行记录对象
   */
  getRecord(id) {
    try {
      const ridingRecords = wx.getStorageSync(COLLECTIONS.RIDING_RECORDS) || {};
      const record = ridingRecords[id];

      if (!record) {
        return null;
      }

      const trackPointsStorage = wx.getStorageSync(COLLECTIONS.TRACK_POINTS) || {};
      const trackPoints = trackPointsStorage[id] || [];

      return {
        id: record.id,
        startTime: record.start_time,
        endTime: record.end_time,
        duration: record.duration,
        distance: record.distance,
        avgSpeed: record.avg_speed,
        maxSpeed: record.max_speed,
        totalAscent: record.total_ascent || 0,
        totalDescent: record.total_descent || 0,
        trackPoints: trackPoints
      };
    } catch (error) {
      console.error('获取骑行记录失败:', error);
      return null;
    }
  }

  /**
   * 获取所有骑行记录ID列表
   * @returns {Array<string>} 记录ID数组
   */
  getRecordList() {
    try {
      const indexes = wx.getStorageSync(COLLECTIONS.INDEXES) || {};
      return indexes.riding_records_by_time || [];
    } catch (error) {
      console.error('获取记录列表失败:', error);
      return [];
    }
  }

  /**
   * 获取所有骑行记录（不含轨迹点）
   * @param {Object} options 查询选项
   * @returns {Array<Object>} 骑行记录数组
   */
  getAllRecords(options = {}) {
    try {
      const { limit, offset, startDate, endDate } = options;

      const ridingRecords = wx.getStorageSync(COLLECTIONS.RIDING_RECORDS) || {};
      const indexes = wx.getStorageSync(COLLECTIONS.INDEXES) || {};
      const sortedIds = indexes.riding_records_by_time || [];

      // 按索引顺序获取记录
      let records = sortedIds.map(id => ridingRecords[id]).filter(r => r);

      // 时间范围过滤
      if (startDate) {
        records = records.filter(r => r.start_time >= startDate);
      }
      if (endDate) {
        records = records.filter(r => r.start_time <= endDate);
      }

      // 分页
      const start = offset || 0;
      const end = limit ? start + limit : undefined;
      records = records.slice(start, end);

      // 转换字段名
      return records.map(record => ({
        id: record.id,
        startTime: record.start_time,
        endTime: record.end_time,
        duration: record.duration,
        distance: record.distance,
        avgSpeed: record.avg_speed,
        maxSpeed: record.max_speed,
        totalAscent: record.total_ascent || 0,
        totalDescent: record.total_descent || 0
      }));
    } catch (error) {
      console.error('获取所有记录失败:', error);
      return [];
    }
  }

  /**
   * 更新骑行记录
   * @param {string} id 记录ID
   * @param {Object} updates 更新字段
   * @returns {boolean} 是否更新成功
   */
  updateRecord(id, updates) {
    try {
      const ridingRecords = wx.getStorageSync(COLLECTIONS.RIDING_RECORDS) || {};
      const record = ridingRecords[id];

      if (!record) {
        return false;
      }

      // 更新字段
      if (updates.distance !== undefined) record.distance = updates.distance;
      if (updates.avgSpeed !== undefined) record.avg_speed = updates.avgSpeed;
      if (updates.maxSpeed !== undefined) record.max_speed = updates.maxSpeed;
      if (updates.totalAscent !== undefined) record.total_ascent = updates.totalAscent;
      if (updates.totalDescent !== undefined) record.total_descent = updates.totalDescent;

      record.updated_at = Date.now();

      ridingRecords[id] = record;
      wx.setStorageSync(COLLECTIONS.RIDING_RECORDS, ridingRecords);

      console.log('骑行记录更新成功:', id);
      return true;
    } catch (error) {
      console.error('更新骑行记录失败:', error);
      return false;
    }
  }

  /**
   * 删除骑行记录（级联删除轨迹点）
   * @param {string} id 记录ID
   * @returns {boolean} 是否删除成功
   */
  deleteRecord(id) {
    try {
      const ridingRecords = wx.getStorageSync(COLLECTIONS.RIDING_RECORDS) || {};
      const trackPointsStorage = wx.getStorageSync(COLLECTIONS.TRACK_POINTS) || {};

      // 删除骑行记录
      delete ridingRecords[id];
      wx.setStorageSync(COLLECTIONS.RIDING_RECORDS, ridingRecords);

      // 删除轨迹点
      delete trackPointsStorage[id];
      wx.setStorageSync(COLLECTIONS.TRACK_POINTS, trackPointsStorage);

      // 删除索引
      removeFromRidingRecordIndex(id);

      console.log('骑行记录删除成功:', id);
      return true;
    } catch (error) {
      console.error('删除骑行记录失败:', error);
      return false;
    }
  }

  /**
   * 清空所有骑行记录
   * @returns {boolean} 是否清空成功
   */
  clearAllRecords() {
    try {
      wx.setStorageSync(COLLECTIONS.TRACK_POINTS, {});
      wx.setStorageSync(COLLECTIONS.RIDING_RECORDS, {});

      // 清空索引
      const indexes = wx.getStorageSync(COLLECTIONS.INDEXES) || {};
      indexes.riding_records_by_time = [];
      wx.setStorageSync(COLLECTIONS.INDEXES, indexes);

      console.log('所有骑行记录已清空');
      return true;
    } catch (error) {
      console.error('清空骑行记录失败:', error);
      return false;
    }
  }

  /**
   * 获取统计数据
   * @returns {Object} 统计数据对象
   */
  getStatistics() {
    try {
      const ridingRecords = wx.getStorageSync(COLLECTIONS.RIDING_RECORDS) || {};
      const records = Object.values(ridingRecords);

      if (records.length === 0) {
        return {
          totalRides: 0,
          totalDistance: 0,
          totalDuration: 0,
          maxSpeed: 0,
          avgSpeed: 0
        };
      }

      let totalDistance = 0;
      let totalDuration = 0;
      let maxSpeed = 0;
      let totalAvgSpeed = 0;

      records.forEach(record => {
        totalDistance += record.distance || 0;
        totalDuration += record.duration || 0;
        maxSpeed = Math.max(maxSpeed, record.max_speed || 0);
        totalAvgSpeed += record.avg_speed || 0;
      });

      return {
        totalRides: records.length,
        totalDistance: totalDistance,
        totalDuration: totalDuration,
        maxSpeed: maxSpeed,
        avgSpeed: records.length > 0 ? totalAvgSpeed / records.length : 0
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        totalRides: 0,
        totalDistance: 0,
        totalDuration: 0,
        maxSpeed: 0,
        avgSpeed: 0
      };
    }
  }

  /**
   * 获取记录总数
   * @returns {number} 记录总数
   */
  getRecordCount() {
    try {
      const ridingRecords = wx.getStorageSync(COLLECTIONS.RIDING_RECORDS) || {};
      return Object.keys(ridingRecords).length;
    } catch (error) {
      console.error('获取记录总数失败:', error);
      return 0;
    }
  }
}

// 创建单例实例
let instance = null;

/**
 * 获取骑行记录仓储实例（单例）
 * @returns {RidingRecordRepository}
 */
export function getRidingRecordRepository() {
  if (!instance) {
    instance = new RidingRecordRepository();
  }
  return instance;
}

export default RidingRecordRepository;
