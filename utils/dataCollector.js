/**
 * 数据采集器 - 用于收集传感器数据并上传到训练服务器
 * 支持：加速度计、陀螺仪数据采集
 * 功能：滑动窗口缓冲、数据上传、匿名用户ID管理
 */

import config, { debugLog, errorLog } from './config.js';
import { getSettingsRepository } from '@/db/repositories/index.js';

const API_BASE_URL = config.API_BASE_URL;
const API_KEY = config.API_KEY;
const SAMPLE_RATE = config.SAMPLE_RATE;
const BUFFER_SIZE = config.BUFFER_SIZE;

class DataCollector {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || SAMPLE_RATE;
    this.bufferSize = options.bufferSize || BUFFER_SIZE;

    // 数据缓冲区
    this.dataBuffer = [];

    // 采集状态
    this.isCollecting = false;
    this.startTime = null;

    // 传感器监听器ID
    this.accelerometerListener = null;
    this.gyroscopeListener = null;

    // 用户ID（匿名）
    this.userId = this._getOrCreateUserId();

    // 回调函数
    this.onDataUpdate = options.onDataUpdate || null;
    this.onBufferFull = options.onBufferFull || null;
  }

  /**
   * 获取或创建匿名用户ID
   */
  _getOrCreateUserId() {
    try {
      const settingsRepo = getSettingsRepository();
      let userId = settingsRepo.getSetting('anonymous_user_id');
      if (!userId) {
        // 生成UUID
        userId = this._generateUUID();
        settingsRepo.saveSetting('anonymous_user_id', userId);
      }
      return userId;
    } catch (e) {
      console.error('获取用户ID失败:', e);
      return this._generateUUID();
    }
  }

  /**
   * 生成简单的UUID
   */
  _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 开始采集数据
   */
  startCollection() {
    if (this.isCollecting) {
      console.warn('数据采集已经在进行中');
      return;
    }

    console.log('开始数据采集...');
    this.isCollecting = true;
    this.startTime = Date.now();
    this.dataBuffer = [];

    // 启动加速度计
    this._startAccelerometer();

    // 启动陀螺仪
    this._startGyroscope();
  }

  /**
   * 停止采集数据
   */
  stopCollection() {
    if (!this.isCollecting) {
      console.warn('数据采集未在进行中');
      return;
    }

    console.log('停止数据采集...');
    this.isCollecting = false;

    // 停止传感器监听
    if (this.accelerometerListener) {
      uni.offAccelerometerChange(this.accelerometerListener);
      this.accelerometerListener = null;
    }

    if (this.gyroscopeListener) {
      uni.offGyroscopeChange(this.gyroscopeListener);
      this.gyroscopeListener = null;
    }

    uni.stopAccelerometer();
    uni.stopGyroscope();
  }

  /**
   * 启动加速度计监听
   */
  _startAccelerometer() {
    uni.startAccelerometer({
      interval: 'game', // 20ms更新一次，约50Hz
      success: () => {
        console.log('加速度计启动成功');
      },
      fail: (err) => {
        console.error('加速度计启动失败:', err);
      }
    });

    // 保存监听器引用，方便后续移除
    this.accelerometerListener = (res) => {
      if (!this.isCollecting) return;

      const timestamp = Date.now();
      const elapsed = timestamp - this.startTime;

      // 查找同时间戳的陀螺仪数据（如果有）
      const existingIndex = this.dataBuffer.findIndex(
        item => Math.abs(item.timestamp - timestamp) < 10
      );

      if (existingIndex >= 0) {
        // 合并数据
        this.dataBuffer[existingIndex] = {
          ...this.dataBuffer[existingIndex],
          ax: res.x,
          ay: res.y,
          az: res.z
        };
      } else {
        // 添加新数据点
        this.dataBuffer.push({
          timestamp,
          elapsed,
          ax: res.x,
          ay: res.y,
          az: res.z,
          gx: 0,
          gy: 0,
          gz: 0
        });
      }

      this._checkBuffer();
    };

    uni.onAccelerometerChange(this.accelerometerListener);
  }

  /**
   * 启动陀螺仪监听
   */
  _startGyroscope() {
    uni.startGyroscope({
      interval: 'game', // 20ms更新一次，约50Hz
      success: () => {
        console.log('陀螺仪启动成功');
      },
      fail: (err) => {
        console.error('陀螺仪启动失败:', err);
      }
    });

    this.gyroscopeListener = (res) => {
      if (!this.isCollecting) return;

      const timestamp = Date.now();
      const elapsed = timestamp - this.startTime;

      // 查找同时间戳的加速度计数据（如果有）
      const existingIndex = this.dataBuffer.findIndex(
        item => Math.abs(item.timestamp - timestamp) < 10
      );

      if (existingIndex >= 0) {
        // 合并数据
        this.dataBuffer[existingIndex] = {
          ...this.dataBuffer[existingIndex],
          gx: res.x,
          gy: res.y,
          gz: res.z
        };
      } else {
        // 添加新数据点
        this.dataBuffer.push({
          timestamp,
          elapsed,
          ax: 0,
          ay: 0,
          az: 0,
          gx: res.x,
          gy: res.y,
          gz: res.z
        });
      }

      this._checkBuffer();
    };

    uni.onGyroscopeChange(this.gyroscopeListener);
  }

  /**
   * 检查缓冲区状态
   */
  _checkBuffer() {
    // 通知数据更新
    if (this.onDataUpdate) {
      this.onDataUpdate({
        count: this.dataBuffer.length,
        bufferSize: this.bufferSize,
        progress: Math.min(100, (this.dataBuffer.length / this.bufferSize) * 100)
      });
    }

    // 检查是否达到缓冲区大小
    if (this.dataBuffer.length >= this.bufferSize) {
      console.log('缓冲区已满，停止采集');
      this.stopCollection();

      if (this.onBufferFull) {
        this.onBufferFull(this.dataBuffer);
      }
    }
  }

  /**
   * 获取当前缓冲区数据
   */
  getBufferData() {
    return [...this.dataBuffer];
  }

  /**
   * 清空缓冲区
   */
  clearBuffer() {
    this.dataBuffer = [];
  }

  /**
   * 上传训练数据到服务器
   * @param {String} label - 数据标签 ('fall' 或 'normal')
   * @param {String} source - 数据来源 ('simulate' 或 'riding')
   * @param {Object} metadata - 额外的元数据
   */
  async uploadData(label, source = 'simulate', metadata = {}) {
    if (this.dataBuffer.length === 0) {
      throw new Error('没有数据可上传');
    }

    const duration = (this.dataBuffer[this.dataBuffer.length - 1]?.elapsed || 0);

    const uploadData = {
      user_id: this.userId,
      label: label,
      source: source,
      duration: duration,
      samples: this.dataBuffer.map(item => ({
        timestamp: item.timestamp,
        acc: {
          x: item.ax,
          y: item.ay,
          z: item.az
        },
        gyro: {
          x: item.gx,
          y: item.gy,
          z: item.gz
        }
      })),
      metadata: {
        sample_rate: this.sampleRate,
        duration_seconds: duration / 1000,
        data_points: this.dataBuffer.length,
        collected_at: new Date().toISOString(),
        ...metadata
      }
    };

    console.log('准备上传数据:', {
      label,
      dataPoints: this.dataBuffer.length,
      userId: this.userId
    });

    return new Promise((resolve, reject) => {
      uni.request({
        url: `${API_BASE_URL}/upload/training-data`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        data: uploadData,
        success: (res) => {
          if (res.statusCode === 200) {
            console.log('数据上传成功:', res.data);
            resolve(res.data);
          } else {
            console.error('数据上传失败:', res);
            reject(new Error(`上传失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          console.error('网络请求失败:', err);
          reject(err);
        }
      });
    });
  }

  /**
   * 获取数据统计信息
   */
  async getDataStats() {
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${API_BASE_URL}/data/stats`,
        method: 'GET',
        header: {
          'X-API-Key': API_KEY
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`获取统计失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
}

export default DataCollector;
