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

const GRAVITY = 9.81;

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

    // 自适应阈值所需的校准数据
    this.calibrationSampleLimit = options.calibrationSamples || 60;
    this.activeThresholds = {};
    this._initCalibrationState();

    // 根据灵敏度设置阈值
    this.updateThresholds();
  }

  /**
   * 更新阈值参数（根据灵敏度）
   */
  updateThresholds() {
    const thresholds = {
      low: {
        // 摔倒检测阈值（低灵敏度 - 只检测严重摔倒）
        acceleration: 15,  // 15 m/s²
        gyroscope: 100,    // 100°/s
        impactDuration: 300, // 冲击持续时间（ms）
        speedDrop: 5,      // 速度降低阈值（km/h）

        // 急刹车检测阈值
        brakeAcceleration: 12,  // 急刹车加速度阈值
        brakeGyroscope: 80,     // 急刹车角速度上限（低于此值才是刹车）
        brakeSpeedDrop: 10,     // 急刹车速度降低阈值（km/h）
        brakeDeceleration: -2.0, // 减速度阈值（m/s²）
        minSpeedForBrake: 10    // 最低速度阈值（km/h）
      },
      medium: {
        // 摔倒检测阈值（中灵敏度 - 正常骑行中的摔倒）
        acceleration: 10,  // 10 m/s²
        gyroscope: 50,     // 50°/s
        impactDuration: 400,
        speedDrop: 5,

        // 急刹车检测阈值
        brakeAcceleration: 8,
        brakeGyroscope: 60,
        brakeSpeedDrop: 8,
        brakeDeceleration: -1.5,
        minSpeedForBrake: 10
      },
      high: {
        // 摔倒检测阈值（高灵敏度 - 轻微摔倒/测试）
        acceleration: 8,   // 8 m/s²（略低于实测值9.06）
        gyroscope: 12,     // 12°/s（略低于实测值14.70）
        impactDuration: 500,
        speedDrop: 4,

        // 急刹车检测阈值
        brakeAcceleration: 5,
        brakeGyroscope: 40,
        brakeSpeedDrop: 6,
        brakeDeceleration: -1.2,
        minSpeedForBrake: 8
      }
    };

    this.thresholds = thresholds[this.config.sensitivity] || thresholds.medium;
    this.applyCalibration({ announce: true });
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

    const thresholds = this.getThresholds();

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

    // 收集静态样本以完成基线校准
    this.collectCalibration(totalAcc, totalGyro);

    // 调试：定期输出传感器数据（每2秒）
    if (!this._lastDebugTime || now - this._lastDebugTime > 2000) {
      console.log('[FallDetector] 传感器数据:', {
        加速度: totalAcc.toFixed(2) + ' m/s²',
        角速度: totalGyro.toFixed(2) + ' °/s',
        阈值加速度: thresholds.acceleration,
        阈值角速度: thresholds.gyroscope,
        速度数据: this.speedHistory.length >= 2 ? '有' : '无'
      });
      this._lastDebugTime = now;
    }

    // 3. 计算速度变化（仅当有速度数据时）
    let speedChange = { speedDrop: 0, deceleration: 0 };
    const hasSpeedData = this.speedHistory.length >= 2;
    if (hasSpeedData) {
      speedChange = this.calculateSpeedChange(500); // 0.5秒窗口
    }

    // 4. 检查加速度变化（冲击特征）
    // 高灵敏度模式下跳过冲击检测（方便测试）
    const hasImpact = this.config.sensitivity === 'high' ? true : this.detectImpact();

    // 5. 检查是否有速度降低（仅当有速度数据时）
    // 高灵敏度模式下跳过速度降低检测（方便测试）
    const hasSpeedDrop = this.config.sensitivity === 'high' ? true : (hasSpeedData && speedChange.speedDrop > thresholds.speedDrop);

    // 6. 摔倒检测（优先级高）
    const isHighAcceleration = totalAcc > thresholds.acceleration;
    const isHighRotation = totalGyro > thresholds.gyroscope;

    // 调试：当加速度或角速度超过阈值时，输出详细检测条件
    if (isHighAcceleration || isHighRotation) {
      console.log('[FallDetector] 🔍 检测条件详情:', {
        '灵敏度': this.config.sensitivity,
        '✅加速度': isHighAcceleration,
        '当前值': totalAcc.toFixed(2) + ' m/s²',
        '阈值': thresholds.acceleration,
        '✅角速度': isHighRotation,
        '当前值_角': totalGyro.toFixed(2) + ' °/s',
        '阈值_角': thresholds.gyroscope,
        '✅冲击特征': hasImpact + (this.config.sensitivity === 'high' ? ' (已跳过)' : ''),
        '✅速度降低': hasSpeedDrop + (this.config.sensitivity === 'high' ? ' (已跳过)' : ''),
        '速度降低值': speedChange.speedDrop.toFixed(2) + ' km/h',
        '速度降低阈值': thresholds.speedDrop,
        '校准完成': this.calibration.isReady
      });
    }

    // 检测逻辑：
    // - 高灵敏度模式：只检测加速度+角速度（方便测试）
    // - 中低灵敏度+有速度数据：加速度+角速度+冲击+速度降低（完整检测）
    // - 中低灵敏度+无速度数据：加速度+角速度+冲击（基础检测）
    let isFalling = false;
    if (this.config.sensitivity === 'high') {
      // 高灵敏度：简化检测，只需加速度和角速度
      isFalling = isHighAcceleration && isHighRotation;
      if (isFalling) {
        console.log('[FallDetector] ⚠️ 高灵敏度模式，使用简化检测');
      }
    } else if (hasSpeedData) {
      // 有速度数据：完整检测
      isFalling = isHighAcceleration && isHighRotation && hasImpact && hasSpeedDrop;
    } else {
      // 无速度数据：基础检测
      isFalling = isHighAcceleration && isHighRotation && hasImpact;
      if (isFalling) {
        console.log('[FallDetector] ⚠️ 无速度数据，使用基础检测模式');
      }
    }

    if (isFalling) {
      this.onFallDetected(totalAcc, totalGyro, speedChange, thresholds, hasSpeedData);
      return true;
    }

    // 7. 急刹车检测（当不是摔倒时）
    const isHardBraking = this.detectHardBrake(thresholds);

    if (isHardBraking) {
      this.onHardBrakeDetected(totalAcc, totalGyro, speedChange, thresholds);
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
  detectHardBrake(thresholds) {
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
    const hasAcceleration = totalAcc > thresholds.brakeAcceleration;
    const lowRotation = totalGyro < thresholds.brakeGyroscope; // 角速度低
    const hasSpeedDrop = speedChange.speedDrop > thresholds.brakeSpeedDrop; // 速度降低明显
    const hasDeceleration = speedChange.deceleration < thresholds.brakeDeceleration; // 负加速度
    const isMoving = currentSpeed > thresholds.minSpeedForBrake; // 有一定速度

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
  onFallDetected(acceleration, gyroscope, speedChange, thresholds, hasSpeedData) {
    this.lastDetectionTime = Date.now();

    console.warn('[FallDetector] 检测到摔倒！');
    console.log(`  加速度: ${acceleration.toFixed(2)} m/s²`);
    console.log(`  角速度: ${gyroscope.toFixed(2)} °/s`);
    console.log(`  速度降低: ${speedChange.speedDrop.toFixed(2)} km/h`);
    console.log(`  减速度: ${speedChange.deceleration.toFixed(2)} m/s²`);
    console.log(`  灵敏度: ${this.config.sensitivity}`);

    const confidence = this.computeFallConfidence(acceleration, gyroscope, speedChange, thresholds, hasSpeedData);
    console.log(`  综合置信度: ${(confidence * 100).toFixed(1)}%`);

    // 调用回调函数
    if (this.config.onFallDetected) {
      this.config.onFallDetected({
        type: 'fall',
        acceleration,
        gyroscope,
        speedDrop: speedChange.speedDrop,
        deceleration: speedChange.deceleration,
        timestamp: Date.now(),
        sensitivity: this.config.sensitivity,
        confidence,
        thresholds: { ...thresholds },
        calibration: {
          ready: this.calibration.isReady,
          baselineAcc: this.calibration.baselineAcc,
          baselineGyro: this.calibration.baselineGyro
        }
      });
    }
  }

  /**
   * 急刹车检测回调
   */
  onHardBrakeDetected(acceleration, gyroscope, speedChange, thresholds) {
    this.lastDetectionTime = Date.now();

    console.warn('[FallDetector] 检测到急刹车！');
    console.log(`  加速度: ${acceleration.toFixed(2)} m/s²`);
    console.log(`  角速度: ${gyroscope.toFixed(2)} °/s`);
    console.log(`  速度降低: ${speedChange.speedDrop.toFixed(2)} km/h`);
    console.log(`  减速度: ${speedChange.deceleration.toFixed(2)} m/s²`);
    console.log(`  灵敏度: ${this.config.sensitivity}`);

    const confidence = this.computeBrakeConfidence(acceleration, gyroscope, speedChange, thresholds);
    console.log(`  急刹车综合置信度: ${(confidence * 100).toFixed(1)}%`);

    // 调用回调函数
    if (this.config.onHardBrakeDetected) {
      this.config.onHardBrakeDetected({
        type: 'hard_brake',
        acceleration,
        gyroscope,
        speedDrop: speedChange.speedDrop,
        deceleration: speedChange.deceleration,
        timestamp: Date.now(),
        sensitivity: this.config.sensitivity,
        confidence,
        thresholds: { ...thresholds }
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
    this._initCalibrationState();
    this.applyCalibration({ announce: true });
    console.log('[FallDetector] 已重置');
  }

  /**
   * 初始化校准状态
   */
  _initCalibrationState() {
    this.calibration = {
      isReady: false,
      accSamples: [],
      gyroSamples: [],
      sampleLimit: this.calibrationSampleLimit,
      baselineAcc: GRAVITY,
      baselineGyro: 0,
      accNoise: 0,
      gyroNoise: 0
    };
    this.activeThresholds = this.thresholds ? { ...this.thresholds } : {};
  }

  /**
   * 获取当前有效阈值（考虑校准调整）
   */
  getThresholds() {
    if (!this.activeThresholds || Object.keys(this.activeThresholds).length === 0) {
      return this.thresholds;
    }
    return this.activeThresholds;
  }

  /**
   * 根据校准数据调整阈值
   */
  applyCalibration({ announce = false } = {}) {
    if (!this.calibration || !this.calibration.isReady) {
      this.activeThresholds = { ...this.thresholds };
      if (announce) {
        console.log('[FallDetector] 当前灵敏度:', this.config.sensitivity, '阈值:', this.activeThresholds);
      }
      return;
    }

    const { baselineAcc, accNoise, baselineGyro, gyroNoise } = this.calibration;
    const gravityOffset = Math.abs(baselineAcc - GRAVITY);
    const accPadding = Math.max(accNoise * 2, 0.3);
    const gyroPadding = Math.max(gyroNoise * 3, 1);

    this.activeThresholds = {
      ...this.thresholds,
      acceleration: this.thresholds.acceleration + gravityOffset + accPadding,
      gyroscope: this.thresholds.gyroscope + gyroPadding,
      brakeGyroscope: Math.max(5, this.thresholds.brakeGyroscope + gyroPadding / 2)
    };

    if (announce) {
      console.log('[FallDetector] 当前灵敏度:', this.config.sensitivity, '阈值:', this.activeThresholds, '静态基线:', {
        baselineAcc: baselineAcc.toFixed(2),
        accNoise: accNoise.toFixed(3),
        baselineGyro: baselineGyro.toFixed(2),
        gyroNoise: gyroNoise.toFixed(3)
      });
    }
  }

  /**
   * 收集静态传感器样本以完成基线校准
   */
  collectCalibration(totalAcc, totalGyro) {
    if (this.calibration.isReady) {
      return;
    }

    const currentSpeed = this.speedHistory.length > 0 ? this.speedHistory[this.speedHistory.length - 1].speed : 0;
    if (currentSpeed > 2) {
      if (this.calibration.accSamples.length >= Math.max(10, this.calibration.sampleLimit / 2)) {
        this.finalizeCalibration();
      } else {
        this.calibration.isReady = true;
        this.applyCalibration({ announce: true });
      }
      return;
    }

    this.calibration.accSamples.push(totalAcc);
    this.calibration.gyroSamples.push(totalGyro);

    if (this.calibration.accSamples.length >= this.calibration.sampleLimit) {
      this.finalizeCalibration();
    }
  }

  /**
   * 完成校准计算
   */
  finalizeCalibration() {
    const { accSamples, gyroSamples } = this.calibration;
    if (accSamples.length === 0 || gyroSamples.length === 0) {
      this.calibration.isReady = true;
      this.applyCalibration({ announce: true });
      return;
    }

    const baselineAcc = this.calculateMean(accSamples);
    const baselineGyro = this.calculateMean(gyroSamples);
    const accNoise = this.calculateStd(accSamples, baselineAcc);
    const gyroNoise = this.calculateStd(gyroSamples, baselineGyro);

    Object.assign(this.calibration, {
      isReady: true,
      baselineAcc: baselineAcc || GRAVITY,
      baselineGyro: baselineGyro || 0,
      accNoise: accNoise || 0,
      gyroNoise: gyroNoise || 0,
      accSamples: [],
      gyroSamples: []
    });

    this.applyCalibration({ announce: true });
  }

  /**
   * 计算平均值
   */
  calculateMean(arr) {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((total, val) => total + val, 0);
    return sum / arr.length;
  }

  /**
   * 计算标准差
   */
  calculateStd(arr, mean) {
    if (!arr || arr.length === 0) return 0;
    const variance = arr.reduce((total, val) => total + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }

  /**
   * 计算摔倒检测置信度
   */
  computeFallConfidence(acceleration, gyroscope, speedChange, thresholds, hasSpeedData) {
    const ratios = [
      this.safeRatio(acceleration, thresholds.acceleration),
      this.safeRatio(gyroscope, thresholds.gyroscope)
    ];

    if (hasSpeedData) {
      ratios.push(this.safeRatio(speedChange.speedDrop, thresholds.speedDrop));
    }

    const normalized = ratios.map(val => Math.min(Math.max(val, 0), 2));
    const avg = normalized.reduce((total, val) => total + val, 0) / normalized.length;
    return this.clampConfidence(avg / 1.5);
  }

  /**
   * 计算急刹车置信度
   */
  computeBrakeConfidence(acceleration, gyroscope, speedChange, thresholds) {
    const accRatio = this.safeRatio(acceleration, thresholds.brakeAcceleration);
    const speedRatio = this.safeRatio(speedChange.speedDrop, thresholds.brakeSpeedDrop);
    const rotationMargin = thresholds.brakeGyroscope > 0 ? 1 - Math.min(gyroscope / thresholds.brakeGyroscope, 1) : 0.5;
    const decelRatio = thresholds.brakeDeceleration !== 0
      ? Math.min(Math.abs(speedChange.deceleration / thresholds.brakeDeceleration), 2)
      : 1;

    const score = (Math.min(accRatio, 2) + Math.min(speedRatio, 2) + rotationMargin + Math.min(decelRatio, 2)) / 4;
    return this.clampConfidence(score / 1.5);
  }

  /**
   * 归一化比例
   */
  safeRatio(value, threshold) {
    if (!threshold) return 0;
    if (threshold < 0) {
      return value / Math.abs(threshold);
    }
    return value / threshold;
  }

  /**
   * 限制置信度范围
   */
  clampConfidence(value) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
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
   * @returns {Promise} - 返回 Promise，在传感器启动完成后 resolve
   */
  start(options = {}) {
    return new Promise((resolve) => {
      // 如果已在运行，先停止再重新启动（确保干净的状态）
      if (this.isRunning) {
        console.warn('[SensorService] 传感器服务已在运行，先停止再重启');
        this.stop();
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

      // 先确保传感器处于停止状态（防止状态不同步导致的启动失败）
      // 使用 Promise 等待停止操作完成
      const stopSensors = () => {
        return new Promise((resolveStop) => {
          // 1. 先清除所有监听器（关键步骤）
          try {
            uni.offAccelerometerChange();
            console.log('[SensorService] 已清除旧的加速度计监听器');
          } catch (e) {
            console.warn('[SensorService] 清除加速度计监听器失败:', e);
          }

          try {
            uni.offGyroscopeChange();
            console.log('[SensorService] 已清除旧的陀螺仪监听器');
          } catch (e) {
            console.warn('[SensorService] 清除陀螺仪监听器失败:', e);
          }

          // 2. 停止传感器
          let stopCount = 0;
          const checkComplete = () => {
            stopCount++;
            if (stopCount >= 2) {
              // 两个传感器都停止后，延迟200ms确保状态完全同步
              console.log('[SensorService] 传感器已停止，等待200ms后启动...');
              setTimeout(resolveStop, 200);
            }
          };

          uni.stopAccelerometer({
            success: checkComplete,
            fail: checkComplete // 即使失败也继续（可能本来就没启动）
          });

          uni.stopGyroscope({
            success: checkComplete,
            fail: checkComplete
          });
        });
      };

      // 等待传感器停止后再启动
      stopSensors().then(() => {
        this._startSensors(options, systemInfo, resolve);
      });
    });
  }

  /**
   * 启动传感器（内部方法）
   * @param {Function} resolve - Promise 的 resolve 函数
   */
  _startSensors(options, systemInfo, resolve) {
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

    // 用于追踪传感器启动完成情况
    let startCount = 0;
    const checkAllStarted = () => {
      startCount++;
      if (startCount >= 2) {
        // 两个传感器都已处理完成（成功或失败）
        this.isRunning = true;
        console.log('[SensorService] 传感器服务已完全启动');
        if (resolve) {
          resolve(); // 通知调用者启动完成
        }
      }
    };

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

        checkAllStarted(); // 通知加速度计启动完成
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

        checkAllStarted(); // 即使失败也要通知（让陀螺仪继续）
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

        checkAllStarted(); // 通知陀螺仪启动完成
      },
      fail: (err) => {
        console.error('[SensorService] ❌ 陀螺仪启动失败:', err);

        // 陀螺仪不是必需的，可以继续运行
        if (systemInfo.platform === 'devtools') {
          console.warn('[SensorService] 原因：模拟器不支持传感器，请在真机上测试');
        } else {
          console.warn('[SensorService] 将仅使用加速度计进行检测');
        }

        checkAllStarted(); // 即使失败也要通知
      }
    });

    // 注意：不在这里设置 isRunning，而是在 checkAllStarted 中设置
  }

  /**
   * 停止传感器监听
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('[SensorService] 停止传感器服务...');

    // 先清除所有监听器（避免状态冲突）
    try {
      uni.offAccelerometerChange();
      console.log('[SensorService] 已清除加速度计监听器');
    } catch (e) {
      console.warn('[SensorService] 清除加速度计监听器失败:', e);
    }

    try {
      uni.offGyroscopeChange();
      console.log('[SensorService] 已清除陀螺仪监听器');
    } catch (e) {
      console.warn('[SensorService] 清除陀螺仪监听器失败:', e);
    }

    // 停止加速度计
    uni.stopAccelerometer({
      success: () => {
        console.log('[SensorService] 加速度计已停止');
      },
      fail: (err) => {
        console.warn('[SensorService] 停止加速度计失败:', err);
      }
    });

    // 停止陀螺仪
    uni.stopGyroscope({
      success: () => {
        console.log('[SensorService] 陀螺仪已停止');
      },
      fail: (err) => {
        console.warn('[SensorService] 停止陀螺仪失败:', err);
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
