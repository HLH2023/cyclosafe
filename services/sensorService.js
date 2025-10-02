/**
 * 传感器服务
 * 封装加速度计、陀螺仪监听和摔倒检测功能
 */

/**
 * 移动平均滤波器
 * 用于平滑传感器数据，减少噪声
 */
class MovingAverageFilter {
  constructor(windowSize = 5) {
    this.bufferX = [];
    this.bufferY = [];
    this.bufferZ = [];
    this.windowSize = windowSize;
  }

  filter(x, y, z) {
    this.bufferX.push(x);
    this.bufferY.push(y);
    this.bufferZ.push(z);

    if (this.bufferX.length > this.windowSize) {
      this.bufferX.shift();
      this.bufferY.shift();
      this.bufferZ.shift();
    }

    return {
      x: this.average(this.bufferX),
      y: this.average(this.bufferY),
      z: this.average(this.bufferZ)
    };
  }

  average(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  reset() {
    this.bufferX = [];
    this.bufferY = [];
    this.bufferZ = [];
  }
}

/**
 * 摔倒检测器
 * 基于加速度计和陀螺仪数据进行摔倒检测
 */
class FallDetector {
  constructor(options = {}) {
    // 配置参数
    this.config = {
      // 灵敏度：'low'（低）、'medium'（中）、'high'（高）
      sensitivity: options.sensitivity || 'medium',
      // 是否启用
      enabled: options.enabled !== false,
      // 回调函数
      onFallDetected: options.onFallDetected || null,
    };

    // 传感器数据
    this.accelerometerData = { x: 0, y: 0, z: 0 };
    this.gyroscopeData = { x: 0, y: 0, z: 0 };

    // 数据滤波器
    this.accFilter = new MovingAverageFilter(5);
    this.gyroFilter = new MovingAverageFilter(5);

    // 历史数据（用于检测变化趋势）
    this.accHistory = [];
    this.maxHistoryLength = 10; // 保留最近10个数据点

    // 检测状态
    this.isDetecting = false;
    this.lastDetectionTime = 0;
    this.detectionCooldown = 5000; // 5秒冷却时间，避免重复检测

    // 根据灵敏度设置阈值
    this.updateThresholds();
  }

  /**
   * 更新阈值参数（根据灵敏度）
   */
  updateThresholds() {
    const thresholds = {
      low: {
        acceleration: 25,  // 25 m/s² (约2.5g)
        gyroscope: 250,    // 250°/s
        impactDuration: 300 // 冲击持续时间（ms）
      },
      medium: {
        acceleration: 18,  // 18 m/s² (约1.8g)
        gyroscope: 200,    // 200°/s
        impactDuration: 400
      },
      high: {
        acceleration: 15,  // 15 m/s² (约1.5g)
        gyroscope: 150,    // 150°/s
        impactDuration: 500
      }
    };

    this.thresholds = thresholds[this.config.sensitivity] || thresholds.medium;
  }

  /**
   * 设置灵敏度
   */
  setSensitivity(sensitivity) {
    this.config.sensitivity = sensitivity;
    this.updateThresholds();
    console.log('[FallDetector] 灵敏度已更新:', sensitivity);
  }

  /**
   * 启用/禁用检测
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    console.log('[FallDetector] 检测状态:', enabled ? '已启用' : '已禁用');
  }

  /**
   * 更新加速度计数据
   */
  updateAccelerometer(data) {
    // 滤波处理
    const filtered = this.accFilter.filter(data.x, data.y, data.z);
    this.accelerometerData = filtered;

    // 保存历史数据
    this.accHistory.push({
      ...filtered,
      timestamp: Date.now()
    });

    // 限制历史记录长度
    if (this.accHistory.length > this.maxHistoryLength) {
      this.accHistory.shift();
    }
  }

  /**
   * 更新陀螺仪数据
   */
  updateGyroscope(data) {
    // 滤波处理
    const filtered = this.gyroFilter.filter(data.x, data.y, data.z);
    this.gyroscopeData = filtered;
  }

  /**
   * 计算向量的模（总量）
   */
  calculateMagnitude(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z);
  }

  /**
   * 检测摔倒
   */
  detect() {
    // 如果未启用，直接返回
    if (!this.config.enabled) {
      return false;
    }

    // 冷却时间检查
    const now = Date.now();
    if (now - this.lastDetectionTime < this.detectionCooldown) {
      return false;
    }

    // 需要足够的历史数据
    if (this.accHistory.length < 3) {
      return false;
    }

    // 1. 计算总加速度
    const totalAcc = this.calculateMagnitude(
      this.accelerometerData.x,
      this.accelerometerData.y,
      this.accelerometerData.z
    );

    // 2. 计算总角速度
    const totalGyro = this.calculateMagnitude(
      this.gyroscopeData.x,
      this.gyroscopeData.y,
      this.gyroscopeData.z
    );

    // 3. 检查是否超过阈值
    const isHighAcceleration = totalAcc > this.thresholds.acceleration;
    const isHighRotation = totalGyro > this.thresholds.gyroscope;

    // 4. 检查加速度变化（冲击特征）
    const hasImpact = this.detectImpact();

    // 5. 综合判断：需要同时满足多个条件
    const isFalling = isHighAcceleration && isHighRotation && hasImpact;

    if (isFalling) {
      this.onFallDetected(totalAcc, totalGyro);
      return true;
    }

    return false;
  }

  /**
   * 检测冲击特征
   * 摔倒时加速度会有突然的峰值
   */
  detectImpact() {
    if (this.accHistory.length < 3) {
      return false;
    }

    // 计算最近几个数据点的加速度变化
    const recent = this.accHistory.slice(-3);
    const magnitudes = recent.map(data =>
      this.calculateMagnitude(data.x, data.y, data.z)
    );

    // 检查是否有明显的峰值
    const maxMag = Math.max(...magnitudes);
    const avgMag = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;

    // 峰值应该显著高于平均值
    return maxMag > avgMag * 1.5;
  }

  /**
   * 摔倒检测回调
   */
  onFallDetected(acceleration, gyroscope) {
    this.lastDetectionTime = Date.now();

    console.warn('[FallDetector] 检测到摔倒！');
    console.log(`  加速度: ${acceleration.toFixed(2)} m/s²`);
    console.log(`  角速度: ${gyroscope.toFixed(2)} °/s`);
    console.log(`  灵敏度: ${this.config.sensitivity}`);

    // 调用回调函数
    if (this.config.onFallDetected) {
      this.config.onFallDetected({
        acceleration,
        gyroscope,
        timestamp: Date.now(),
        sensitivity: this.config.sensitivity
      });
    }
  }

  /**
   * 重置检测器
   */
  reset() {
    this.accFilter.reset();
    this.gyroFilter.reset();
    this.accHistory = [];
    this.accelerometerData = { x: 0, y: 0, z: 0 };
    this.gyroscopeData = { x: 0, y: 0, z: 0 };
    this.lastDetectionTime = 0;
    console.log('[FallDetector] 已重置');
  }
}

/**
 * 传感器服务类
 * 管理传感器监听和摔倒检测
 */
class SensorService {
  constructor() {
    this.isRunning = false;
    this.fallDetector = null;
    this.listeners = {
      onFallDetected: null
    };
  }

  /**
   * 启动传感器监听
   */
  start(options = {}) {
    if (this.isRunning) {
      console.warn('[SensorService] 传感器服务已在运行');
      return;
    }

    console.log('[SensorService] 启动传感器服务...');

    // 创建摔倒检测器
    this.fallDetector = new FallDetector({
      sensitivity: options.sensitivity || 'medium',
      enabled: options.fallDetectionEnabled !== false,
      onFallDetected: (data) => {
        if (this.listeners.onFallDetected) {
          this.listeners.onFallDetected(data);
        }
      }
    });

    // 启动加速度计
    uni.startAccelerometer({
      interval: 'game', // 20ms/次，适合实时检测
      success: () => {
        console.log('[SensorService] 加速度计已启动');

        // 监听加速度变化
        uni.onAccelerometerChange((res) => {
          this.fallDetector.updateAccelerometer(res);
          this.fallDetector.detect();
        });
      },
      fail: (err) => {
        console.error('[SensorService] 加速度计启动失败:', err);
        uni.showToast({
          title: '加速度计启动失败',
          icon: 'none'
        });
      }
    });

    // 启动陀螺仪
    uni.startGyroscope({
      interval: 'game',
      success: () => {
        console.log('[SensorService] 陀螺仪已启动');

        // 监听陀螺仪变化
        uni.onGyroscopeChange((res) => {
          this.fallDetector.updateGyroscope(res);
          this.fallDetector.detect();
        });
      },
      fail: (err) => {
        console.error('[SensorService] 陀螺仪启动失败:', err);
        // 陀螺仪不是必需的，可以继续运行
        console.warn('[SensorService] 将仅使用加速度计进行检测');
      }
    });

    this.isRunning = true;
    console.log('[SensorService] 传感器服务已启动');
  }

  /**
   * 停止传感器监听
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('[SensorService] 停止传感器服务...');

    // 停止加速度计
    uni.stopAccelerometer({
      success: () => {
        console.log('[SensorService] 加速度计已停止');
      }
    });

    // 停止陀螺仪
    uni.stopGyroscope({
      success: () => {
        console.log('[SensorService] 陀螺仪已停止');
      }
    });

    // 重置检测器
    if (this.fallDetector) {
      this.fallDetector.reset();
    }

    this.isRunning = false;
    console.log('[SensorService] 传感器服务已停止');
  }

  /**
   * 设置摔倒检测回调
   */
  onFallDetected(callback) {
    this.listeners.onFallDetected = callback;
  }

  /**
   * 设置摔倒检测灵敏度
   */
  setSensitivity(sensitivity) {
    if (this.fallDetector) {
      this.fallDetector.setSensitivity(sensitivity);
    }
  }

  /**
   * 启用/禁用摔倒检测
   */
  setFallDetectionEnabled(enabled) {
    if (this.fallDetector) {
      this.fallDetector.setEnabled(enabled);
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      fallDetectionEnabled: this.fallDetector ? this.fallDetector.config.enabled : false,
      sensitivity: this.fallDetector ? this.fallDetector.config.sensitivity : 'medium'
    };
  }
}

// 导出单例
const sensorService = new SensorService();

export default sensorService;
export { MovingAverageFilter, FallDetector, SensorService };
