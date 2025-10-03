/**
 * 危险点仓储类
 * 负责危险点的CRUD操作
 * 基于 wx.setStorage 实现
 */

import { generateUUID } from '@/utils/uuid.js';
import { COLLECTIONS } from '@/utils/storage-engine.js';

/**
 * 更新危险点索引
 * @param {string} id 危险点ID
 * @param {number} createdAt 创建时间
 */
function updateDangerPointIndex(id, createdAt) {
  const indexes = wx.getStorageSync(COLLECTIONS.INDEXES) || { riding_records_by_time: [], danger_points_by_time: [] };

  // 移除旧索引
  const oldIndex = indexes.danger_points_by_time.indexOf(id);
  if (oldIndex > -1) {
    indexes.danger_points_by_time.splice(oldIndex, 1);
  }

  // 找到插入位置（保持时间倒序）
  const dangerPoints = wx.getStorageSync(COLLECTIONS.DANGER_POINTS) || {};
  const insertIndex = indexes.danger_points_by_time.findIndex(existingId => {
    const existingPoint = dangerPoints[existingId];
    return createdAt > (existingPoint?.created_at || 0);
  });

  if (insertIndex === -1) {
    indexes.danger_points_by_time.push(id);
  } else {
    indexes.danger_points_by_time.splice(insertIndex, 0, id);
  }

  wx.setStorageSync(COLLECTIONS.INDEXES, indexes);
}

/**
 * 从索引中移除危险点
 * @param {string} id 危险点ID
 */
function removeFromDangerPointIndex(id) {
  const indexes = wx.getStorageSync(COLLECTIONS.INDEXES) || { riding_records_by_time: [], danger_points_by_time: [] };
  const index = indexes.danger_points_by_time.indexOf(id);
  if (index > -1) {
    indexes.danger_points_by_time.splice(index, 1);
    wx.setStorageSync(COLLECTIONS.INDEXES, indexes);
  }
}

class DangerPointRepository {
  /**
   * 保存危险点
   * @param {Object} dangerPoint 危险点对象
   * @returns {string|boolean} 危险点ID或false
   */
  saveDangerPoint(dangerPoint) {
    try {
      const now = Date.now();
      const id = dangerPoint.id || generateUUID();
      const dangerPoints = wx.getStorageSync(COLLECTIONS.DANGER_POINTS) || {};

      dangerPoints[id] = {
        id: id,
        name: dangerPoint.name,
        latitude: dangerPoint.latitude,
        longitude: dangerPoint.longitude,
        danger_type: dangerPoint.danger_type,
        speed: dangerPoint.speed || 0,
        record_id: dangerPoint.record_id || null,
        created_at: now,
        updated_at: now
      };

      wx.setStorageSync(COLLECTIONS.DANGER_POINTS, dangerPoints);

      // 更新索引
      updateDangerPointIndex(id, now);

      console.log('危险点保存成功:', id);
      return id;
    } catch (error) {
      console.error('保存危险点失败:', error);
      return false;
    }
  }

  /**
   * 获取所有危险点
   * @returns {Array<Object>} 危险点数组
   */
  getAllDangerPoints() {
    try {
      const dangerPoints = wx.getStorageSync(COLLECTIONS.DANGER_POINTS) || {};
      const indexes = wx.getStorageSync(COLLECTIONS.INDEXES) || {};
      const sortedIds = indexes.danger_points_by_time || [];

      // 按时间倒序返回
      const results = sortedIds.map(id => dangerPoints[id]).filter(p => p);

      return results.map(row => ({
        id: row.id,
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
        dangerType: row.danger_type,
        speed: row.speed,
        recordId: row.record_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('获取危险点列表失败:', error);
      return [];
    }
  }

  /**
   * 获取单个危险点
   * @param {string} id 危险点ID
   * @returns {Object|null} 危险点对象
   */
  getDangerPoint(id) {
    try {
      const dangerPoints = wx.getStorageSync(COLLECTIONS.DANGER_POINTS) || {};
      const row = dangerPoints[id];

      if (!row) {
        return null;
      }

      return {
        id: row.id,
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
        dangerType: row.danger_type,
        speed: row.speed,
        recordId: row.record_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('获取危险点失败:', error);
      return null;
    }
  }

  /**
   * 更新危险点名称
   * @param {string} id 危险点ID
   * @param {string} name 新名称
   * @returns {boolean} 是否更新成功
   */
  updateDangerPointName(id, name) {
    try {
      const dangerPoints = wx.getStorageSync(COLLECTIONS.DANGER_POINTS) || {};
      const point = dangerPoints[id];

      if (!point) {
        return false;
      }

      point.name = name;
      point.updated_at = Date.now();

      dangerPoints[id] = point;
      wx.setStorageSync(COLLECTIONS.DANGER_POINTS, dangerPoints);

      console.log('危险点名称更新成功:', id);
      return true;
    } catch (error) {
      console.error('更新危险点名称失败:', error);
      return false;
    }
  }

  /**
   * 删除危险点
   * @param {string} id 危险点ID
   * @returns {boolean} 是否删除成功
   */
  deleteDangerPoint(id) {
    try {
      const dangerPoints = wx.getStorageSync(COLLECTIONS.DANGER_POINTS) || {};

      delete dangerPoints[id];
      wx.setStorageSync(COLLECTIONS.DANGER_POINTS, dangerPoints);

      // 删除索引
      removeFromDangerPointIndex(id);

      console.log('危险点删除成功:', id);
      return true;
    } catch (error) {
      console.error('删除危险点失败:', error);
      return false;
    }
  }

  /**
   * 查询附近的危险点
   * @param {number} latitude 纬度
   * @param {number} longitude 经度
   * @param {number} radius 半径（公里，默认0.05即50米）
   * @returns {Array<Object>} 附近的危险点数组
   */
  getDangerPointsNearby(latitude, longitude, radius = 0.05) {
    try {
      const dangerPoints = wx.getStorageSync(COLLECTIONS.DANGER_POINTS) || {};
      const allPoints = Object.values(dangerPoints);

      // 简化版：使用矩形范围过滤
      const latDelta = radius / 111;
      const lngDelta = radius / (111 * Math.cos(latitude * Math.PI / 180));

      const minLat = latitude - latDelta;
      const maxLat = latitude + latDelta;
      const minLng = longitude - lngDelta;
      const maxLng = longitude + lngDelta;

      // 矩形范围内的点
      const candidates = allPoints.filter(point =>
        point.latitude >= minLat && point.latitude <= maxLat &&
        point.longitude >= minLng && point.longitude <= maxLng
      );

      // 精确计算距离并过滤
      const points = candidates.map(row => {
        const distance = this.calculateDistance(
          latitude, longitude,
          row.latitude, row.longitude
        );

        return {
          id: row.id,
          name: row.name,
          latitude: row.latitude,
          longitude: row.longitude,
          dangerType: row.danger_type,
          speed: row.speed,
          recordId: row.record_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          distance: distance // 距离（公里）
        };
      }).filter(p => p.distance <= radius);

      // 按距离排序
      points.sort((a, b) => a.distance - b.distance);

      return points;
    } catch (error) {
      console.error('查询附近危险点失败:', error);
      return [];
    }
  }

  /**
   * 计算两点间距离（Haversine公式）
   * @param {number} lat1 纬度1
   * @param {number} lon1 经度1
   * @param {number} lat2 纬度2
   * @param {number} lon2 经度2
   * @returns {number} 距离（公里）
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) *
              Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 清空所有危险点
   * @returns {boolean} 是否清空成功
   */
  clearAllDangerPoints() {
    try {
      wx.setStorageSync(COLLECTIONS.DANGER_POINTS, {});

      // 清空索引
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
   * 获取危险点总数
   * @returns {number} 危险点总数
   */
  getDangerPointCount() {
    try {
      const dangerPoints = wx.getStorageSync(COLLECTIONS.DANGER_POINTS) || {};
      return Object.keys(dangerPoints).length;
    } catch (error) {
      console.error('获取危险点总数失败:', error);
      return 0;
    }
  }

  /**
   * 按类型获取危险点统计
   * @returns {Object} 各类型危险点数量
   */
  getDangerPointStatsByType() {
    try {
      const dangerPoints = wx.getStorageSync(COLLECTIONS.DANGER_POINTS) || {};
      const allPoints = Object.values(dangerPoints);

      const stats = {
        fall: 0,
        hard_brake: 0,
        manual: 0
      };

      allPoints.forEach(point => {
        if (stats.hasOwnProperty(point.danger_type)) {
          stats[point.danger_type]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('获取危险点统计失败:', error);
      return { fall: 0, hard_brake: 0, manual: 0 };
    }
  }
}

// 创建单例实例
let instance = null;

/**
 * 获取危险点仓储实例（单例）
 * @returns {DangerPointRepository}
 */
export function getDangerPointRepository() {
  if (!instance) {
    instance = new DangerPointRepository();
  }
  return instance;
}

export default DangerPointRepository;
