<template>
  <view class="riding-page" :class="themeClass">
    <!-- 速度显示区域 -->
    <view class="speed-section">
      <view class="current-speed">
        <text class="speed-value">{{ currentSpeed.toFixed(1) }}</text>
        <text class="speed-unit">km/h</text>
      </view>
    </view>

    <!-- 数据显示区域 -->
    <view class="data-section">
      <view class="data-row">
        <view class="data-item">
          <text class="data-label">距离</text>
          <text class="data-value">{{ distance.toFixed(2) }} km</text>
        </view>
        <view class="data-item">
          <text class="data-label">时长</text>
          <text class="data-value">{{ formattedDuration }}</text>
        </view>
      </view>
      <view class="data-row">
        <view class="data-item">
          <text class="data-label">平均速度</text>
          <text class="data-value">{{ avgSpeed.toFixed(1) }} km/h</text>
        </view>
        <view class="data-item">
          <text class="data-label">最高速度</text>
          <text class="data-value">{{ maxSpeed.toFixed(1) }} km/h</text>
        </view>
      </view>
      <view class="data-row">
        <view class="data-item">
          <text class="data-label">海拔</text>
          <text class="data-value">{{ altitude.toFixed(0) }} m</text>
        </view>
        <view class="data-item">
          <text class="data-label">爬升</text>
          <text class="data-value">{{ totalAscent.toFixed(0) }} m</text>
        </view>
      </view>
    </view>

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
        style="width: 100%; height: 100%;"
      />
    </view>

    <!-- 控制按钮 -->
    <view class="control-section">
      <button v-if="!isRiding" class="control-btn start-btn" @click="startRiding">
        开始
      </button>
      <template v-else>
        <button v-if="!isPaused" class="control-btn pause-btn" @click="pauseRiding">
          暂停
        </button>
        <button v-else class="control-btn resume-btn" @click="resumeRiding">
          继续
        </button>
        <button class="control-btn stop-btn" @click="stopRiding">
          结束
        </button>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';

// 主题
const themeStore = useThemeStore();
const themeClass = computed(() => themeStore.isDark ? 'theme-dark' : 'theme-light');

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

// 计算属性
const formattedDuration = computed(() => {
  const hours = Math.floor(duration.value / 3600);
  const mins = Math.floor((duration.value % 3600) / 60);
  const secs = duration.value % 60;
  return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

  uni.showToast({
    title: '开始骑行',
    icon: 'success'
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

  uni.showToast({
    title: '继续骑行',
    icon: 'success'
  });
};

// 生成UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 保存骑行记录
const saveRidingRecord = () => {
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

  // 保存记录
  uni.setStorageSync(`riding_${recordId}`, JSON.stringify(record));

  // 更新记录列表
  const list = uni.getStorageSync('riding_list') || '[]';
  const recordList = JSON.parse(list);
  recordList.unshift(recordId);
  uni.setStorageSync('riding_list', JSON.stringify(recordList));

  console.log('骑行记录已保存:', recordId);
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
};

// 完成骑行
const finishRiding = () => {
  console.log('结束骑行');

  // 停止所有监听
  cleanup();

  // 保存数据
  saveRidingRecord();

  // 重置状态
  isRiding.value = false;
  isPaused.value = false;

  // 跳转到分析页面
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

// 生命周期
onLoad(() => {
  console.log('骑行页面加载');
});

onUnmounted(() => {
  cleanup();
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.riding-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--background-color);

  &.theme-dark {
    background: var(--background-color);
  }
}

.speed-section {
  background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
  padding: 60rpx 40rpx;
  text-align: center;

  .current-speed {
    color: white;

    .speed-value {
      font-size: 160rpx;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -4rpx;
    }

    .speed-unit {
      font-size: 40rpx;
      opacity: 0.85;
      margin-left: 16rpx;
      font-weight: 500;
    }
  }
}

.theme-dark .speed-section {
  background: linear-gradient(135deg, #1E3A8A 0%, #1E293B 100%);
}

.data-section {
  background: var(--card-background);
  padding: 32rpx;

  .data-row {
    display: flex;
    gap: 20rpx;
    margin-bottom: 24rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .data-item {
      flex: 1;
      padding: 28rpx 20rpx;
      background: rgba(59, 130, 246, 0.08);
      border-radius: var(--radius-md);
      text-align: center;
      border: 1rpx solid rgba(59, 130, 246, 0.12);

      .data-label {
        display: block;
        font-size: 24rpx;
        color: var(--text-secondary);
        margin-bottom: 12rpx;
        font-weight: 500;
      }

      .data-value {
        display: block;
        font-size: 36rpx;
        font-weight: 700;
        color: var(--text-primary);
      }
    }
  }
}

.theme-dark .data-section {
  .data-row .data-item {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.2);
  }
}

.map-section {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.control-section {
  background: var(--card-background);
  padding: 32rpx;
  display: flex;
  gap: 24rpx;
  box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.08);

  .control-btn {
    flex: 1;
    height: 100rpx;
    border-radius: 50rpx;
    font-size: 34rpx;
    font-weight: 600;
    border: none;
    transition: all 0.3s ease;

    &::after {
      border: none;
    }

    &.start-btn {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.3);
    }

    &.pause-btn {
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
      color: white;
      box-shadow: 0 8rpx 20rpx rgba(245, 158, 11, 0.3);
    }

    &.resume-btn {
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
      color: white;
      box-shadow: 0 8rpx 20rpx rgba(59, 130, 246, 0.3);
    }

    &.stop-btn {
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      color: white;
      box-shadow: 0 8rpx 20rpx rgba(239, 68, 68, 0.3);
    }
  }
}

.theme-dark .control-section {
  box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.4);
}
</style>
