<template>
  <view class="analysis-page">
    <!-- 顶部标题栏 -->
    <view class="header">
      <button class="back-btn" @click="goBack">
        <m-icon name="arrow_back_ios_new" :size="24" color="#1F2937"></m-icon>
      </button>
      <text class="title">骑行报告</text>
      <view class="placeholder"></view>
    </view>

    <!-- 主内容区 -->
    <view v-if="!recordData" class="loading">
      <text>加载中...</text>
    </view>

    <view v-else class="main-content">
      <!-- 基础数据卡片 -->
      <view class="data-card">
        <text class="card-title">{{ formatDateTime(recordData.startTime) }}</text>
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-value">{{ recordData.distance.toFixed(1) }} km</text>
            <text class="stat-label">总距离</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ formatDuration(recordData.duration) }}</text>
            <text class="stat-label">骑行时长</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ recordData.avgSpeed.toFixed(1) }} km/h</text>
            <text class="stat-label">平均速度</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ recordData.maxSpeed.toFixed(1) }} km/h</text>
            <text class="stat-label">最快速度</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ recordData.totalAscent.toFixed(0) }} m</text>
            <text class="stat-label">累计爬升</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">0 m</text>
            <text class="stat-label">累计下降</text>
          </view>
          <view class="stat-item wide">
            <text class="stat-value highlight">650 kcal</text>
            <text class="stat-label">预估卡路里</text>
          </view>
        </view>
      </view>

      <!-- 地图轨迹 -->
      <view class="map-card">
        <map
          v-if="mapCenter.latitude"
          :longitude="mapCenter.longitude"
          :latitude="mapCenter.latitude"
          :scale="14"
          :polyline="polyline"
          :markers="markers"
          style="width: 100%; height: 100%; border-radius: 16rpx;"
        />
      </view>

      <!-- 图表卡片 -->
      <view class="chart-card">
        <text class="chart-title">速度-时间曲线</text>
        <view class="chart-placeholder">
          <text>图表占位</text>
        </view>
      </view>

      <view class="chart-card">
        <text class="chart-title">海拔-距离曲线</text>
        <view class="chart-placeholder">
          <text>图表占位</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 返回
const goBack = () => {
  uni.navigateBack();
};

// 状态
const recordId = ref('');
const recordData = ref(null);
const mapCenter = ref({
  latitude: 0,
  longitude: 0
});
const polyline = ref([]);
const markers = ref([]);

// 加载最新记录
const loadLatestRecord = () => {
  try {
    const list = uni.getStorageSync('riding_list') || '[]';
    const ids = JSON.parse(list);

    if (ids.length > 0) {
      recordId.value = ids[0];
      loadRecord(ids[0]);
    }
  } catch (err) {
    console.error('加载记录失败:', err);
  }
};

// 加载记录
const loadRecord = (id) => {
  try {
    const data = uni.getStorageSync(`riding_${id}`);
    if (data) {
      recordData.value = JSON.parse(data);
      initMap();
    }
  } catch (err) {
    console.error('加载记录失败:', err);
  }
};

// 初始化地图
const initMap = () => {
  if (!recordData.value || !recordData.value.trackPoints || recordData.value.trackPoints.length === 0) {
    return;
  }

  const points = recordData.value.trackPoints;

  // 计算中心点
  if (points.length > 0) {
    const mid = Math.floor(points.length / 2);
    mapCenter.value = {
      latitude: points[mid].latitude,
      longitude: points[mid].longitude
    };
  }

  // 绘制轨迹
  polyline.value = [{
    points: points.map(p => ({
      latitude: p.latitude,
      longitude: p.longitude
    })),
    color: '#3B82F6',
    width: 6,
    arrowLine: true
  }];

  // 添加起点和终点标记
  if (points.length > 0) {
    markers.value = [
      {
        id: 1,
        latitude: points[0].latitude,
        longitude: points[0].longitude,
        width: 30,
        height: 30,
        callout: {
          content: '🚩 起点',
          color: '#FFFFFF',
          fontSize: 14,
          borderRadius: 8,
          bgColor: '#10B981',
          padding: 8,
          display: 'ALWAYS'
        }
      },
      {
        id: 2,
        latitude: points[points.length - 1].latitude,
        longitude: points[points.length - 1].longitude,
        width: 30,
        height: 30,
        callout: {
          content: '🏁 终点',
          color: '#FFFFFF',
          fontSize: 14,
          borderRadius: 8,
          bgColor: '#EF4444',
          padding: 8,
          display: 'ALWAYS'
        }
      }
    ];
  }
};

// 格式化日期时间
const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 格式化时长
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// 生命周期
onLoad((options) => {
  if (options.latest === 'true') {
    // 加载最新记录
    loadLatestRecord();
  } else if (options.id) {
    // 加载指定记录
    recordId.value = options.id;
    loadRecord(options.id);
  }
});
</script>

<style lang="scss" scoped>
.analysis-page {
  min-height: 100vh;
  background: #F3F4F6;
}

.header {
  background: #FFFFFF;
  padding: 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 10;

  .back-btn {
    background: transparent;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;

    &::after {
      border: none;
    }
  }

  .title {
    font-size: 40rpx;
    font-weight: 700;
    color: #1F2937;
  }

  .placeholder {
    width: 48rpx;
  }
}

.loading {
  padding: 200rpx 0;
  text-align: center;
  font-size: 36rpx;
  color: #1F2937;
  font-weight: 600;
}

.main-content {
  padding: 32rpx;
}

.data-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);

  .card-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #1F2937;
    margin-bottom: 32rpx;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24rpx 32rpx;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      &.wide {
        grid-column: 1 / -1;
      }

      .stat-value {
        font-size: 36rpx;
        font-weight: 700;
        color: #1F2937;
        margin-bottom: 8rpx;

        &.highlight {
          color: #10B981;
        }
      }

      .stat-label {
        font-size: 24rpx;
        color: #6B7280;
      }
    }
  }
}

.map-card {
  height: 512rpx;
  margin-bottom: 32rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.chart-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);

  .chart-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1F2937;
    margin-bottom: 24rpx;
  }

  .chart-placeholder {
    height: 384rpx;
    background: #F3F4F6;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9CA3AF;
    font-size: 28rpx;
  }
}
</style>
