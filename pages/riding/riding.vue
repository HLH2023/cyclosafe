<template>
  <view class="riding-page">
    <!-- 顶部标题栏 -->
    <view class="header">
      <text class="title">骑行中</text>
      <view class="header-right">
        <!-- 数据采集开关 -->
        <view
          class="data-collection-toggle"
          :class="{ active: isDataCollectionEnabled }"
          @click="toggleDataCollection"
        >
          <m-icon
            :name="isDataCollectionEnabled ? 'science' : 'science_off'"
            :size="20"
            :color="isDataCollectionEnabled ? '#007AFF' : '#8E8E93'"
          ></m-icon>
          <text
            v-if="isRiding && isDataCollectionEnabled"
            class="data-count"
          >{{ collectedDataCount }}</text>
        </view>
        <m-icon name="battery_horiz_075" :size="24" color="#1C1C1E"></m-icon>
        <text class="time">{{ currentTime }}</text>
      </view>
    </view>

    <!-- 主内容区 -->
    <view class="main-content">
      <!-- 地图区域 -->
      <view class="map-section">
        <map
          id="riding-map"
          :longitude="currentLocation.longitude"
          :latitude="currentLocation.latitude"
          :scale="15"
          :markers="markers"
          :polyline="polyline"
          :show-location="true"
          style="width: 100%; height: 100%; border-radius: 24rpx;"
        />
      </view>

      <!-- 数据卡片 -->
      <view class="data-card glass-morphism">
        <!-- 速度显示 -->
        <view class="speed-display">
          <text class="speed-value">{{ currentSpeed.toFixed(1) }}</text>
          <text class="speed-unit">KM/H</text>
        </view>

        <!-- 其他数据 -->
        <view class="stats-row">
          <view class="stat-item">
            <text class="stat-value">{{ formattedPace }}</text>
            <text class="stat-label">配速</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ distance.toFixed(1) }}</text>
            <text class="stat-label">距离 (KM)</text>
          </view>
        </view>
      </view>

      <!-- 控制按钮 -->
      <view class="control-section">
        <template v-if="!isRiding">
          <button class="control-btn start-btn circle-btn" @click="startRiding">
            <m-icon name="play_arrow" :size="60" color="#FFFFFF"></m-icon>
          </button>
        </template>
        <template v-else>
          <button v-if="!isPaused" class="control-btn pause-btn circle-btn" @click="pauseRiding">
            <m-icon name="pause" :size="60" color="#FFFFFF"></m-icon>
          </button>
          <button v-else class="control-btn resume-btn circle-btn" @click="resumeRiding">
            <m-icon name="play_arrow" :size="60" color="#FFFFFF"></m-icon>
          </button>
          <button class="control-btn stop-btn circle-btn-small" @click="stopRiding">
            <m-icon name="stop" :size="50" color="#FFFFFF"></m-icon>
          </button>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import sensorService from '@/services/sensorService.js';
import DataCollector from '@/utils/dataCollector.js';
import { getMLDetector } from '@/utils/mlModel.js';
import config from '@/utils/config.js';
import { getRidingRecordRepository, getSettingsRepository } from '@/db/repositories/index.js';
import { generateUUID } from '@/utils/uuid.js';

// 当前时间
const currentTime = ref('');
const updateTime = () => {
  const now = new Date();
  currentTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};
updateTime();
setInterval(updateTime, 60000);

// 状态
const isRiding = ref(false);
const isPaused = ref(false);
const currentSpeed = ref(0);
const distance = ref(0);
const duration = ref(0);
const avgSpeed = ref(0);
const maxSpeed = ref(0);
const altitude = ref(0);
const totalAscent = ref(0);

const currentLocation = ref({
  longitude: 116.404,
  latitude: 39.915
});

const markers = ref([]);
const polyline = ref([]);
const trackPoints = ref([]);
const startTime = ref(0);
const timer = ref(null);

// 数据采集器
const dataCollector = ref(null);
const isDataCollectionEnabled = ref(false); // 是否启用数据采集
const collectedDataCount = ref(0); // 已采集数据点数

// ML摔倒检测器
const mlDetector = ref(null);
const isMLDetectionEnabled = ref(false); // 是否启用ML检测
const mlModelLoaded = ref(false); // ML模型是否加载
const lastMLPrediction = ref(null); // 最后一次ML预测结果

// 计算属性
const formattedDuration = computed(() => {
  const hours = Math.floor(duration.value / 3600);
  const mins = Math.floor((duration.value % 3600) / 60);
  const secs = duration.value % 60;
  return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
});

// 配速 (分钟/公里)
const formattedPace = computed(() => {
  if (currentSpeed.value === 0) return '0:00';
  const paceMinutes = 60 / currentSpeed.value;
  const mins = Math.floor(paceMinutes);
  const secs = Math.floor((paceMinutes - mins) * 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
});

// 计算两点距离（Haversine公式）
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 更新地图轨迹
const updateMapPolyline = () => {
  if (trackPoints.value.length < 2) return;

  polyline.value = [{
    points: trackPoints.value.map(p => ({
      latitude: p.latitude,
      longitude: p.longitude
    })),
    color: '#3B82F6',
    width: 6,
    arrowLine: true
  }];
};

// 计算距离
const calculateDistance = () => {
  if (trackPoints.value.length < 2) return;

  const lastTwo = trackPoints.value.slice(-2);
  const segmentDistance = getDistance(
    lastTwo[0].latitude,
    lastTwo[0].longitude,
    lastTwo[1].latitude,
    lastTwo[1].longitude
  );

  distance.value += segmentDistance;

  // 计算平均速度
  if (duration.value > 0) {
    avgSpeed.value = (distance.value / duration.value) * 3600;
  }
};

// 处理位置更新
const handleLocationUpdate = (location) => {
  if (isPaused.value) return;

  console.log('位置更新:', location);

  // 更新当前位置
  currentLocation.value = {
    longitude: location.longitude,
    latitude: location.latitude
  };

  // 更新速度（m/s 转 km/h）
  currentSpeed.value = (location.speed || 0) * 3.6;

  // 更新最高速度
  if (currentSpeed.value > maxSpeed.value) {
    maxSpeed.value = currentSpeed.value;
  }

  // 更新海拔
  altitude.value = location.altitude || 0;

  // 记录轨迹点
  trackPoints.value.push({
    latitude: location.latitude,
    longitude: location.longitude,
    altitude: location.altitude,
    speed: currentSpeed.value,
    timestamp: Date.now()
  });

  // 更新地图轨迹
  updateMapPolyline();

  // 计算距离
  calculateDistance();
};

// 开始定位更新
const startLocationUpdate = () => {
  uni.startLocationUpdate({
    success: () => {
      uni.onLocationChange((res) => {
        handleLocationUpdate(res);
      });
    },
    fail: (err) => {
      console.error('定位失败:', err);
      uni.showToast({
        title: '定位失败',
        icon: 'none'
      });
    }
  });
};

// 开始计时
const startTimer = () => {
  timer.value = setInterval(() => {
    duration.value++;
  }, 1000);
};

// 初始化数据采集器
const initDataCollector = () => {
  if (!dataCollector.value) {
    dataCollector.value = new DataCollector({
      sampleRate: 50,
      bufferSize: 150000, // 增大缓冲区，支持长时间骑行（50分钟）
      onDataUpdate: (info) => {
        collectedDataCount.value = info.count;

        // ML实时检测（每采集50个点检测一次）
        if (isMLDetectionEnabled.value && mlModelLoaded.value && info.count % 50 === 0) {
          performMLDetection();
        }
      }
    });
  }
};

// 初始化ML检测器
const initMLDetector = async () => {
  if (!mlDetector.value) {
    mlDetector.value = getMLDetector();

    // 尝试加载模型
    try {
      // 从本地或服务器加载模型
      const modelPath = config.MODEL_AUTO_UPDATE.localModelPath;
      const modelLoaded = await mlDetector.value.loadModel(modelPath);

      if (modelLoaded) {
        mlModelLoaded.value = true;
        isMLDetectionEnabled.value = true;

        const modelInfo = mlDetector.value.getModelInfo();
        console.log('ML模型加载成功:', modelInfo);

        // 初始化自动更新（如果配置启用）
        mlDetector.value.initAutoUpdate(config);

        uni.showToast({
          title: 'ML模型已就绪',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('ML模型加载失败:', error);
      mlModelLoaded.value = false;
      isMLDetectionEnabled.value = false;
    }
  }
};

// 执行ML检测
const performMLDetection = () => {
  if (!mlDetector.value || !mlModelLoaded.value) return;

  const bufferData = dataCollector.value.getBufferData();

  if (bufferData.length < 100) return; // 数据不足

  // 使用ML模型进行预测
  const prediction = mlDetector.value.predictFall(bufferData);

  if (prediction) {
    lastMLPrediction.value = prediction;

    // 如果检测到摔倒（置信度>0.7）
    if (prediction.class === 1 && prediction.confidence > 0.7) {
      console.warn('ML检测到摔倒！', prediction);
      handleMLFallDetected(prediction);
    }
  }
};

// ML摔倒检测回调
const handleMLFallDetected = (prediction) => {
  // 震动警告
  uni.vibrateLong();

  // 显示警告弹窗
  showFallAlert('ML');

  // 记录日志
  console.log('ML摔倒检测:', {
    confidence: prediction.confidence,
    probabilities: prediction.probabilities,
    location: currentLocation.value,
    speed: currentSpeed.value
  });
};

// 开始数据采集
const startDataCollection = () => {
  if (!isDataCollectionEnabled.value) return;

  initDataCollector();
  dataCollector.value.clearBuffer(); // 清空之前的数据
  dataCollector.value.startCollection();

  console.log('开始采集训练数据');
};

// 停止数据采集并上传
const stopDataCollectionAndUpload = async () => {
  if (!isDataCollectionEnabled.value || !dataCollector.value) return;

  // 停止采集
  dataCollector.value.stopCollection();

  const bufferData = dataCollector.value.getBufferData();

  // 如果采集到了足够的数据（至少100个点），则上传
  if (bufferData.length >= 100) {
    try {
      uni.showLoading({
        title: '上传数据中...'
      });

      await dataCollector.value.uploadData('normal', 'riding', {
        collection_method: 'riding_page',
        riding_duration: duration.value,
        riding_distance: distance.value,
        avg_speed: avgSpeed.value,
        max_speed: maxSpeed.value
      });

      uni.hideLoading();
      uni.showToast({
        title: `已上传${bufferData.length}个数据点`,
        icon: 'success'
      });

      console.log('骑行数据上传成功:', bufferData.length, '个数据点');
    } catch (error) {
      uni.hideLoading();
      console.error('数据上传失败:', error);
      uni.showToast({
        title: '数据上传失败',
        icon: 'none'
      });
    }
  } else {
    console.log('数据点不足，跳过上传');
  }
};

// 开始骑行
const startRiding = () => {
  console.log('开始骑行');
  isRiding.value = true;
  isPaused.value = false;
  startTime.value = Date.now();

  // 开始定位
  startLocationUpdate();

  // 开始计时
  startTimer();

  // 启动传感器服务（摔倒检测）
  startSensorService();

  // 启动数据采集（如果启用）
  startDataCollection();

  uni.showToast({
    title: '开始骑行',
    icon: 'success'
  });
};

// 启动传感器服务
const startSensorService = () => {
  // 获取设置（从SQLite读取）
  const settingsRepo = getSettingsRepository();
  const fallDetectionEnabled = settingsRepo.getSetting('fallDetectionEnabled', true); // 默认开启
  const sensitivity = settingsRepo.getSetting('fallDetectionSensitivity', 'medium');

  console.log('启动传感器服务 - 摔倒检测:', fallDetectionEnabled, '灵敏度:', sensitivity);

  // 设置摔倒检测回调
  sensorService.onFallDetected(handleFallDetected);

  // 启动服务
  sensorService.start({
    fallDetectionEnabled,
    sensitivity
  });
};

// 摔倒检测回调
const handleFallDetected = (data) => {
  console.warn('检测到摔倒！', data);

  // 震动警告
  uni.vibrateLong();

  // 显示警告弹窗
  showFallAlert('传感器');
};

// 摔倒警告弹窗
const showFallAlert = (detectionType = '传感器') => {
  let countdown = 30; // 30秒倒计时
  let countdownTimer = null;

  // 创建倒计时模态框
  const showModal = () => {
    uni.showModal({
      title: `⚠️ 摔倒检测 (${detectionType})`,
      content: `检测到摔倒，是否需要帮助？\n${countdown}秒后自动发送位置信息`,
      confirmText: '我没事',
      cancelText: '需要帮助',
      success: (res) => {
        // 清除倒计时
        if (countdownTimer) {
          clearInterval(countdownTimer);
        }

        if (res.confirm) {
          // 用户确认没事
          uni.showToast({
            title: '已取消求助',
            icon: 'success'
          });
        } else if (res.cancel) {
          // 用户需要帮助
          sendHelpRequest();
        }
      }
    });
  };

  // 显示初始弹窗
  showModal();

  // 启动倒计时
  countdownTimer = setInterval(() => {
    countdown--;

    if (countdown <= 0) {
      // 倒计时结束，自动发送求助
      clearInterval(countdownTimer);
      sendHelpRequest();
    }
  }, 1000);
};

// 发送求助信息
const sendHelpRequest = () => {
  // 获取当前位置
  uni.getLocation({
    type: 'gcj02',
    success: (location) => {
      const message = `紧急求助！
时间：${new Date().toLocaleString()}
位置：纬度 ${location.latitude.toFixed(6)}, 经度 ${location.longitude.toFixed(6)}
骑行信息：
- 距离：${distance.value.toFixed(2)} KM
- 速度：${currentSpeed.value.toFixed(1)} KM/H
- 时长：${formattedDuration.value}

请尽快联系我！`;

      // 复制到剪贴板
      uni.setClipboardData({
        data: message,
        success: () => {
          uni.showModal({
            title: '求助信息已复制',
            content: '位置信息已复制到剪贴板，请发送给紧急联系人',
            confirmText: '打开微信',
            success: (res) => {
              if (res.confirm) {
                // 尝试打开微信（小程序无法直接打开其他应用）
                uni.showToast({
                  title: '请手动打开微信发送',
                  icon: 'none',
                  duration: 3000
                });
              }
            }
          });
        }
      });

      // 震动提示
      uni.vibrateLong();

      console.log('求助信息已发送:', message);
    },
    fail: (err) => {
      console.error('获取位置失败:', err);
      uni.showToast({
        title: '获取位置失败',
        icon: 'none'
      });
    }
  });
};

// 暂停骑行
const pauseRiding = () => {
  console.log('暂停骑行');
  isPaused.value = true;

  // 停止定位
  uni.stopLocationUpdate();

  // 停止计时
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }

  // 停止传感器服务（节省电量）
  sensorService.stop();

  // 暂停数据采集（停止但不清除数据）
  if (dataCollector.value && isDataCollectionEnabled.value) {
    dataCollector.value.stopCollection();
  }

  uni.showToast({
    title: '已暂停',
    icon: 'none'
  });
};

// 继续骑行
const resumeRiding = () => {
  console.log('继续骑行');
  isPaused.value = false;

  // 恢复定位
  startLocationUpdate();

  // 恢复计时
  startTimer();

  // 重新启动传感器服务
  startSensorService();

  // 恢复数据采集
  if (dataCollector.value && isDataCollectionEnabled.value) {
    dataCollector.value.startCollection();
  }

  uni.showToast({
    title: '继续骑行',
    icon: 'success'
  });
};

// 保存骑行记录
const saveRidingRecord = async () => {
  const recordId = generateUUID();
  const record = {
    id: recordId,
    startTime: startTime.value,
    endTime: Date.now(),
    duration: duration.value,
    distance: distance.value,
    avgSpeed: avgSpeed.value,
    maxSpeed: maxSpeed.value,
    totalAscent: totalAscent.value,
    trackPoints: trackPoints.value
  };

  try {
    // 使用Repository保存记录到SQLite
    const repository = getRidingRecordRepository();
    const success = await repository.saveRecord(record);

    if (success) {
      console.log('✅ 骑行记录已保存到SQLite:', recordId);
    } else {
      console.error('❌ 骑行记录保存失败');
      uni.showToast({
        title: '记录保存失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('❌ 保存骑行记录出错:', error);
    uni.showToast({
      title: '记录保存出错',
      icon: 'none'
    });
  }
};

// 清理资源
const cleanup = () => {
  // 停止定位
  uni.stopLocationUpdate();
  uni.offLocationChange();

  // 停止计时
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }

  // 停止传感器服务
  sensorService.stop();

  // 停止数据采集器
  if (dataCollector.value && isDataCollectionEnabled.value) {
    dataCollector.value.stopCollection();
  }
};

// 完成骑行
const finishRiding = async () => {
  console.log('结束骑行');

  // 停止所有监听
  cleanup();

  // 上传训练数据（如果启用）
  await stopDataCollectionAndUpload();

  // 保存数据到SQLite
  await saveRidingRecord();

  // 重置状态
  isRiding.value = false;
  isPaused.value = false;
  collectedDataCount.value = 0;

  // 跳转到分析页面（传递最新记录ID）
  uni.navigateTo({
    url: '/pages/analysis/analysis?latest=true'
  });
};

// 结束骑行
const stopRiding = () => {
  uni.showModal({
    title: '结束骑行',
    content: '确定要结束本次骑行吗？',
    success: (res) => {
      if (res.confirm) {
        finishRiding();
      }
    }
  });
};

// 切换数据采集开关
const toggleDataCollection = () => {
  isDataCollectionEnabled.value = !isDataCollectionEnabled.value;

  // 保存设置到SQLite
  const settingsRepo = getSettingsRepository();
  settingsRepo.saveSetting('riding_data_collection_enabled', isDataCollectionEnabled.value);

  uni.showToast({
    title: isDataCollectionEnabled.value ? '已开启数据采集' : '已关闭数据采集',
    icon: 'none'
  });

  console.log('数据采集开关:', isDataCollectionEnabled.value);
};

// 生命周期
onLoad(() => {
  console.log('骑行页面加载');

  // 读取数据采集设置（默认开启）
  const settingsRepo = getSettingsRepository();
  isDataCollectionEnabled.value = settingsRepo.getSetting('riding_data_collection_enabled', true);

  console.log('数据采集设置:', isDataCollectionEnabled.value);

  // 初始化ML检测器
  initMLDetector().catch(err => {
    console.error('ML检测器初始化失败:', err);
  });
});

onUnmounted(() => {
  cleanup();
});
</script>

<style lang="scss" scoped>
.riding-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F2F2F7;
  padding: 32rpx;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  color: #1C1C1E;

  .title {
    font-size: 40rpx;
    font-weight: 700;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .time {
      font-size: 32rpx;
      font-weight: 600;
    }

    .data-collection-toggle {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 8rpx 16rpx;
      border-radius: 20rpx;
      background: rgba(142, 142, 147, 0.1);
      transition: all 0.3s ease;

      &.active {
        background: rgba(0, 122, 255, 0.1);
      }

      &:active {
        transform: scale(0.95);
      }

      .data-count {
        font-size: 20rpx;
        font-weight: 600;
        color: #007AFF;
      }
    }
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.map-section {
  flex: 1;
  min-height: 0;
  margin-bottom: 32rpx;
  border-radius: 24rpx;
  border: 4rpx solid #E5E5EA;
  overflow: hidden;
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.08);
}

.data-card {
  flex-shrink: 0;
  margin-bottom: 48rpx;
  padding: 32rpx;
  border-radius: 48rpx;
  box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.08);
}

.glass-morphism {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 2rpx solid rgba(0, 0, 0, 0.05);
}

.speed-display {
  text-align: center;
  padding: 32rpx 0;
  border-bottom: 2rpx solid rgba(0, 0, 0, 0.1);
  margin-bottom: 32rpx;

  .speed-value {
    font-size: 160rpx;
    font-weight: 700;
    line-height: 1;
    color: #1C1C1E;
    text-shadow: 0 0 10rpx rgba(0, 122, 255, 0.3);
  }

  .speed-unit {
    display: block;
    font-size: 36rpx;
    font-weight: 700;
    color: #3A3A3C;
    letter-spacing: 8rpx;
    margin-top: 16rpx;
  }
}

.stats-row {
  display: flex;
  justify-content: space-around;
  gap: 32rpx;

  .stat-item {
    flex: 1;
    text-align: center;

    .stat-value {
      display: block;
      font-size: 96rpx;
      font-weight: 700;
      color: #1C1C1E;
      line-height: 1;
    }

    .stat-label {
      display: block;
      font-size: 24rpx;
      font-weight: 600;
      color: #3A3A3C;
      text-transform: uppercase;
      letter-spacing: 2rpx;
      margin-top: 16rpx;
    }
  }
}

.control-section {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 64rpx;
  padding-bottom: 32rpx;

  .control-btn {
    border: none;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      border: none;
    }

    &.circle-btn {
      width: 192rpx;
      height: 192rpx;
      border-radius: 50%;
      box-shadow: 0 16rpx 50rpx -10rpx rgba(0, 122, 255, 0.6),
                  0 8rpx 30rpx -12rpx rgba(0, 122, 255, 0.4);
    }

    &.circle-btn-small {
      width: 160rpx;
      height: 160rpx;
      border-radius: 50%;
      box-shadow: 0 16rpx 50rpx -10rpx rgba(0, 88, 185, 0.6),
                  0 8rpx 30rpx -12rpx rgba(0, 88, 185, 0.4);
    }

    &.start-btn, &.resume-btn, &.pause-btn {
      background: #007AFF;
    }

    &.stop-btn {
      background: #0058B9;
    }

    &:active {
      transform: scale(0.95);
    }
  }
}
</style>
