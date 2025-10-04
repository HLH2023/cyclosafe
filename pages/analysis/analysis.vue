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
        <text class="chart-title">速度({{ speedUnit }})-时间({{ timeFormat }})</text>
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
        <text class="chart-title">海拔({{ altitudeUnit }})-距离({{ distanceUnit }})</text>
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

// 智能计算时间刻度
const calculateTimeIntervalAndTicks = (totalSeconds) => {
  if (totalSeconds >= 7200) { // >= 2小时
    return { interval: 1800, format: 'hh:mm:ss', count: Math.ceil(totalSeconds / 1800) }; // 每30分钟
  } else if (totalSeconds >= 3600) { // >= 1小时
    return { interval: 900, format: 'hh:mm:ss', count: Math.ceil(totalSeconds / 900) }; // 每15分钟
  } else if (totalSeconds >= 1800) { // >= 30分钟
    return { interval: 600, format: 'mm:ss', count: Math.ceil(totalSeconds / 600) }; // 每10分钟
  } else if (totalSeconds >= 600) { // >= 10分钟
    return { interval: 300, format: 'mm:ss', count: Math.ceil(totalSeconds / 300) }; // 每5分钟
  } else {
    return { interval: 120, format: 'mm:ss', count: Math.ceil(totalSeconds / 120) }; // 每2分钟
  }
};

// 格式化时间标签
const formatTimeLabel = (seconds, format) => {
  if (format === 'hh:mm:ss') {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }
};

// 图表数据
const speedChartData = ref({
  categories: [],
  series: []
});

// 动态时间格式（根据骑行时长判断）
const timeFormat = computed(() => {
  if (!recordData.value || !recordData.value.duration) return 'mm:ss';
  const duration = recordData.value.duration;
  const { format } = calculateTimeIntervalAndTicks(duration);
  return format;
});

const speedChartOpts = computed(() => ({
  xAxis: {},
  yAxis: {
    format: (val) => val.toFixed(1)
  }
}));

const altitudeChartData = ref({
  categories: [],
  series: []
});
const altitudeChartOpts = computed(() => ({
  xAxis: {},
  yAxis: {
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
  const totalDuration = recordData.value.duration || 0;

  // 智能计算刻度
  const { interval, format } = calculateTimeIntervalAndTicks(totalDuration);

  // 生成刻度时间点
  const ticks = [];
  for (let t = 0; t <= totalDuration; t += interval) {
    ticks.push(t);
  }
  // 确保包含最后一个时间点
  if (ticks[ticks.length - 1] < totalDuration) {
    ticks.push(totalDuration);
  }

  // 为每个刻度点插值速度数据
  for (const tickSeconds of ticks) {
    speedCategories.push(formatTimeLabel(tickSeconds, format));

    // 查找最接近该时间点的轨迹点
    let closestPoint = points[0];
    let minDiff = Math.abs(points[0].timestamp - startTime - tickSeconds * 1000);

    for (const point of points) {
      const diff = Math.abs(point.timestamp - startTime - tickSeconds * 1000);
      if (diff < minDiff) {
        minDiff = diff;
        closestPoint = point;
      }
    }

    const rawSpeed = parseFloat(closestPoint.speed) || 0;
    const speed = convertSpeed(Math.abs(rawSpeed));
    speedData.push(Math.max(0, speed));
  }

  console.log('速度图表数据:', {
    categories: speedCategories.length,
    data: speedData.length,
    sampleData: speedData.slice(0, 5),
    min: Math.min(...speedData),
    max: Math.max(...speedData),
    hasNegative: speedData.some(v => v < 0)
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

  // 先计算每个轨迹点的累计距离
  const pointsWithDistance = [];
  let accumulatedDistance = 0;

  for (let i = 0; i < points.length; i++) {
    if (i > 0) {
      const distance = calculateDistance(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude
      );
      accumulatedDistance += Math.max(0, distance);
    }
    pointsWithDistance.push({
      ...points[i],
      distanceKm: accumulatedDistance / 1000
    });
  }

  const totalDistanceKm = accumulatedDistance / 1000;
  const totalDistanceConverted = convertDistance(totalDistanceKm);

  // 智能计算距离刻度间隔，确保生成5个刻度
  // 将总距离除以4（5个刻度有4个间隔）
  const rawInterval = totalDistanceConverted / 4;

  // 将间隔向上取整到整洁的数值
  let distanceInterval;
  if (rawInterval <= 0.5) {
    distanceInterval = 0.5;
  } else if (rawInterval <= 1) {
    distanceInterval = 1;
  } else if (rawInterval <= 2) {
    distanceInterval = 2;
  } else if (rawInterval <= 5) {
    distanceInterval = 5;
  } else if (rawInterval <= 10) {
    distanceInterval = 10;
  } else if (rawInterval <= 20) {
    distanceInterval = 20;
  } else {
    distanceInterval = Math.ceil(rawInterval / 10) * 10; // 向上取整到10的倍数
  }

  // 生成5个刻度距离点
  const distanceTicks = [];
  for (let i = 0; i < 5; i++) {
    distanceTicks.push(i * distanceInterval);
  }

  console.log('距离刻度计算:', {
    totalDistance: totalDistanceConverted.toFixed(2),
    rawInterval: rawInterval.toFixed(2),
    interval: distanceInterval,
    ticks: distanceTicks
  });

  // 为每个刻度点插值海拔数据
  for (const tickDistance of distanceTicks) {
    // 将刻度距离转换回公里（因为可能是英里）
    const tickDistanceKm = distanceUnit.value === 'mi' ? tickDistance * 1.60934 : tickDistance;

    // 智能格式化距离显示：整数显示为整数，小数显示一位
    const displayDistance = tickDistance % 1 === 0 ? tickDistance.toFixed(0) : tickDistance.toFixed(1);
    altitudeCategories.push(displayDistance);

    // 查找最接近该距离的轨迹点
    let closestPoint = pointsWithDistance[0];
    let minDiff = Math.abs(pointsWithDistance[0].distanceKm - tickDistanceKm);

    for (const point of pointsWithDistance) {
      const diff = Math.abs(point.distanceKm - tickDistanceKm);
      if (diff < minDiff) {
        minDiff = diff;
        closestPoint = point;
      }
    }

    const rawAltitude = parseFloat(closestPoint.altitude) || 0;
    const altitude = convertAltitude(Math.max(0, rawAltitude));
    altitudeData.push(Math.max(0, altitude));
  }

  console.log('海拔图表数据:', {
    categories: altitudeCategories.length,
    data: altitudeData.length,
    sampleData: altitudeData.slice(0, 5),
    min: Math.min(...altitudeData),
    max: Math.max(...altitudeData),
    hasNegative: altitudeData.some(v => v < 0)
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
  padding: 16rpx 10rpx 4rpx 16rpx; // 上右下左：上16rpx，右10rpx，下4rpx，左16rpx
  margin-bottom: 32rpx;
  box-shadow: var(--shadow-sm);

  .chart-title {
    font-size: 26rpx; // 从 28rpx 减小到 26rpx，节省空间
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12rpx; // 标题与图表间距，增加防止遮挡
  }

  .chart-wrapper {
    height: 500rpx; // 从 650rpx 减小到 500rpx，缩小整体比例
  }

  .chart-placeholder {
    height: 500rpx;
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
