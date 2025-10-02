/**
 * 小程序端机器学习推理引擎 - DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05
 *
 * 功能：
 * 1. 加载JSON格式的Random Forest模型
 * 2. 实现轻量级特征提取
 * 3. 实现决策树推理
 * 4. 提供摔倒检测预测API
 */

import { debugLog, errorLog } from './config.js';

/**
 * 特征提取器 - DEPLOY-04
 */
class FeatureExtractor {
  constructor(windowSize = 100, overlap = 50, samplingRate = 50) {
    this.windowSize = windowSize;
    this.overlap = overlap;
    this.samplingRate = samplingRate;
  }

  /**
   * 提取滑动窗口
   */
  extractSlidingWindows(data) {
    const windows = [];
    const step = this.windowSize - this.overlap;

    for (let i = 0; i <= data.length - this.windowSize; i += step) {
      const window = data.slice(i, i + this.windowSize);
      windows.push(window);
    }

    return windows;
  }

  /**
   * 计算均值
   */
  mean(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  /**
   * 计算标准差
   */
  std(arr) {
    if (arr.length === 0) return 0;
    const avg = this.mean(arr);
    const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  /**
   * 计算最小值
   */
  min(arr) {
    return Math.min(...arr);
  }

  /**
   * 计算最大值
   */
  max(arr) {
    return Math.max(...arr);
  }

  /**
   * 计算RMS（均方根）
   */
  rms(arr) {
    if (arr.length === 0) return 0;
    const squares = arr.map(val => val * val);
    return Math.sqrt(this.mean(squares));
  }

  /**
   * 计算偏度（简化版）
   */
  skewness(arr) {
    if (arr.length === 0) return 0;
    const avg = this.mean(arr);
    const stdDev = this.std(arr);
    if (stdDev === 0) return 0;

    const cubes = arr.map(val => Math.pow((val - avg) / stdDev, 3));
    return this.mean(cubes);
  }

  /**
   * 计算峰度（简化版）
   */
  kurtosis(arr) {
    if (arr.length === 0) return 0;
    const avg = this.mean(arr);
    const stdDev = this.std(arr);
    if (stdDev === 0) return 0;

    const fourths = arr.map(val => Math.pow((val - avg) / stdDev, 4));
    return this.mean(fourths) - 3; // 减3得到excess kurtosis
  }

  /**
   * FFT（快速傅里叶变换）- 简化版
   * 注意：这是一个简化的实现，仅用于提取主要频域特征
   */
  fft(signal) {
    const N = signal.length;
    if (N <= 1) return signal;

    // 简化的DFT实现（用于小程序）
    const result = [];
    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += signal[n] * Math.cos(angle);
        imag += signal[n] * Math.sin(angle);
      }
      result.push(Math.sqrt(real * real + imag * imag));
    }
    return result;
  }

  /**
   * 提取时域特征
   */
  extractTimeDomainFeatures(window, axis) {
    return {
      [`${axis}_mean`]: this.mean(window),
      [`${axis}_std`]: this.std(window),
      [`${axis}_min`]: this.min(window),
      [`${axis}_max`]: this.max(window),
      [`${axis}_range`]: this.max(window) - this.min(window),
      [`${axis}_rms`]: this.rms(window),
      [`${axis}_skewness`]: this.skewness(window),
      [`${axis}_kurtosis`]: this.kurtosis(window)
    };
  }

  /**
   * 提取频域特征
   */
  extractFrequencyDomainFeatures(window, axis) {
    const fftResult = this.fft(window);
    const energy = fftResult.reduce((sum, val) => sum + val * val, 0);

    // 找到主频率
    let maxMagnitude = 0;
    let dominantFreqIndex = 0;
    fftResult.forEach((mag, idx) => {
      if (mag > maxMagnitude) {
        maxMagnitude = mag;
        dominantFreqIndex = idx;
      }
    });

    const dominantFreq = (dominantFreqIndex * this.samplingRate) / window.length;

    return {
      [`${axis}_fft_energy`]: energy,
      [`${axis}_dominant_freq`]: dominantFreq
    };
  }

  /**
   * 提取合成特征
   */
  extractCompositeFeatures(window) {
    // 加速度合成幅度
    const accMagnitude = window.map(point =>
      Math.sqrt(point.acc.x ** 2 + point.acc.y ** 2 + point.acc.z ** 2)
    );

    // 角速度合成幅度
    const gyroMagnitude = window.map(point =>
      Math.sqrt(point.gyro.x ** 2 + point.gyro.y ** 2 + point.gyro.z ** 2)
    );

    return {
      'acc_magnitude_mean': this.mean(accMagnitude),
      'acc_magnitude_std': this.std(accMagnitude),
      'gyro_magnitude_mean': this.mean(gyroMagnitude),
      'gyro_magnitude_std': this.std(gyroMagnitude)
    };
  }

  /**
   * 从窗口提取所有特征
   */
  extractFeaturesFromWindow(window) {
    const features = {};

    // 提取各轴的数据
    const accX = window.map(p => p.acc.x);
    const accY = window.map(p => p.acc.y);
    const accZ = window.map(p => p.acc.z);
    const gyroX = window.map(p => p.gyro.x);
    const gyroY = window.map(p => p.gyro.y);
    const gyroZ = window.map(p => p.gyro.z);

    // 时域特征
    Object.assign(features, this.extractTimeDomainFeatures(accX, 'acc_x'));
    Object.assign(features, this.extractTimeDomainFeatures(accY, 'acc_y'));
    Object.assign(features, this.extractTimeDomainFeatures(accZ, 'acc_z'));
    Object.assign(features, this.extractTimeDomainFeatures(gyroX, 'gyro_x'));
    Object.assign(features, this.extractTimeDomainFeatures(gyroY, 'gyro_y'));
    Object.assign(features, this.extractTimeDomainFeatures(gyroZ, 'gyro_z'));

    // 频域特征
    Object.assign(features, this.extractFrequencyDomainFeatures(accX, 'acc_x'));
    Object.assign(features, this.extractFrequencyDomainFeatures(accY, 'acc_y'));
    Object.assign(features, this.extractFrequencyDomainFeatures(accZ, 'acc_z'));
    Object.assign(features, this.extractFrequencyDomainFeatures(gyroX, 'gyro_x'));
    Object.assign(features, this.extractFrequencyDomainFeatures(gyroY, 'gyro_y'));
    Object.assign(features, this.extractFrequencyDomainFeatures(gyroZ, 'gyro_z'));

    // 合成特征
    Object.assign(features, this.extractCompositeFeatures(window));

    return features;
  }

  /**
   * 提取特征向量（用于模型推理）
   */
  extractFeatureVector(window, featureOrder) {
    const features = this.extractFeaturesFromWindow(window);

    // 按照模型训练时的特征顺序返回特征值
    if (featureOrder) {
      return featureOrder.map(name => features[name] || 0);
    }

    return Object.values(features);
  }
}

/**
 * Random Forest推理引擎 - DEPLOY-03, DEPLOY-05
 */
class RandomForestInference {
  constructor(modelData) {
    this.trees = modelData.trees;
    this.metadata = modelData.metadata;
    this.featureConfig = modelData.feature_config;
    this.classNames = modelData.metadata.class_names || ['normal', 'fall'];
  }

  /**
   * 单棵树推理
   */
  predictTree(tree, features) {
    let node = tree;

    while (node.type === 'split') {
      const featureValue = features[node.feature];
      if (featureValue <= node.threshold) {
        node = node.left;
      } else {
        node = node.right;
      }
    }

    // 返回叶子节点的预测结果
    return {
      class: node.class,
      probabilities: node.probabilities
    };
  }

  /**
   * Random Forest预测（投票）
   */
  predict(features) {
    const predictions = this.trees.map(tree => this.predictTree(tree, features));

    // 统计投票
    const votes = [0, 0]; // [normal, fall]
    const probabilities = [0, 0];

    predictions.forEach(pred => {
      votes[pred.class]++;
      probabilities[0] += pred.probabilities[0];
      probabilities[1] += pred.probabilities[1];
    });

    // 平均概率
    const avgProbabilities = probabilities.map(p => p / this.trees.length);

    // 最终预测类别
    const predictedClass = votes[1] > votes[0] ? 1 : 0;

    return {
      class: predictedClass,
      className: this.classNames[predictedClass],
      probabilities: avgProbabilities,
      confidence: Math.max(...avgProbabilities),
      votes: votes
    };
  }
}

/**
 * 摔倒检测模型 - DEPLOY-02
 */
export class MLFallDetector {
  constructor() {
    this.model = null;
    this.featureExtractor = null;
    this.inferenceEngine = null;
    this.isLoaded = false;
  }

  /**
   * 加载模型
   */
  async loadModel(modelPath) {
    try {
      debugLog('ML模型', `开始加载模型: ${modelPath}`);

      // 从服务器或本地加载模型JSON
      const modelData = await this.fetchModelData(modelPath);

      // 初始化特征提取器
      if (modelData.feature_config) {
        this.featureExtractor = new FeatureExtractor(
          modelData.feature_config.window_size,
          modelData.feature_config.overlap,
          modelData.feature_config.sampling_rate
        );
      } else {
        this.featureExtractor = new FeatureExtractor();
      }

      // 初始化推理引擎
      this.inferenceEngine = new RandomForestInference(modelData);

      this.model = modelData;
      this.isLoaded = true;

      debugLog('ML模型', `模型加载成功: ${modelData.metadata.n_trees} 棵树`);

      return true;
    } catch (error) {
      errorLog('ML模型', `模型加载失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取模型数据
   */
  async fetchModelData(modelPath) {
    // 如果是URL，从服务器下载
    if (modelPath.startsWith('http')) {
      const response = await fetch(modelPath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    }

    // 如果是本地文件，从文件系统读取（小程序环境）
    return new Promise((resolve, reject) => {
      uni.request({
        url: modelPath,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`加载失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }

  /**
   * 预测摔倒（实时检测）
   */
  predictFall(sensorData) {
    if (!this.isLoaded) {
      errorLog('ML模型', '模型尚未加载');
      return null;
    }

    if (sensorData.length < this.featureExtractor.windowSize) {
      debugLog('ML模型', `数据不足: ${sensorData.length} < ${this.featureExtractor.windowSize}`);
      return null;
    }

    try {
      // 使用最新的窗口数据
      const window = sensorData.slice(-this.featureExtractor.windowSize);

      // 提取特征
      const features = this.featureExtractor.extractFeatureVector(window);

      // 推理
      const prediction = this.inferenceEngine.predict(features);

      debugLog('ML模型', `预测结果: ${prediction.className} (置信度: ${(prediction.confidence * 100).toFixed(2)}%)`);

      return prediction;
    } catch (error) {
      errorLog('ML模型', `预测失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 批量预测（滑动窗口）
   */
  predictBatch(sensorData) {
    if (!this.isLoaded) {
      errorLog('ML模型', '模型尚未加载');
      return [];
    }

    const windows = this.featureExtractor.extractSlidingWindows(sensorData);
    const predictions = [];

    windows.forEach((window, idx) => {
      const features = this.featureExtractor.extractFeatureVector(window);
      const prediction = this.inferenceEngine.predict(features);
      predictions.push({
        windowIndex: idx,
        ...prediction
      });
    });

    return predictions;
  }

  /**
   * 获取模型信息
   */
  getModelInfo() {
    if (!this.isLoaded) {
      return null;
    }

    return {
      type: this.model.model_type,
      version: this.model.version,
      n_trees: this.model.metadata.n_trees,
      n_features: this.model.metadata.n_features,
      class_names: this.model.metadata.class_names,
      feature_config: this.model.feature_config
    };
  }

  /**
   * 检查模型更新（DEPLOY-07）
   * 从服务器获取最新模型版本信息
   */
  async checkForUpdates(config) {
    try {
      debugLog('ML模型', '检查模型更新...');

      const versionUrl = `${config.API_BASE_URL}${config.MODEL_AUTO_UPDATE.versionApiPath}`;

      const response = await new Promise((resolve, reject) => {
        uni.request({
          url: versionUrl,
          method: 'GET',
          success: (res) => {
            if (res.statusCode === 200 && res.data.success) {
              resolve(res.data.data);
            } else {
              reject(new Error(`获取版本信息失败: ${res.statusCode}`));
            }
          },
          fail: reject
        });
      });

      const serverVersion = response.version;
      const serverChecksum = response.checksum;
      const localVersion = this.model?.version;

      debugLog('ML模型', `服务器版本: ${serverVersion}, 本地版本: ${localVersion}`);

      // 检查是否需要更新
      if (!localVersion || serverVersion !== localVersion) {
        debugLog('ML模型', '发现新版本，准备更新');
        return {
          hasUpdate: true,
          serverVersion,
          localVersion,
          updateInfo: response
        };
      }

      debugLog('ML模型', '已是最新版本');
      return {
        hasUpdate: false,
        serverVersion,
        localVersion
      };

    } catch (error) {
      errorLog('ML模型', `检查更新失败: ${error.message}`);
      return {
        hasUpdate: false,
        error: error.message
      };
    }
  }

  /**
   * 自动更新模型（DEPLOY-07）
   * 下载并加载新版本模型
   */
  async autoUpdateModel(updateInfo, config) {
    try {
      debugLog('ML模型', `开始下载模型 v${updateInfo.serverVersion}...`);

      // 显示加载提示
      uni.showLoading({
        title: '更新模型中...',
        mask: true
      });

      // 从服务器下载新模型
      const modelUrl = updateInfo.updateInfo.model_url;

      // 加载新模型
      const loaded = await this.loadModel(modelUrl);

      uni.hideLoading();

      if (loaded) {
        debugLog('ML模型', `模型更新成功: v${updateInfo.serverVersion}`);

        // 保存版本信息到本地存储
        uni.setStorageSync('ml_model_version', updateInfo.serverVersion);
        uni.setStorageSync('ml_model_checksum', updateInfo.updateInfo.checksum);

        // 显示更新成功提示
        uni.showToast({
          title: `模型已更新至 v${updateInfo.serverVersion}`,
          icon: 'success',
          duration: 2000
        });

        return true;
      } else {
        throw new Error('模型加载失败');
      }

    } catch (error) {
      uni.hideLoading();
      errorLog('ML模型', `自动更新失败: ${error.message}`);

      uni.showToast({
        title: '模型更新失败',
        icon: 'none'
      });

      return false;
    }
  }

  /**
   * 初始化自动更新（DEPLOY-07）
   * 如果配置启用，则定期检查并更新模型
   */
  initAutoUpdate(config) {
    if (!config.MODEL_AUTO_UPDATE.enabled) {
      debugLog('ML模型', '模型自动更新已禁用');
      return;
    }

    debugLog('ML模型', '初始化模型自动更新');

    // 启动时检查更新
    if (config.MODEL_AUTO_UPDATE.checkOnStartup) {
      this.performUpdateCheck(config);
    }

    // 定时检查更新
    const checkInterval = config.MODEL_AUTO_UPDATE.checkInterval;
    if (checkInterval > 0) {
      setInterval(() => {
        this.performUpdateCheck(config);
      }, checkInterval);

      debugLog('ML模型', `自动更新检查间隔: ${checkInterval / 1000 / 60} 分钟`);
    }
  }

  /**
   * 执行更新检查（内部方法）
   */
  async performUpdateCheck(config) {
    const updateResult = await this.checkForUpdates(config);

    if (updateResult.hasUpdate) {
      debugLog('ML模型', '发现新版本，开始自动更新');

      // 自动更新
      await this.autoUpdateModel(updateResult, config);
    }
  }

  /**
   * 手动触发更新检查（提供给UI使用）
   */
  async manualCheckUpdate(config) {
    const updateResult = await this.checkForUpdates(config);

    if (updateResult.error) {
      uni.showToast({
        title: '检查更新失败',
        icon: 'none'
      });
      return false;
    }

    if (updateResult.hasUpdate) {
      // 询问用户是否更新
      return new Promise((resolve) => {
        uni.showModal({
          title: '发现新版本',
          content: `发现新模型版本 v${updateResult.serverVersion}，是否立即更新？`,
          confirmText: '更新',
          cancelText: '取消',
          success: async (res) => {
            if (res.confirm) {
              const updated = await this.autoUpdateModel(updateResult, config);
              resolve(updated);
            } else {
              resolve(false);
            }
          }
        });
      });
    } else {
      uni.showToast({
        title: '已是最新版本',
        icon: 'success'
      });
      return true;
    }
  }
}

// 导出单例
let mlDetectorInstance = null;

export function getMLDetector() {
  if (!mlDetectorInstance) {
    mlDetectorInstance = new MLFallDetector();
  }
  return mlDetectorInstance;
}

export default {
  MLFallDetector,
  getMLDetector
};
