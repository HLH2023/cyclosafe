<template>
  <view class="analysis-page" :class="themeClass">
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
            <text class="stat-value">{{ convertDistance(recordData.distance).toFixed(1) }} {{ distanceUnit }}</text>
            <text class="stat-label">总距离</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ formatDuration(recordData.duration) }}</text>
            <text class="stat-label">骑行时长</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ convertSpeed(recordData.avgSpeed).toFixed(1) }} {{ speedUnit }}</text>
            <text class="stat-label">平均速度</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ convertSpeed(recordData.maxSpeed).toFixed(1) }} {{ speedUnit }}</text>
            <text class="stat-label">最快速度</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ convertAltitude(recordData.totalAscent).toFixed(0) }} {{ altitudeUnit }}</text>
            <text class="stat-label">累计爬升</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ convertAltitude(recordData.totalDescent || 0).toFixed(0) }} {{ altitudeUnit }}</text>
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
          class="analysis-map"
          :longitude="mapCenter.longitude"
          :latitude="mapCenter.latitude"
          :scale="mapConfig.defaultScale"
          :polyline="polyline"
          :markers="markers"
          :enable-satellite="mapSettingsStore.isSatelliteEnabled"
        />
      </view>

      <!-- 速度-时间曲线图 -->
      <view class="chart-card">
        <text class="chart-title">速度-时间曲线</text>
        <view class="chart-wrapper">
          <line-chart
            v-if="speedChartData.categories.length > 0"
            canvas-id="speedChart"
            :chart-data="speedChartData"
            :opts="speedChartOpts"
          />
          <view v-else class="chart-placeholder">
            <text>暂无数据</text>
          </view>
        </view>
      </view>

      <!-- 海拔-距离曲线图 -->
      <view class="chart-card">
        <text class="chart-title">海拔-距离曲线</text>
        <view class="chart-wrapper">
          <line-chart
            v-if="altitudeChartData.categories.length > 0"
            canvas-id="altitudeChart"
            :chart-data="altitudeChartData"
            :opts="altitudeChartOpts"
          />
          <view v-else class="chart-placeholder">
            <text>暂无数据</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { useMapSettingsStore } from '@/store/mapSettings';
import { useUnits } from '@/composables/useUnits.js';
import mapConfig from '@/config/map.config.js';
import { getRidingRecordRepository } from '@/db/repositories/index.js';

// 主题
const themeStore = useThemeStore();
const themeClass = computed(() => themeStore.isDark ? 'theme-dark' : 'theme-light');

// 地图设置
const mapSettingsStore = useMapSettingsStore();

// 单位管理
const { distanceUnit, speedUnit, altitudeUnit, convertDistance, convertSpeed, convertAltitude } = useUnits();

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

// 图表数据
const speedChartData = ref({
  categories: [],
  series: []
});
const speedChartOpts = computed(() => ({
  xAxis: {
    title: '时间'
  },
  yAxis: {
    title: `速度 (${speedUnit.value})`,
    format: (val) => val.toFixed(1)
  }
}));

const altitudeChartData = ref({
  categories: [],
  series: []
});
const altitudeChartOpts = computed(() => ({
  xAxis: {
    title: `距离 (${distanceUnit.value})`
  },
  yAxis: {
    title: `海拔 (${altitudeUnit.value})`,
    format: (val) => val.toFixed(0)
  }
}));

// 加载最新记录
const loadLatestRecord = () => {
  try {
    // 使用Repository从本地存储读取最新记录
    const repository = getRidingRecordRepository();
    const records = repository.getAllRecords({ limit: 1 });

    if (records.length > 0) {
      recordId.value = records[0].id;
      loadRecord(records[0].id);
      console.log('✅ 从本地存储加载最新记录:', records[0].id);
    } else {
      console.log('暂无骑行记录');
      uni.showToast({
        title: '暂无骑行记录',
        icon: 'none'
      });
    }
  } catch (err) {
    console.error('❌ 加载记录失败:', err);
    uni.showToast({
      title: '加载记录失败',
      icon: 'none'
    });
  }
};

// 加载记录
const loadRecord = (id) => {
  try {
    // 使用Repository从本地存储读取记录详情
    const repository = getRidingRecordRepository();
    const record = repository.getRecord(id);

    if (record) {
      recordData.value = record;
      initMap();
      initCharts();
      console.log('✅ 从本地存储加载记录详情:', id);
    } else {
      console.log('记录不存在:', id);
      uni.showToast({
        title: '记录不存在',
        icon: 'none'
      });
    }
  } catch (err) {
    console.error('❌ 加载记录失败:', err);
    uni.showToast({
      title: '加载记录失败',
      icon: 'none'
    });
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
    color: mapSettingsStore.getTrackColor,
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

// 初始化图表数据
const initCharts = () => {
  if (!recordData.value || !recordData.value.trackPoints || recordData.value.trackPoints.length === 0) {
    console.log('无轨迹点数据');
    return;
  }

  const points = recordData.value.trackPoints;
  console.log('开始初始化图表，轨迹点数量:', points.length);

  // 处理速度-时间曲线数据
  const speedCategories = [];
  const speedData = [];
  const startTime = points[0].timestamp;

  // 降采样：最多显示50个点
  const speedStep = Math.max(1, Math.floor(points.length / 50));

  for (let i = 0; i < points.length; i += speedStep) {
    const point = points[i];
    const elapsedSeconds = Math.floor((point.timestamp - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    speedCategories.push(`${minutes}:${String(seconds).padStart(2, '0')}`);
    // point.speed 已经是 km/h，直接转换为用户设置的单位
    const speed = convertSpeed(point.speed || 0);
    speedData.push(Math.max(0, speed)); // 确保速度不为负数
  }

  console.log('速度图表数据:', {
    categories: speedCategories.length,
    data: speedData.length,
    sampleData: speedData.slice(0, 5)
  });

  speedChartData.value = {
    categories: speedCategories,
    series: [{
      name: '速度',
      data: speedData
    }]
  };

  // 处理海拔-距离曲线数据
  const altitudeCategories = [];
  const altitudeData = [];
  let accumulatedDistance = 0;

  // 降采样：最多显示50个点
  const altitudeStep = Math.max(1, Math.floor(points.length / 50));

  for (let i = 0; i < points.length; i += altitudeStep) {
    const point = points[i];

    // 计算累计距离
    if (i > 0) {
      const prevPoint = points[i - altitudeStep] || points[i - 1];
      const distance = calculateDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        point.latitude,
        point.longitude
      );
      accumulatedDistance += distance;
    }

    const distanceKm = accumulatedDistance / 1000;
    altitudeCategories.push(convertDistance(distanceKm).toFixed(1)); // 转换为用户设置的单位
    const altitude = convertAltitude(point.altitude || 0);
    altitudeData.push(altitude); // 转换海拔单位
  }

  console.log('海拔图表数据:', {
    categories: altitudeCategories.length,
    data: altitudeData.length,
    sampleData: altitudeData.slice(0, 5)
  });

  altitudeChartData.value = {
    categories: altitudeCategories,
    series: [{
      name: '海拔',
      data: altitudeData
    }]
  };
};

// 计算两点间距离（Haversine公式）
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
  background: var(--background-color);
}

.header {
  background: var(--card-background);
  padding: 32rpx;
  padding-top: calc(var(--status-bar-height) + 32rpx);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
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
    color: var(--text-primary);
  }

  .placeholder {
    width: 48rpx;
  }
}

.loading {
  padding: 200rpx 0;
  text-align: center;
  font-size: 36rpx;
  color: var(--text-primary);
  font-weight: 600;
}

.main-content {
  padding: 32rpx;
}

.data-card {
  background: var(--card-background);
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: var(--shadow-sm);

  .card-title {
    font-size: 36rpx;
    font-weight: 600;
    color: var(--text-primary);
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
        color: var(--text-primary);
        margin-bottom: 8rpx;

        &.highlight {
          color: var(--success-color);
        }
      }

      .stat-label {
        font-size: 24rpx;
        color: var(--text-secondary);
      }
    }
  }
}

.map-card {
  position: relative;
  height: 512rpx;
  margin-bottom: 32rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: var(--shadow-sm);

  .analysis-map {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    border-radius: 12rpx;
  }
}

.chart-card {
  background: var(--card-background);
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: var(--shadow-sm);

  .chart-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 24rpx;
  }

  .chart-wrapper {
    height: 384rpx;
  }

  .chart-placeholder {
    height: 384rpx;
    background: var(--background-secondary);
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-tertiary);
    font-size: 28rpx;
  }
}
</style>
