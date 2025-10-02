<template>
  <view class="analysis-page" :class="themeClass">
    <view v-if="!recordData" class="loading">
      <text>加载中...</text>
    </view>

    <view v-else class="content">
      <!-- 基础数据卡片 -->
      <view class="data-card glass-card">
        <view class="card-header">
          <view>
            <text class="title">骑行报告</text>
            <text class="date">{{ formatDate(recordData.startTime) }}</text>
          </view>
        </view>

        <view class="stats-grid">
          <view class="stat-item">
            <uni-icons type="location-filled" size="24" color="#3B82F6"></uni-icons>
            <text class="stat-label">距离</text>
            <text class="stat-value">{{ recordData.distance.toFixed(2) }}</text>
            <text class="stat-unit">km</text>
          </view>
          <view class="stat-item">
            <uni-icons type="clock" size="24" color="#10B981"></uni-icons>
            <text class="stat-label">时长</text>
            <text class="stat-value">{{ formatDuration(recordData.duration) }}</text>
          </view>
          <view class="stat-item">
            <uni-icons type="forward" size="24" color="#3B82F6"></uni-icons>
            <text class="stat-label">平均速度</text>
            <text class="stat-value">{{ recordData.avgSpeed.toFixed(1) }}</text>
            <text class="stat-unit">km/h</text>
          </view>
          <view class="stat-item">
            <uni-icons type="forward" size="24" color="#EF4444"></uni-icons>
            <text class="stat-label">最高速度</text>
            <text class="stat-value">{{ recordData.maxSpeed.toFixed(1) }}</text>
            <text class="stat-unit">km/h</text>
          </view>
          <view class="stat-item">
            <uni-icons type="upload" size="24" color="#F59E0B"></uni-icons>
            <text class="stat-label">爬升</text>
            <text class="stat-value">{{ recordData.totalAscent.toFixed(0) }}</text>
            <text class="stat-unit">m</text>
          </view>
        </view>
      </view>

      <!-- 地图轨迹 -->
      <view class="map-card glass-card">
        <view class="card-title">
          <uni-icons type="map-filled" size="20" :color="iconColor"></uni-icons>
          <text>骑行轨迹</text>
        </view>
        <map
          v-if="mapCenter.latitude"
          :longitude="mapCenter.longitude"
          :latitude="mapCenter.latitude"
          :scale="14"
          :polyline="polyline"
          :markers="markers"
          style="width: 100%; height: 450rpx; border-radius: 12rpx;"
        />
      </view>

      <!-- 操作按钮 -->
      <view class="actions">
        <button class="action-btn export-btn" @click="exportGPX">
          <uni-icons type="download" size="20" color="#ffffff"></uni-icons>
          <text>导出GPX</text>
        </button>
        <button class="action-btn danger-btn" @click="deleteRecord">
          <uni-icons type="trash" size="20" color="#ffffff"></uni-icons>
          <text>删除记录</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';

// 主题
const themeStore = useThemeStore();
const themeClass = computed(() => themeStore.isDark ? 'theme-dark' : 'theme-light');
const iconColor = computed(() => themeStore.isDark ? '#9CA3AF' : '#6B7280');

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

// 生成GPX
const generateGPX = (record) => {
  const { trackPoints, startTime } = record;

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="CycloSafe">
  <metadata>
    <name>骑行记录 ${formatDate(startTime)}</name>
    <time>${new Date(startTime).toISOString()}</time>
  </metadata>
  <trk>
    <name>CycloSafe Riding</name>
    <trkseg>`;

  trackPoints.forEach(point => {
    gpx += `
      <trkpt lat="${point.latitude}" lon="${point.longitude}">
        <ele>${point.altitude}</ele>
        <time>${new Date(point.timestamp).toISOString()}</time>
      </trkpt>`;
  });

  gpx += `
    </trkseg>
  </trk>
</gpx>`;

  return gpx;
};

// 导出GPX
const exportGPX = () => {
  if (!recordData.value) return;

  const gpx = generateGPX(recordData.value);
  uni.setClipboardData({
    data: gpx,
    success: () => {
      uni.showToast({
        title: 'GPX已复制到剪贴板',
        icon: 'success',
        duration: 2000
      });
    }
  });
};

// 执行删除
const performDelete = () => {
  try {
    // 删除记录
    uni.removeStorageSync(`riding_${recordId.value}`);

    // 更新列表
    const list = uni.getStorageSync('riding_list') || '[]';
    const ids = JSON.parse(list);
    const newIds = ids.filter(id => id !== recordId.value);
    uni.setStorageSync('riding_list', JSON.stringify(newIds));

    uni.showToast({
      title: '删除成功',
      icon: 'success'
    });

    // 返回上一页
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (err) {
    console.error('删除失败:', err);
    uni.showToast({
      title: '删除失败',
      icon: 'none'
    });
  }
};

// 删除记录
const deleteRecord = () => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条骑行记录吗？',
    confirmColor: '#EF4444',
    success: (res) => {
      if (res.confirm) {
        performDelete();
      }
    }
  });
};

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.analysis-page {
  min-height: 100vh;
  padding: 40rpx 30rpx 120rpx;
  background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);

  &.theme-dark {
    background: linear-gradient(135deg, #1E3A8A 0%, #1E293B 100%);
  }
}

.loading {
  padding: 200rpx 0;
  text-align: center;
  font-size: 36rpx;
  color: #ffffff;
  font-weight: 600;
}

.glass-card {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-lg);
}

.theme-dark .glass-card {
  background: rgba(31, 41, 55, 0.4);
  border: 1rpx solid rgba(75, 85, 99, 0.3);
}

.content {
  .data-card {
    padding: 40rpx;
    margin-bottom: 32rpx;

    .card-header {
      margin-bottom: 32rpx;
      padding-bottom: 24rpx;
      border-bottom: 1rpx solid rgba(255, 255, 255, 0.2);

      .title {
        display: block;
        font-size: 40rpx;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 8rpx;
      }

      .date {
        display: block;
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24rpx;

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8rpx;
        padding: 28rpx 20rpx;
        background: rgba(255, 255, 255, 0.15);
        border-radius: var(--radius-md);
        border: 1rpx solid rgba(255, 255, 255, 0.2);

        .stat-label {
          font-size: 24rpx;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .stat-value {
          font-size: 40rpx;
          font-weight: 700;
          color: #ffffff;
        }

        .stat-unit {
          font-size: 22rpx;
          color: rgba(255, 255, 255, 0.7);
        }
      }
    }
  }

  .map-card {
    padding: 32rpx;
    margin-bottom: 32rpx;

    .card-title {
      display: flex;
      align-items: center;
      gap: 12rpx;
      font-size: 32rpx;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 24rpx;
    }
  }

  .actions {
    display: flex;
    gap: 24rpx;

    .action-btn {
      flex: 1;
      height: 100rpx;
      border-radius: 50rpx;
      font-size: 32rpx;
      font-weight: 600;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12rpx;
      transition: all 0.3s ease;

      &::after {
        border: none;
      }

      &.export-btn {
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        color: white;
        box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.3);
      }

      &.danger-btn {
        background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
        color: white;
        box-shadow: 0 8rpx 20rpx rgba(239, 68, 68, 0.3);
      }
    }
  }
}

.theme-dark {
  .content {
    .data-card {
      .card-header {
        border-bottom-color: rgba(75, 85, 99, 0.4);

        .title {
          color: #F9FAFB;
        }

        .date {
          color: rgba(249, 250, 251, 0.6);
        }
      }

      .stats-grid .stat-item {
        background: rgba(31, 41, 55, 0.5);
        border-color: rgba(75, 85, 99, 0.3);

        .stat-label {
          color: rgba(249, 250, 251, 0.7);
        }

        .stat-value {
          color: #F9FAFB;
        }

        .stat-unit {
          color: rgba(249, 250, 251, 0.6);
        }
      }
    }

    .map-card .card-title {
      color: #F9FAFB;
    }
  }
}
</style>
