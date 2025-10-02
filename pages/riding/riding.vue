<template>
  <view class="riding-page">
    <!-- 顶部标题栏 -->
    <view class="header">
      <text class="title">骑行中</text>
      <view class="header-right">
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
