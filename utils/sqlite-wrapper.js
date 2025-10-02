/**
 * SQLite WebAssembly 包装器
 * 适配微信小程序环境
 */

import initSqlJs from 'sql.js';

class SQLiteWrapper {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.dbPath = null;
    this.isInitialized = false;
  }

  /**
   * 初始化 SQLite
   * @param {string} dbName 数据库文件名
   * @returns {Promise<boolean>}
   */
  async initialize(dbName = 'cyclosafe.db') {
    try {
      if (this.isInitialized) {
        return true;
      }

      // 初始化 sql.js
      this.SQL = await initSqlJs({
        // 微信小程序需要从本地加载 WASM 文件
        locateFile: file => {
          // 在实际使用时，需要将 sql-wasm.wasm 文件放到 static 目录
          return `/static/sqlite/${file}`;
        }
      });

      // 设置数据库文件路径（使用微信小程序的用户数据目录）
      this.dbPath = `${uni.env.USER_DATA_PATH}/${dbName}`;

      // 尝试从文件系统加载现有数据库
      const existingData = await this.loadDatabaseFromFile();

      if (existingData) {
        // 从现有数据创建数据库
        this.db = new this.SQL.Database(existingData);
        console.log('已加载现有数据库');
      } else {
        // 创建新数据库
        this.db = new this.SQL.Database();
        console.log('已创建新数据库');
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('初始化 SQLite 失败:', error);
      return false;
    }
  }

  /**
   * 从文件系统加载数据库
   * @returns {Promise<Uint8Array|null>}
   */
  async loadDatabaseFromFile() {
    return new Promise((resolve) => {
      try {
        const fs = uni.getFileSystemManager();

        fs.readFile({
          filePath: this.dbPath,
          success: (res) => {
            // 微信小程序返回 ArrayBuffer
            const buffer = res.data;
            const uint8Array = new Uint8Array(buffer);
            resolve(uint8Array);
          },
          fail: () => {
            // 文件不存在，返回 null
            resolve(null);
          }
        });
      } catch (error) {
        console.error('读取数据库文件失败:', error);
        resolve(null);
      }
    });
  }

  /**
   * 保存数据库到文件系统
   * @returns {Promise<boolean>}
   */
  async saveDatabaseToFile() {
    return new Promise((resolve) => {
      try {
        if (!this.db) {
          resolve(false);
          return;
        }

        // 导出数据库为 Uint8Array
        const data = this.db.export();

        const fs = uni.getFileSystemManager();

        // 将 Uint8Array 转换为 ArrayBuffer
        const buffer = data.buffer;

        fs.writeFile({
          filePath: this.dbPath,
          data: buffer,
          success: () => {
            console.log('数据库已保存到文件系统');
            resolve(true);
          },
          fail: (error) => {
            console.error('保存数据库失败:', error);
            resolve(false);
          }
        });
      } catch (error) {
        console.error('保存数据库异常:', error);
        resolve(false);
      }
    });
  }

  /**
   * 执行 SQL 查询
   * @param {string} sql SQL 语句
   * @param {Array} params 参数
   * @returns {Array} 查询结果
   */
  execute(sql, params = []) {
    try {
      if (!this.db) {
        throw new Error('数据库未初始化');
      }

      const stmt = this.db.prepare(sql);
      stmt.bind(params);

      const results = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push(row);
      }

      stmt.free();
      return results;
    } catch (error) {
      console.error('执行 SQL 失败:', error);
      throw error;
    }
  }

  /**
   * 执行 SQL 语句（不返回结果，用于 INSERT/UPDATE/DELETE）
   * @param {string} sql SQL 语句
   * @param {Array} params 参数
   * @returns {boolean} 是否成功
   */
  run(sql, params = []) {
    try {
      if (!this.db) {
        throw new Error('数据库未初始化');
      }

      this.db.run(sql, params);
      return true;
    } catch (error) {
      console.error('执行 SQL 失败:', error);
      throw error;
    }
  }

  /**
   * 执行单条查询（返回第一行）
   * @param {string} sql SQL 语句
   * @param {Array} params 参数
   * @returns {Object|null} 查询结果
   */
  executeOne(sql, params = []) {
    const results = this.execute(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 开始事务
   */
  beginTransaction() {
    this.run('BEGIN TRANSACTION');
  }

  /**
   * 提交事务
   */
  commit() {
    this.run('COMMIT');
  }

  /**
   * 回滚事务
   */
  rollback() {
    this.run('ROLLBACK');
  }

  /**
   * 执行事务
   * @param {Function} callback 事务回调函数
   * @returns {Promise<any>}
   */
  async transaction(callback) {
    try {
      this.beginTransaction();
      const result = await callback(this);
      this.commit();

      // 事务成功后保存到文件
      await this.saveDatabaseToFile();

      return result;
    } catch (error) {
      this.rollback();
      console.error('事务执行失败:', error);
      throw error;
    }
  }

  /**
   * 获取最后插入的行 ID
   * @returns {number}
   */
  getLastInsertId() {
    const result = this.executeOne('SELECT last_insert_rowid() as id');
    return result ? result.id : null;
  }

  /**
   * 关闭数据库
   */
  async close() {
    if (this.db) {
      // 保存数据库
      await this.saveDatabaseToFile();

      // 关闭数据库
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * 导出数据库（用于备份）
   * @returns {Uint8Array}
   */
  exportDatabase() {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
    return this.db.export();
  }

  /**
   * 导入数据库（用于恢复）
   * @param {Uint8Array} data 数据库数据
   */
  importDatabase(data) {
    if (this.db) {
      this.db.close();
    }
    this.db = new this.SQL.Database(data);
  }
}

// 创建单例实例
let instance = null;

/**
 * 获取 SQLite 实例（单例模式）
 * @returns {SQLiteWrapper}
 */
export function getSQLiteInstance() {
  if (!instance) {
    instance = new SQLiteWrapper();
  }
  return instance;
}

/**
 * 初始化数据库
 * @param {string} dbName 数据库名称
 * @returns {Promise<SQLiteWrapper>}
 */
export async function initDatabase(dbName = 'cyclosafe.db') {
  const db = getSQLiteInstance();
  await db.initialize(dbName);
  return db;
}

export default {
  getSQLiteInstance,
  initDatabase
};
