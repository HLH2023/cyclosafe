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
 * 基于加速度计、陀螺仪和速度数据进行摔倒和急刹车检测
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
      onHardBrakeDetected: options.onHardBrakeDetected || null,
    };

    // 传感器数据
    this.accelerometerData = { x: 0, y: 0, z: 0 };
    this.gyroscopeData = { x: 0, y: 0, z: 0 };

    // 数据滤波器
    this.accFilter = new MovingAverageFilter(5);
    this.gyroFilter = new MovingAverageFilter(5);

    // 历史数据（用于检测变化趋势）
    this.accHistory = [];
    this.speedHistory = []; // 速度历史（km/h）
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
        // 摔倒检测阈值
        acceleration: 25,  // 25 m/s² (约2.5g)
        gyroscope: 250,    // 250°/s
        impactDuration: 300, // 冲击持续时间（ms）
        speedDrop: 5,      // 速度降低阈值（km/h）

        // 急刹车检测阈值
        brakeAcceleration: 15,  // 急刹车加速度阈值
        brakeGyroscope: 100,    // 急刹车角速度上限（低于此值才是刹车）
        brakeSpeedDrop: 10,     // 急刹车速度降低阈值（km/h）
        brakeDeceleration: -2.0, // 减速度阈值（m/s²）
        minSpeedForBrake: 10    // 最低速度阈值（km/h）
      },
      medium: {
        // 摔倒检测阈值
        acceleration: 18,  // 18 m/s² (约1.8g)
        gyroscope: 200,    // 200°/s
        impactDuration: 400,
        speedDrop: 5,

        // 急刹车检测阈值
        brakeAcceleration: 12,
        brakeGyroscope: 100,
        brakeSpeedDrop: 8,
        brakeDeceleration: -1.5,
        minSpeedForBrake: 10
      },
      high: {
        // 摔倒检测阈值
        acceleration: 15,  // 15 m/s² (约1.5g)
        gyroscope: 150,    // 150°/s
        impactDuration: 500,
        speedDrop: 4,

        // 急刹车检测阈值
        brakeAcceleration: 10,
        brakeGyroscope: 100,
        brakeSpeedDrop: 6,
        brakeDeceleration: -1.2,
        minSpeedForBrake: 8
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
   * 更新速度数据（从GPS获取）
   * @param {number} speed 速度（km/h）
   */
  updateSpeed(speed) {
    this.speedHistory.push({
      speed: speed,
      timestamp: Date.now()
    });

    // 限制历史记录长度
    if (this.speedHistory.length > this.maxHistoryLength) {
      this.speedHistory.shift();
    }
  }

  /**
   * 计算速度变化
   * @param {number} timeWindow 时间窗口（ms），默认1000ms
   * @returns {Object} { speedDrop: 速度降低量(km/h), deceleration: 减速度(m/s²) }
   */
  calculateSpeedChange(timeWindow = 1000) {
    if (this.speedHistory.length < 2) {
      return { speedDrop: 0, deceleration: 0 };
    }

    const now = Date.now();
    const recentSpeeds = this.speedHistory.filter(
      item => now - item.timestamp <= timeWindow
    );

    if (recentSpeeds.length < 2) {
      return { speedDrop: 0, deceleration: 0 };
    }

    // 计算速度降低量（初始速度 - 当前速度）
    const initialSpeed = recentSpeeds[0].speed;
    const currentSpeed = recentSpeeds[recentSpeeds.length - 1].speed;
    const speedDrop = initialSpeed - currentSpeed;

    // 计算减速度（m/s²）
    const timeDiff = (recentSpeeds[recentSpeeds.length - 1].timestamp - recentSpeeds[0].timestamp) / 1000; // 秒
    const speedDiff = speedDrop / 3.6; // km/h 转 m/s
    const deceleration = timeDiff > 0 ? speedDiff / timeDiff : 0;

    return {
      speedDrop: speedDrop,        // km/h
      deceleration: deceleration   // m/s²
    };
  }

  /**
   * 计算向量的模（总量）
   */
  calculateMagnitude(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z);
  }

  /**
   * 主检测方法 - 检测摔倒和急刹车
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

    // 3. 计算速度变化（仅当有速度数据时）
    let speedChange = { speedDrop: 0, deceleration: 0 };
    if (this.speedHistory.length >= 2) {
      speedChange = this.calculateSpeedChange(500); // 0.5秒窗口
    }

    // 4. 检查加速度变化（冲击特征）
    const hasImpact = this.detectImpact();

    // 5. 检查是否有速度降低（所有危险点的必要条件）
    const hasSpeedDrop = speedChange.speedDrop > this.thresholds.speedDrop;

    // 6. 摔倒检测（优先级高）
    const isHighAcceleration = totalAcc > this.thresholds.acceleration;
    const isHighRotation = totalGyro > this.thresholds.gyroscope;
    const isFalling = isHighAcceleration && isHighRotation && hasImpact && hasSpeedDrop;

    if (isFalling) {
      this.onFallDetected(totalAcc, totalGyro, speedChange);
      return true;
    }

    // 7. 急刹车检测（当不是摔倒时）
    const isHardBraking = this.detectHardBrake();

    if (isHardBraking) {
      this.onHardBrakeDetected(totalAcc, totalGyro, speedChange);
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
   * 检测急刹车
   * 基于加速度变化、速度降低和低角速度
   */
  detectHardBrake() {
    if (this.speedHistory.length < 2) {
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

    // 3. 计算速度变化
    const speedChange = this.calculateSpeedChange(1000); // 1秒窗口

    // 4. 获取当前速度
    const currentSpeed = this.speedHistory[this.speedHistory.length - 1].speed;

    // 5. 急刹车判断条件
    const hasAcceleration = totalAcc > this.thresholds.brakeAcceleration;
    const lowRotation = totalGyro < this.thresholds.brakeGyroscope; // 角速度低
    const hasSpeedDrop = speedChange.speedDrop > this.thresholds.brakeSpeedDrop; // 速度降低明显
    const hasDeceleration = speedChange.deceleration < this.thresholds.brakeDeceleration; // 负加速度
    const isMoving = currentSpeed > this.thresholds.minSpeedForBrake; // 有一定速度

    // 综合判断
    const isHardBrake = hasAcceleration && lowRotation && hasSpeedDrop && hasDeceleration && isMoving;

    if (isHardBrake) {
      console.log('[FallDetector] 急刹车检测数据:', {
        totalAcc: totalAcc.toFixed(2),
        totalGyro: totalGyro.toFixed(2),
        speedDrop: speedChange.speedDrop.toFixed(2),
        deceleration: speedChange.deceleration.toFixed(2),
        currentSpeed: currentSpeed.toFixed(2)
      });
    }

    return isHardBrake;
  }

  /**
   * 摔倒检测回调
   */
  onFallDetected(acceleration, gyroscope, speedChange) {
    this.lastDetectionTime = Date.now();

    console.warn('[FallDetector] 检测到摔倒！');
    console.log(`  加速度: ${acceleration.toFixed(2)} m/s²`);
    console.log(`  角速度: ${gyroscope.toFixed(2)} °/s`);
    console.log(`  速度降低: ${speedChange.speedDrop.toFixed(2)} km/h`);
    console.log(`  减速度: ${speedChange.deceleration.toFixed(2)} m/s²`);
    console.log(`  灵敏度: ${this.config.sensitivity}`);

    // 调用回调函数
    if (this.config.onFallDetected) {
      this.config.onFallDetected({
        type: 'fall',
        acceleration,
        gyroscope,
        speedDrop: speedChange.speedDrop,
        deceleration: speedChange.deceleration,
        timestamp: Date.now(),
        sensitivity: this.config.sensitivity
      });
    }
  }

  /**
   * 急刹车检测回调
   */
  onHardBrakeDetected(acceleration, gyroscope, speedChange) {
    this.lastDetectionTime = Date.now();

    console.warn('[FallDetector] 检测到急刹车！');
    console.log(`  加速度: ${acceleration.toFixed(2)} m/s²`);
    console.log(`  角速度: ${gyroscope.toFixed(2)} °/s`);
    console.log(`  速度降低: ${speedChange.speedDrop.toFixed(2)} km/h`);
    console.log(`  减速度: ${speedChange.deceleration.toFixed(2)} m/s²`);
    console.log(`  灵敏度: ${this.config.sensitivity}`);

    // 调用回调函数
    if (this.config.onHardBrakeDetected) {
      this.config.onHardBrakeDetected({
        type: 'hard_brake',
        acceleration,
        gyroscope,
        speedDrop: speedChange.speedDrop,
        deceleration: speedChange.deceleration,
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
    this.speedHistory = [];
    this.accelerometerData = { x: 0, y: 0, z: 0 };
    this.gyroscopeData = { x: 0, y: 0, z: 0 };
    this.lastDetectionTime = 0;
    console.log('[FallDetector] 已重置');
  }
}

/**
 * 传感器服务类
 * 管理传感器监听和摔倒/急刹车检测
 */
class SensorService {
  constructor() {
    this.isRunning = false;
    this.fallDetector = null;
    this.listeners = {
      onFallDetected: null,
      onHardBrakeDetected: null
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

    // 检查是否在模拟器环境
    const systemInfo = uni.getSystemInfoSync();
    if (systemInfo.platform === 'devtools') {
      console.warn('[SensorService] ⚠️ 检测到模拟器环境，传感器功能可能不可用');
      console.warn('[SensorService] ⚠️ 请在真机上测试传感器功能');

      // 在模拟器中显示提示
      uni.showModal({
        title: '传感器功能提示',
        content: '检测到您正在模拟器中运行。传感器功能（摔倒检测、急刹车检测）需要在真机上才能正常使用。',
        showCancel: false,
        confirmText: '我知道了'
      });
    }

    // 创建摔倒检测器
    this.fallDetector = new FallDetector({
      sensitivity: options.sensitivity || 'medium',
      enabled: options.fallDetectionEnabled !== false,
      onFallDetected: (data) => {
        if (this.listeners.onFallDetected) {
          this.listeners.onFallDetected(data);
        }
      },
      onHardBrakeDetected: (data) => {
        if (this.listeners.onHardBrakeDetected) {
          this.listeners.onHardBrakeDetected(data);
        }
      }
    });

    // 启动加速度计
    uni.startAccelerometer({
      interval: 'game', // 20ms/次，适合实时检测
      success: () => {
        console.log('[SensorService] ✅ 加速度计已启动');

        // 监听加速度变化
        uni.onAccelerometerChange((res) => {
          this.fallDetector.updateAccelerometer(res);
          this.fallDetector.detect();
        });
      },
      fail: (err) => {
        console.error('[SensorService] ❌ 加速度计启动失败:', err);

        // 判断是否为模拟器
        if (systemInfo.platform === 'devtools') {
          console.warn('[SensorService] 原因：模拟器不支持传感器，请在真机上测试');
        } else {
          console.error('[SensorService] 原因：', err.errMsg || '未知错误');
          uni.showToast({
            title: '加速度计启动失败',
            icon: 'none',
            duration: 3000
          });
        }
      }
    });

    // 启动陀螺仪
    uni.startGyroscope({
      interval: 'game',
      success: () => {
        console.log('[SensorService] ✅ 陀螺仪已启动');

        // 监听陀螺仪变化
        uni.onGyroscopeChange((res) => {
          this.fallDetector.updateGyroscope(res);
          this.fallDetector.detect();
        });
      },
      fail: (err) => {
        console.error('[SensorService] ❌ 陀螺仪启动失败:', err);

        // 陀螺仪不是必需的，可以继续运行
        if (systemInfo.platform === 'devtools') {
          console.warn('[SensorService] 原因：模拟器不支持传感器，请在真机上测试');
        } else {
          console.warn('[SensorService] 将仅使用加速度计进行检测');
        }
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
   * 设置急刹车检测回调
   */
  onHardBrakeDetected(callback) {
    this.listeners.onHardBrakeDetected = callback;
  }

  /**
   * 更新速度数据（从GPS获取）
   * @param {number} speed 速度（km/h）
   */
  updateSpeed(speed) {
    if (this.fallDetector) {
      this.fallDetector.updateSpeed(speed);
    }
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
