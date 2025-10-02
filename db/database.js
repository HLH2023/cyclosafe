/**
 * 数据库初始化和管理
 */

import { getSQLiteInstance, initDatabase } from '@/utils/sqlite-wrapper.js';

// 数据库版本
const DATABASE_VERSION = 1;

/**
 * 创建数据库表结构
 * @param {SQLiteWrapper} db 数据库实例
 */
function createTables(db) {
  // 1. 骑行记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS riding_records (
      id TEXT PRIMARY KEY,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      distance REAL NOT NULL,
      avg_speed REAL NOT NULL,
      max_speed REAL NOT NULL,
      total_ascent REAL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // 2. 轨迹点表
  db.run(`
    CREATE TABLE IF NOT EXISTS track_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      altitude REAL DEFAULT 0,
      speed REAL DEFAULT 0,
      timestamp INTEGER NOT NULL,
      sequence INTEGER NOT NULL,
      FOREIGN KEY (record_id) REFERENCES riding_records(id) ON DELETE CASCADE
    )
  `);

  // 3. 设置表（键值对存储）
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // 4. 数据采集记录表（可选，用于ML训练数据）
  db.run(`
    CREATE TABLE IF NOT EXISTS data_collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT,
      data_type TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (record_id) REFERENCES riding_records(id) ON DELETE SET NULL
    )
  `);

  console.log('数据库表创建成功');
}

/**
 * 创建索引
 * @param {SQLiteWrapper} db 数据库实例
 */
function createIndexes(db) {
  // 骑行记录时间索引（用于按时间查询）
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_riding_records_start_time
    ON riding_records(start_time DESC)
  `);

  // 轨迹点记录ID索引
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_track_points_record_id
    ON track_points(record_id, sequence)
  `);

  // 数据采集记录ID索引
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_data_collections_record_id
    ON data_collections(record_id)
  `);

  console.log('数据库索引创建成功');
}

/**
 * 初始化数据库schema
 * @param {SQLiteWrapper} db 数据库实例
 */
async function initializeSchema(db) {
  try {
    // 开启事务
    await db.transaction(async (txDb) => {
      // 创建表
      createTables(txDb);

      // 创建索引
      createIndexes(txDb);

      // 保存数据库版本
      txDb.run(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES ('db_version', ?, ?)
      `, [DATABASE_VERSION, Date.now()]);
    });

    console.log('数据库schema初始化成功，版本:', DATABASE_VERSION);
    return true;
  } catch (error) {
    console.error('数据库schema初始化失败:', error);
    return false;
  }
}

/**
 * 检查并升级数据库
 * @param {SQLiteWrapper} db 数据库实例
 */
async function checkAndUpgradeDatabase(db) {
  try {
    // 获取当前数据库版本
    const versionRow = db.executeOne(`
      SELECT value FROM settings WHERE key = 'db_version'
    `);

    const currentVersion = versionRow ? parseInt(versionRow.value) : 0;

    if (currentVersion < DATABASE_VERSION) {
      console.log(`数据库需要升级: ${currentVersion} -> ${DATABASE_VERSION}`);

      // 这里可以添加数据库升级逻辑
      // 例如：ALTER TABLE 添加新列等
      await migrateDatabase(db, currentVersion, DATABASE_VERSION);

      // 更新版本号
      db.run(`
        UPDATE settings SET value = ?, updated_at = ? WHERE key = 'db_version'
      `, [DATABASE_VERSION, Date.now()]);

      console.log('数据库升级完成');
    } else {
      console.log('数据库版本已是最新:', currentVersion);
    }

    return true;
  } catch (error) {
    console.error('数据库版本检查失败:', error);
    return false;
  }
}

/**
 * 数据库迁移逻辑
 * @param {SQLiteWrapper} db 数据库实例
 * @param {number} fromVersion 源版本
 * @param {number} toVersion 目标版本
 */
async function migrateDatabase(db, fromVersion, toVersion) {
  console.log(`开始迁移数据库: v${fromVersion} -> v${toVersion}`);

  // 根据不同版本执行不同的迁移逻辑
  if (fromVersion < 1 && toVersion >= 1) {
    // 版本1的迁移逻辑（如果需要）
    console.log('执行版本1迁移...');
  }

  // 未来版本的迁移可以在这里添加
  // if (fromVersion < 2 && toVersion >= 2) {
  //   // 版本2的迁移逻辑
  // }
}

/**
 * 初始化数据库系统
 * @returns {Promise<SQLiteWrapper>}
 */
export async function setupDatabase() {
  try {
    // 初始化 SQLite
    const db = await initDatabase('cyclosafe.db');

    // 初始化表结构
    await initializeSchema(db);

    // 检查并升级数据库
    await checkAndUpgradeDatabase(db);

    return db;
  } catch (error) {
    console.error('数据库设置失败:', error);
    throw error;
  }
}

/**
 * 获取数据库实例
 * @returns {SQLiteWrapper}
 */
export function getDatabase() {
  return getSQLiteInstance();
}

/**
 * 清空所有数据（用于测试或重置）
 * @param {SQLiteWrapper} db 数据库实例
 */
export async function clearAllData(db) {
  if (!db) {
    db = getDatabase();
  }

  try {
    await db.transaction(async (txDb) => {
      txDb.run('DELETE FROM track_points');
      txDb.run('DELETE FROM data_collections');
      txDb.run('DELETE FROM riding_records');
      // 保留 settings 表的数据
    });

    console.log('所有数据已清空');
    return true;
  } catch (error) {
    console.error('清空数据失败:', error);
    return false;
  }
}

/**
 * 导出数据库统计信息
 * @param {SQLiteWrapper} db 数据库实例
 * @returns {Object} 统计信息
 */
export function getDatabaseStats(db) {
  if (!db) {
    db = getDatabase();
  }

  try {
    const recordCount = db.executeOne('SELECT COUNT(*) as count FROM riding_records');
    const trackPointCount = db.executeOne('SELECT COUNT(*) as count FROM track_points');
    const settingsCount = db.executeOne('SELECT COUNT(*) as count FROM settings');

    return {
      totalRecords: recordCount?.count || 0,
      totalTrackPoints: trackPointCount?.count || 0,
      totalSettings: settingsCount?.count || 0
    };
  } catch (error) {
    console.error('获取数据库统计失败:', error);
    return null;
  }
}

export default {
  setupDatabase,
  getDatabase,
  clearAllData,
  getDatabaseStats
};
