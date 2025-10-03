<template>
  <view class="riding-page" :class="[themeClass, { 'over-speed': isOverSpeed }]">
    <!-- 顶部标题栏 -->
    <view class="header">
      <view class="title-section">
        <m-icon
          :name="ridingStatusIcon"
          :size="28"
          :color="ridingStatusColor"
        ></m-icon>
        <text class="title" :style="{ color: ridingStatusColor }">{{ ridingStatusText }}</text>
      </view>
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
        <m-icon name="battery_horiz_075" :size="24" :color="headerIconColor"></m-icon>
        <text class="time">{{ currentTime }}</text>
      </view>
    </view>

    <!-- 主内容区 -->
    <view class="main-content">
      <!-- 地图区域 -->
      <view class="map-section" :class="{ 'over-speed-map': isOverSpeed }">
        <map
          id="riding-map"
          class="riding-map"
          :longitude="currentLocation.longitude"
          :latitude="currentLocation.latitude"
          :scale="mapConfig.defaultScale"
          :markers="markers"
          :polyline="polyline"
          :show-location="true"
          :enable-satellite="mapSettingsStore.isSatelliteEnabled"
        />
      </view>

      <!-- 数据卡片 -->
      <view class="data-card glass-morphism" :class="{ 'over-speed-card': isOverSpeed }">
        <!-- 速度显示 -->
        <view class="speed-display" :class="{ 'over-speed-display': isOverSpeed }">
          <text class="speed-value" :class="{ 'over-speed-value': isOverSpeed }">{{ convertSpeed(currentSpeed).toFixed(1) }}</text>
          <text class="speed-unit">{{ speedUnit.toUpperCase() }}</text>
        </view>

        <!-- 其他数据 -->
        <view class="stats-row">
          <view class="stat-item">
            <text class="stat-value">{{ formattedPace }}</text>
            <text class="stat-label">配速</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ convertDistance(distance).toFixed(1) }}</text>
            <text class="stat-label">距离 ({{ distanceUnit.toUpperCase() }})</text>
          </view>
        </view>
      </view>

      <!-- 控制按钮 -->
      <view class="control-section">
        <template v-if="!isRiding">
          <view class="control-btn start-btn circle-btn" hover-class="btn-hover" @click="startRiding">
            <m-icon name="play_arrow" :size="60" color="#FFFFFF"></m-icon>
          </view>
        </template>
        <template v-else>
          <view v-if="!isPaused" class="control-btn pause-btn circle-btn" hover-class="btn-hover" @click="pauseRiding">
            <m-icon name="pause" :size="60" color="#FFFFFF"></m-icon>
          </view>
          <view v-else class="control-btn resume-btn circle-btn" hover-class="btn-hover" @click="resumeRiding">
            <m-icon name="play_arrow" :size="60" color="#FFFFFF"></m-icon>
          </view>
          <view class="control-btn stop-btn circle-btn-small" hover-class="btn-hover" @click="stopRiding">
            <m-icon name="stop" :size="50" color="#FFFFFF"></m-icon>
          </view>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { useMapSettingsStore } from '@/store/mapSettings';
import { useUnits } from '@/composables/useUnits.js';
import sensorService from '@/services/sensorService.js';
import DataCollector from '@/utils/dataCollector.js';
import { getMLDetector } from '@/utils/mlModel.js';
import config from '@/utils/config.js';
import mapConfig from '@/config/map.config.js';
import { getRidingRecordRepository, getSettingsRepository, getDangerPointRepository } from '@/db/repositories/index.js';
import { generateUUID } from '@/utils/uuid.js';
import { showEmergencyCountdown } from '@/utils/emergencyHelper.js';
import { vibrateLong, vibrateShort } from '@/utils/vibrationHelper.js';
import { calculateElevationChange } from '@/utils/gpsCalculator.js';

// 主题
const themeStore = useThemeStore();
const themeClass = computed(() => themeStore.isDark ? 'theme-dark' : 'theme-light');

// 地图设置
const mapSettingsStore = useMapSettingsStore();

// 单位管理
const { distanceUnit, speedUnit, convertDistance, convertSpeed } = useUnits();

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
const totalDescent = ref(0);

const currentLocation = ref({
  longitude: mapConfig.defaultCenter.longitude,
  latitude: mapConfig.defaultCenter.latitude
});

const markers = ref([]);
const polyline = ref([]);
const trackPoints = ref([]);
const startTime = ref(0);

// 自动暂停相关
const autoPauseEnabled = ref(true); // 是否启用自动暂停
const lowSpeedStartTime = ref(0); // 低速开始时间
const LOW_SPEED_THRESHOLD = 2; // 低速阈值（km/h）
const LOW_SPEED_DURATION = 5000; // 低速持续时间（毫秒）

// 屏幕常亮设置
const keepScreenOnEnabled = ref(false); // 是否启用屏幕常亮

// 骑行状态显示
const ridingStatusText = computed(() => {
  if (!isRiding.value) {
    return '准备骑行';
  }
  if (isPaused.value) {
    return '已暂停';
  }
  return '骑行中';
});

const ridingStatusIcon = computed(() => {
  if (!isRiding.value) {
    return 'pedal_bike';
  }
  if (isPaused.value) {
    return 'pause';
  }
  return 'directions_bike';
});

const ridingStatusColor = computed(() => {
  if (!isRiding.value) {
    return '#8E8E93'; // 灰色 - 未开始
  }
  if (isPaused.value) {
    return '#FF9500'; // 橙色 - 已暂停
  }
  return '#34C759'; // 绿色 - 骑行中
});
const timer = ref(null);
const nearbyDangerPoints = ref([]); // 附近的危险点

// 超速检测
const speedThreshold = ref(40); // 超速阈值，默认40 km/h
const isOverSpeed = ref(false); // 当前是否超速
let lastOverSpeedWarning = 0; // 上次超速警告时间

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

// 头部图标颜色（根据主题动态变化）
const headerIconColor = computed(() => {
  return themeStore.isDark ? '#F9FAFB' : '#1C1C1E';
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
    color: mapSettingsStore.getTrackColor,
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

  // 更新传感器服务的速度数据（用于危险检测）
  sensorService.updateSpeed(currentSpeed.value);

  // 更新最高速度
  if (currentSpeed.value > maxSpeed.value) {
    maxSpeed.value = currentSpeed.value;
  }

  // 超速检测
  checkOverSpeed();

  // 自动暂停检测
  checkAutoPause();

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

  // 检查附近危险点
  checkNearbyDangerPoints();
};

// 超速检测
const checkOverSpeed = () => {
  const wasOverSpeed = isOverSpeed.value;
  const currentlyOverSpeed = currentSpeed.value > speedThreshold.value;

  // 更新超速状态
  isOverSpeed.value = currentlyOverSpeed;

  // 如果刚开始超速（从不超速变为超速）
  if (currentlyOverSpeed && !wasOverSpeed) {
    console.warn('⚠️ 超速警告！当前速度:', currentSpeed.value.toFixed(1), 'km/h，阈值:', speedThreshold.value, 'km/h');

    // 防止频繁提醒（30秒间隔）
    const now = Date.now();
    if (now - lastOverSpeedWarning > 30000) {
      // 震动警告
      vibrateLong();

      // Toast提示
      uni.showToast({
        title: `⚠️ 超速警告！${currentSpeed.value.toFixed(1)} km/h`,
        icon: 'none',
        duration: 2000
      });

      lastOverSpeedWarning = now;
    }
  }

  // 如果速度降回正常（从超速变为不超速）
  if (!currentlyOverSpeed && wasOverSpeed) {
    console.log('✅ 速度已恢复正常');
  }
};

// 自动暂停检测
const checkAutoPause = () => {
  // 如果未启用自动暂停，直接返回
  if (!autoPauseEnabled.value) {
    return;
  }

  // 如果已经暂停，检查是否需要自动恢复
  if (isPaused.value) {
    // 如果速度恢复到阈值以上，自动恢复骑行
    if (currentSpeed.value >= LOW_SPEED_THRESHOLD) {
      console.log('速度恢复，自动继续骑行');
      resumeRiding();
      lowSpeedStartTime.value = 0;
    }
    return;
  }

  // 如果速度低于阈值
  if (currentSpeed.value < LOW_SPEED_THRESHOLD) {
    const now = Date.now();

    // 如果是第一次检测到低速，记录开始时间
    if (lowSpeedStartTime.value === 0) {
      lowSpeedStartTime.value = now;
      console.log('检测到低速，开始计时');
    } else {
      // 如果低速持续时间超过阈值，自动暂停
      const lowSpeedDuration = now - lowSpeedStartTime.value;
      if (lowSpeedDuration >= LOW_SPEED_DURATION) {
        console.log('低速持续时间超过阈值，自动暂停');
        pauseRiding();

        // 提示用户
        uni.showToast({
          title: '速度过低，自动暂停',
          icon: 'none',
          duration: 2000
        });
      }
    }
  } else {
    // 速度恢复正常，重置低速计时器
    lowSpeedStartTime.value = 0;
  }
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
  // 记录危险点
  recordDangerPoint('fall', 'ML摔倒检测');

  // 震动警告
  vibrateLong();

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
const startRiding = async () => {
  console.log('开始骑行');
  isRiding.value = true;
  isPaused.value = false;
  startTime.value = Date.now();

  // 启用屏幕常亮（如果设置开启）
  if (keepScreenOnEnabled.value) {
    uni.setKeepScreenOn({
      keepScreenOn: true,
      success: () => {
        console.log('✅ 屏幕常亮已启用');
      },
      fail: (err) => {
        console.error('❌ 启用屏幕常亮失败:', err);
      }
    });
  }

  // 开始定位
  startLocationUpdate();

  // 开始计时
  startTimer();

  // 启动传感器服务（摔倒检测）- 等待完全启动
  await startSensorService();

  // 传感器启动完成后，再启动数据采集（如果启用）
  startDataCollection();

  uni.showToast({
    title: '开始骑行',
    icon: 'success'
  });
};

// 启动传感器服务
const startSensorService = async () => {
  // 获取设置（从本地存储读取）
  const settingsRepo = getSettingsRepository();
  const fallDetectionEnabled = settingsRepo.getSetting('fallDetectionEnabled', true); // 默认开启
  const sensitivity = settingsRepo.getSetting('fallDetectionSensitivity', 'medium');

  console.log('启动传感器服务 - 摔倒检测:', fallDetectionEnabled, '灵敏度:', sensitivity);

  // 设置摔倒检测回调
  sensorService.onFallDetected(handleFallDetected);

  // 设置急刹车检测回调
  sensorService.onHardBrakeDetected(handleHardBrakeDetected);

  // 启动服务并等待完成
  await sensorService.start({
    fallDetectionEnabled,
    sensitivity
  });

  console.log('✅ 传感器服务启动完成，可以安全启动数据采集');
};

// 摔倒检测回调
const handleFallDetected = (data) => {
  console.warn('检测到摔倒！', data);
  console.log('  - 速度降低:', data.speedDrop, 'km/h');
  console.log('  - 减速度:', data.deceleration, 'm/s²');

  // 记录危险点
  recordDangerPoint('fall', '摔倒检测');

  // 震动警告
  vibrateLong();

  // 显示警告弹窗
  showFallAlert('传感器');

  // 触发紧急呼叫倒计时
  showEmergencyCountdown({
    type: 'fall',
    location: {
      latitude: currentLocation.value.latitude,
      longitude: currentLocation.value.longitude
    },
    speed: currentSpeed.value,
    timestamp: Date.now()
  });
};

// 急刹车检测回调
const handleHardBrakeDetected = (data) => {
  console.warn('检测到急刹车！', data);
  console.log('  - 速度降低:', data.speedDrop, 'km/h');
  console.log('  - 减速度:', data.deceleration, 'm/s²');

  // 记录危险点
  recordDangerPoint('hard_brake', '急刹车检测');

  // 震动提醒（短震动，比摔倒温和）
  vibrateShort();

  // 显示提示（不是紧急警告）
  uni.showToast({
    title: '⚠️ 检测到急刹车',
    icon: 'none',
    duration: 2000
  });
};

// 记录危险点
const recordDangerPoint = async (dangerType, name) => {
  try {
    const repo = getDangerPointRepository();
    const settingsRepo = getSettingsRepository();

    // 检查是否启用危险点记录
    const dangerPointEnabled = settingsRepo.getSetting('danger_point_enabled', true);
    if (!dangerPointEnabled) {
      return;
    }

    // 检查附近是否已有危险点（50米范围内）
    const nearbyPoints = repo.getDangerPointsNearby(
      currentLocation.value.latitude,
      currentLocation.value.longitude,
      0.05 // 50米
    );

    if (nearbyPoints.length > 0) {
      console.log('附近已存在危险点，跳过记录:', {
        附近危险点数量: nearbyPoints.length,
        最近距离: (nearbyPoints[0].distance * 1000).toFixed(0) + '米',
        现有危险点: nearbyPoints[0].name
      });
      return;
    }

    // 自动生成名称
    const count = repo.getDangerPointCount() + 1;
    const pointName = name || `危险点 ${count}`;

    await repo.saveDangerPoint({
      id: generateUUID(),
      name: pointName,
      latitude: currentLocation.value.latitude,
      longitude: currentLocation.value.longitude,
      danger_type: dangerType,
      speed: currentSpeed.value,
      record_id: null // 可以关联到当前骑行记录
    });

    console.log('✅ 危险点已记录:', pointName);
  } catch (error) {
    console.error('记录危险点失败:', error);
  }
};

// 检查附近危险点
let lastDangerPointWarning = 0; // 上次警告时间
const checkNearbyDangerPoints = () => {
  try {
    const settingsRepo = getSettingsRepository();
    const dangerPointWarning = settingsRepo.getSetting('show_track', true);
    const dangerPointRange = settingsRepo.getSetting('danger_point_range', 5); // 从设置中读取显示范围，默认5km

    const repo = getDangerPointRepository();

    // 显示范围：配置的公里数内的所有危险点（地图标记）
    const displayPoints = repo.getDangerPointsNearby(
      currentLocation.value.latitude,
      currentLocation.value.longitude,
      dangerPointRange
    );

    console.log(`发现 ${displayPoints.length} 个危险点在${dangerPointRange}km范围内`);

    // 更新附近危险点列表（用于地图标记）
    nearbyDangerPoints.value = displayPoints;

    // 更新地图标记
    updateDangerPointMarkers();

    // 如果关闭了提醒，只更新标记不提醒
    if (!dangerPointWarning) {
      console.log('危险点提醒已关闭');
      return;
    }

    // 提醒范围：只提醒50米内的危险点
    const warningPoints = displayPoints.filter(p => p.distance <= 0.05);

    // 防止频繁提醒（30秒内只提醒一次）
    const now = Date.now();
    if (now - lastDangerPointWarning < 30000) {
      return;
    }

    if (warningPoints.length > 0) {
      const nearest = warningPoints[0];
      const distanceM = (nearest.distance * 1000).toFixed(0);

      // 震动提醒
      vibrateShort();

      // Toast提醒
      uni.showToast({
        title: `前方${distanceM}米有危险点`,
        icon: 'none',
        duration: 3000
      });

      lastDangerPointWarning = now;
      console.log('危险点提醒:', nearest.name, distanceM + '米');
    }
  } catch (error) {
    console.error('检查附近危险点失败:', error);
  }
};

// 更新危险点标记
const updateDangerPointMarkers = () => {
  console.log(`更新危险点标记，危险点数量: ${nearbyDangerPoints.value.length}`);

  if (nearbyDangerPoints.value.length === 0) {
    markers.value = [];
    console.log('没有危险点，清空标记');
    return;
  }

  // 将危险点转换为地图标记
  markers.value = nearbyDangerPoints.value.map((point, index) => {
    const distanceM = (point.distance * 1000).toFixed(0);
    const typeIcon = {
      fall: '⚠️',
      hard_brake: '⚠️',
      manual: '📍'
    };

    const marker = {
      id: index,
      latitude: point.latitude,
      longitude: point.longitude,
      width: 32,
      height: 32,
      iconPath: '/static/danger-pin.png', // 可选，会使用默认标记
      callout: {
        content: `${typeIcon[point.dangerType] || '⚠️'} ${point.name} (${distanceM}m)`,
        color: '#FFFFFF',
        fontSize: 12,
        borderRadius: 8,
        bgColor: '#EF4444',
        padding: 8,
        display: 'ALWAYS'
      }
    };

    console.log(`添加标记 ${index}: ${point.name} at (${point.latitude}, ${point.longitude}), 距离: ${distanceM}m`);
    return marker;
  });

  console.log(`✅ 已添加 ${markers.value.length} 个危险点标记到地图`);
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
      vibrateLong();

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
const resumeRiding = async () => {
  console.log('继续骑行');
  isPaused.value = false;

  // 恢复定位
  startLocationUpdate();

  // 恢复计时
  startTimer();

  // 重新启动传感器服务 - 等待完全启动
  await startSensorService();

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
  // 计算海拔爬升和下降
  if (trackPoints.value.length > 1) {
    const elevation = calculateElevationChange(trackPoints.value);
    totalAscent.value = elevation.ascent;
    totalDescent.value = elevation.descent;
    console.log('海拔爬升:', totalAscent.value.toFixed(1), 'm, 海拔下降:', totalDescent.value.toFixed(1), 'm');
  }

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
    totalDescent: totalDescent.value,
    trackPoints: trackPoints.value
  };

  try {
    // 使用Repository保存记录到本地存储
    const repository = getRidingRecordRepository();
    const success = await repository.saveRecord(record);

    if (success) {
      console.log('✅ 骑行记录已保存到本地存储:', recordId);
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

  // 关闭屏幕常亮
  uni.setKeepScreenOn({
    keepScreenOn: false,
    success: () => {
      console.log('✅ 屏幕常亮已关闭');
    },
    fail: (err) => {
      console.error('❌ 关闭屏幕常亮失败:', err);
    }
  });
};

// 完成骑行
const finishRiding = async () => {
  console.log('结束骑行');

  // 停止所有监听
  cleanup();

  // 上传训练数据（如果启用）
  await stopDataCollectionAndUpload();

  // 保存数据到本地存储
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

  // 保存设置到本地存储
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

  // 获取当前位置以显示在地图上
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      currentLocation.value = {
        longitude: res.longitude,
        latitude: res.latitude
      };
      console.log('✅ 获取当前位置成功:', res.longitude, res.latitude);

      // 初始化时检查一次附近的危险点
      checkNearbyDangerPoints();
    },
    fail: (err) => {
      console.error('❌ 获取位置失败:', err);
      // 失败时使用配置的默认位置
    }
  });

  // 读取数据采集设置（默认开启）
  const settingsRepo = getSettingsRepository();
  isDataCollectionEnabled.value = settingsRepo.getSetting('riding_data_collection_enabled', true);

  console.log('数据采集设置:', isDataCollectionEnabled.value);

  // 读取超速阈值设置（默认40 km/h）
  speedThreshold.value = settingsRepo.getSetting('speed_threshold', 40);
  console.log('超速阈值设置:', speedThreshold.value, 'km/h');

  // 读取自动暂停设置（默认开启）
  autoPauseEnabled.value = settingsRepo.getSetting('auto_pause', true);
  console.log('自动暂停设置:', autoPauseEnabled.value);

  // 读取屏幕常亮设置（默认关闭）
  keepScreenOnEnabled.value = settingsRepo.getSetting('keep_screen_on', false);
  console.log('屏幕常亮设置:', keepScreenOnEnabled.value);

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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--background-color);
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  overflow: hidden;
  transition: background 0.5s ease;

  // 超速时整个页面变红
  &.over-speed {
    background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
    animation: pulse-background 2s ease-in-out infinite;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  padding-top: calc(var(--status-bar-height) + 16rpx);
  color: var(--text-primary);

  .title-section {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

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
      color: var(--text-primary);
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
  overflow: hidden;
}

.map-section {
  flex: 1;
  position: relative;
  margin-bottom: 32rpx;
  border-radius: 24rpx;
  border: 4rpx solid var(--border-color);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;

  // 超速时红色脉冲边框
  &.over-speed-map {
    border-color: #ff0000;
    box-shadow: 0 0 40rpx rgba(255, 0, 0, 0.8),
                0 0 80rpx rgba(255, 0, 0, 0.6),
                0 8rpx 40rpx rgba(0, 0, 0, 0.08);
    animation: pulse-border 1.5s ease-in-out infinite;
  }

  .riding-map {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    border-radius: 20rpx;
  }
}

.data-card {
  flex-shrink: 0;
  margin-bottom: 48rpx;
  padding: 32rpx;
  border-radius: 48rpx;
  box-shadow: var(--shadow-xl);
  transition: all 0.3s ease;

  // 超速时卡片边框和阴影
  &.over-speed-card {
    border: 4rpx solid #ff0000;
    box-shadow: 0 0 40rpx rgba(255, 0, 0, 0.8),
                0 0 80rpx rgba(255, 0, 0, 0.6),
                0 12rpx 48rpx rgba(0, 0, 0, 0.08);
  }
}

.glass-morphism {
  background: var(--card-background);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 2rpx solid var(--border-color);

  // 浅色主题下使用半透明效果
  .theme-light & {
    background: rgba(255, 255, 255, 0.7);
    border: 2rpx solid rgba(0, 0, 0, 0.05);
  }

  // 暗色主题下使用半透明效果
  .theme-dark & {
    background: rgba(31, 41, 55, 0.7);
    border: 2rpx solid rgba(75, 85, 99, 0.3);
  }
}

.speed-display {
  text-align: center;
  padding: 32rpx 0;
  border-bottom: 2rpx solid var(--border-color);
  margin-bottom: 32rpx;
  transition: all 0.3s ease;

  // 超速时的显示区域效果
  &.over-speed-display {
    border-bottom-color: rgba(255, 0, 0, 0.5);
  }

  .speed-value {
    font-size: 160rpx;
    font-weight: 700;
    line-height: 1;
    color: var(--text-primary);
    text-shadow: 0 0 10rpx rgba(0, 122, 255, 0.3);
    transition: all 0.3s ease;

    // 超速时速度数字变红并闪烁
    &.over-speed-value {
      color: #ff0000;
      text-shadow: 0 0 20rpx rgba(255, 0, 0, 0.8),
                   0 0 40rpx rgba(255, 0, 0, 0.6);
      animation: blink-speed 1s ease-in-out infinite;
    }
  }

  .speed-unit {
    display: block;
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text-secondary);
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
      color: var(--text-primary);
      line-height: 1;
    }

    .stat-label {
      display: block;
      font-size: 24rpx;
      font-weight: 600;
      color: var(--text-secondary);
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
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

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
  }

  .btn-hover {
    opacity: 0.8;
    transform: scale(0.95);

    &:active {
      transform: scale(0.95);
    }
  }
}

// 动画定义
@keyframes pulse-background {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 40rpx rgba(255, 0, 0, 0.8),
                0 0 80rpx rgba(255, 0, 0, 0.6),
                0 8rpx 40rpx rgba(0, 0, 0, 0.08);
  }
  50% {
    box-shadow: 0 0 60rpx rgba(255, 0, 0, 1),
                0 0 120rpx rgba(255, 0, 0, 0.8),
                0 8rpx 40rpx rgba(0, 0, 0, 0.08);
  }
}

@keyframes blink-speed {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}
</style>
