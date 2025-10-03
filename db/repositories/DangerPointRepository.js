/**
 * 危险点仓储类
 * 负责危险点的CRUD操作
 */

import { getDatabase } from '../database.js';
import { generateUUID } from '@/utils/uuid.js';

class DangerPointRepository {
  constructor(db) {
    this.db = db || getDatabase();
  }

  /**
   * 保存危险点
   * @param {Object} dangerPoint 危险点对象
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveDangerPoint(dangerPoint) {
    try {
      const result = await this.db.transaction(async (txDb) => {
        const now = Date.now();
        const id = dangerPoint.id || generateUUID();

        txDb.run(`
          INSERT INTO danger_points (
            id, name, latitude, longitude, danger_type,
            speed, record_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          dangerPoint.name,
          dangerPoint.latitude,
          dangerPoint.longitude,
          dangerPoint.danger_type,
          dangerPoint.speed || 0,
          dangerPoint.record_id || null,
          now,
          now
        ]);

        return id;
      });

      console.log('危险点保存成功:', result);
      return result;
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
      const results = this.db.execute(`
        SELECT * FROM danger_points
        ORDER BY created_at DESC
      `);

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
      const row = this.db.executeOne(`
        SELECT * FROM danger_points WHERE id = ?
      `, [id]);

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
      this.db.run(`
        UPDATE danger_points
        SET name = ?, updated_at = ?
        WHERE id = ?
      `, [name, Date.now(), id]);

      this.db.saveDatabaseToFile();
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
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteDangerPoint(id) {
    try {
      const result = await this.db.transaction(async (txDb) => {
        txDb.run('DELETE FROM danger_points WHERE id = ?', [id]);
        return true;
      });

      console.log('危险点删除成功:', id);
      return result;
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
      // 简化版：使用矩形范围查询（实际应用中应使用Haversine距离计算）
      // 1度纬度约等于111公里
      const latDelta = radius / 111;
      const lngDelta = radius / (111 * Math.cos(latitude * Math.PI / 180));

      const minLat = latitude - latDelta;
      const maxLat = latitude + latDelta;
      const minLng = longitude - lngDelta;
      const maxLng = longitude + lngDelta;

      const results = this.db.execute(`
        SELECT * FROM danger_points
        WHERE latitude BETWEEN ? AND ?
          AND longitude BETWEEN ? AND ?
        ORDER BY created_at DESC
      `, [minLat, maxLat, minLng, maxLng]);

      // 精确计算距离并过滤
      const points = results.map(row => {
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
   * @returns {Promise<boolean>} 是否清空成功
   */
  async clearAllDangerPoints() {
    try {
      const result = await this.db.transaction(async (txDb) => {
        txDb.run('DELETE FROM danger_points');
        return true;
      });

      console.log('所有危险点已清空');
      return result;
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
      const result = this.db.executeOne('SELECT COUNT(*) as count FROM danger_points');
      return result?.count || 0;
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
      const results = this.db.execute(`
        SELECT danger_type, COUNT(*) as count
        FROM danger_points
        GROUP BY danger_type
      `);

      const stats = {
        fall: 0,
        hard_brake: 0,
        manual: 0
      };

      results.forEach(row => {
        stats[row.danger_type] = row.count;
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
