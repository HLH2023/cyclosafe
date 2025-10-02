/**
 * 骑行记录仓储类
 * 负责骑行记录和轨迹点的CRUD操作
 */

import { getDatabase } from '../database.js';

class RidingRecordRepository {
  constructor(db) {
    this.db = db || getDatabase();
  }

  /**
   * 保存骑行记录（包含轨迹点）
   * @param {Object} record 骑行记录对象
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveRecord(record) {
    try {
      const result = await this.db.transaction(async (txDb) => {
        const now = Date.now();

        // 插入骑行记录
        txDb.run(`
          INSERT INTO riding_records (
            id, start_time, end_time, duration, distance,
            avg_speed, max_speed, total_ascent, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          record.id,
          record.startTime,
          record.endTime,
          record.duration,
          record.distance,
          record.avgSpeed,
          record.maxSpeed,
          record.totalAscent || 0,
          now,
          now
        ]);

        // 批量插入轨迹点
        if (record.trackPoints && record.trackPoints.length > 0) {
          const stmt = `
            INSERT INTO track_points (
              record_id, latitude, longitude, altitude,
              speed, timestamp, sequence
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          record.trackPoints.forEach((point, index) => {
            txDb.run(stmt, [
              record.id,
              point.latitude,
              point.longitude,
              point.altitude || 0,
              point.speed || 0,
              point.timestamp,
              index
            ]);
          });
        }

        return true;
      });

      console.log('骑行记录保存成功:', record.id);
      return result;
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
      // 查询记录基本信息
      const record = this.db.executeOne(`
        SELECT * FROM riding_records WHERE id = ?
      `, [id]);

      if (!record) {
        return null;
      }

      // 查询轨迹点
      const trackPoints = this.db.execute(`
        SELECT latitude, longitude, altitude, speed, timestamp
        FROM track_points
        WHERE record_id = ?
        ORDER BY sequence ASC
      `, [id]);

      // 组装完整对象
      return {
        id: record.id,
        startTime: record.start_time,
        endTime: record.end_time,
        duration: record.duration,
        distance: record.distance,
        avgSpeed: record.avg_speed,
        maxSpeed: record.max_speed,
        totalAscent: record.total_ascent,
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
      const results = this.db.execute(`
        SELECT id FROM riding_records
        ORDER BY start_time DESC
      `);

      return results.map(row => row.id);
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

      let sql = `
        SELECT id, start_time, end_time, duration, distance,
               avg_speed, max_speed, total_ascent
        FROM riding_records
        WHERE 1=1
      `;

      const params = [];

      // 时间范围过滤
      if (startDate) {
        sql += ' AND start_time >= ?';
        params.push(startDate);
      }
      if (endDate) {
        sql += ' AND start_time <= ?';
        params.push(endDate);
      }

      // 排序
      sql += ' ORDER BY start_time DESC';

      // 分页
      if (limit) {
        sql += ' LIMIT ?';
        params.push(limit);
      }
      if (offset) {
        sql += ' OFFSET ?';
        params.push(offset);
      }

      const results = this.db.execute(sql, params);

      return results.map(row => ({
        id: row.id,
        startTime: row.start_time,
        endTime: row.end_time,
        duration: row.duration,
        distance: row.distance,
        avgSpeed: row.avg_speed,
        maxSpeed: row.max_speed,
        totalAscent: row.total_ascent
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
      const fields = [];
      const params = [];

      // 构建更新字段
      if (updates.distance !== undefined) {
        fields.push('distance = ?');
        params.push(updates.distance);
      }
      if (updates.avgSpeed !== undefined) {
        fields.push('avg_speed = ?');
        params.push(updates.avgSpeed);
      }
      if (updates.maxSpeed !== undefined) {
        fields.push('max_speed = ?');
        params.push(updates.maxSpeed);
      }
      if (updates.totalAscent !== undefined) {
        fields.push('total_ascent = ?');
        params.push(updates.totalAscent);
      }

      if (fields.length === 0) {
        return false;
      }

      // 添加更新时间
      fields.push('updated_at = ?');
      params.push(Date.now());

      // 添加ID参数
      params.push(id);

      const sql = `
        UPDATE riding_records
        SET ${fields.join(', ')}
        WHERE id = ?
      `;

      this.db.run(sql, params);
      this.db.saveDatabaseToFile();

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
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteRecord(id) {
    try {
      const result = await this.db.transaction(async (txDb) => {
        // 删除轨迹点
        txDb.run('DELETE FROM track_points WHERE record_id = ?', [id]);

        // 删除记录
        txDb.run('DELETE FROM riding_records WHERE id = ?', [id]);

        return true;
      });

      console.log('骑行记录删除成功:', id);
      return result;
    } catch (error) {
      console.error('删除骑行记录失败:', error);
      return false;
    }
  }

  /**
   * 清空所有骑行记录
   * @returns {Promise<boolean>} 是否清空成功
   */
  async clearAllRecords() {
    try {
      const result = await this.db.transaction(async (txDb) => {
        txDb.run('DELETE FROM track_points');
        txDb.run('DELETE FROM riding_records');
        return true;
      });

      console.log('所有骑行记录已清空');
      return result;
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
      const result = this.db.executeOne(`
        SELECT
          COUNT(*) as totalRides,
          SUM(distance) as totalDistance,
          SUM(duration) as totalDuration,
          MAX(max_speed) as maxSpeed,
          AVG(avg_speed) as avgSpeed
        FROM riding_records
      `);

      return {
        totalRides: result?.totalRides || 0,
        totalDistance: result?.totalDistance || 0,
        totalDuration: result?.totalDuration || 0,
        maxSpeed: result?.maxSpeed || 0,
        avgSpeed: result?.avgSpeed || 0
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
      const result = this.db.executeOne('SELECT COUNT(*) as count FROM riding_records');
      return result?.count || 0;
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
