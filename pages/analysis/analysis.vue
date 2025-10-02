<template>
  <view class="analysis-page">
    <view v-if="!recordData" class="loading">
      <text>加载中...</text>
    </view>

    <view v-else class="content">
      <!-- 基础数据卡片 -->
      <view class="data-card">
        <view class="card-header">
          <text class="title">骑行报告</text>
          <text class="date">{{ formatDate(recordData.startTime) }}</text>
        </view>

        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-label">距离</text>
            <text class="stat-value">{{ recordData.distance.toFixed(2) }} km</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">时长</text>
            <text class="stat-value">{{ formatDuration(recordData.duration) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">平均速度</text>
            <text class="stat-value">{{ recordData.avgSpeed.toFixed(1) }} km/h</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">最高速度</text>
            <text class="stat-value">{{ recordData.maxSpeed.toFixed(1) }} km/h</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">爬升</text>
            <text class="stat-value">{{ recordData.totalAscent.toFixed(0) }} m</text>
          </view>
        </view>
      </view>

      <!-- 地图轨迹 -->
      <view class="map-card">
        <view class="card-title">骑行轨迹</view>
        <map
          v-if="mapCenter.latitude"
          :longitude="mapCenter.longitude"
          :latitude="mapCenter.latitude"
          :scale="14"
          :polyline="polyline"
          :markers="markers"
          style="width: 100%; height: 400rpx; border-radius: 12rpx;"
        />
      </view>

      <!-- 操作按钮 -->
      <view class="actions">
        <button class="action-btn" @click="exportGPX">
          导出GPX
        </button>
        <button class="action-btn danger" @click="deleteRecord">
          删除记录
        </button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      recordId: '',
      recordData: null,
      mapCenter: {
        latitude: 0,
        longitude: 0
      },
      polyline: [],
      markers: []
    };
  },
  onLoad(options) {
    if (options.latest === 'true') {
      // 加载最新记录
      this.loadLatestRecord();
    } else if (options.id) {
      // 加载指定记录
      this.recordId = options.id;
      this.loadRecord(options.id);
    }
  },
  methods: {
    // 加载最新记录
    loadLatestRecord() {
      try {
        const list = uni.getStorageSync('riding_list') || '[]';
        const ids = JSON.parse(list);

        if (ids.length > 0) {
          this.recordId = ids[0];
          this.loadRecord(ids[0]);
        }
      } catch (err) {
        console.error('加载记录失败:', err);
      }
    },

    // 加载记录
    loadRecord(id) {
      try {
        const data = uni.getStorageSync(`riding_${id}`);
        if (data) {
          this.recordData = JSON.parse(data);
          this.initMap();
        }
      } catch (err) {
        console.error('加载记录失败:', err);
      }
    },

    // 初始化地图
    initMap() {
      if (!this.recordData || !this.recordData.trackPoints || this.recordData.trackPoints.length === 0) {
        return;
      }

      const points = this.recordData.trackPoints;

      // 计算中心点
      if (points.length > 0) {
        const mid = Math.floor(points.length / 2);
        this.mapCenter = {
          latitude: points[mid].latitude,
          longitude: points[mid].longitude
        };
      }

      // 绘制轨迹
      this.polyline = [{
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
        this.markers = [
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
    },

    // 导出GPX
    exportGPX() {
      if (!this.recordData) return;

      const gpx = this.generateGPX(this.recordData);
      uni.setClipboardData({
        data: gpx,
        success: () => {
          uni.showToast({
            title: 'GPX已复制到剪贴板',
            icon: 'success'
          });
        }
      });
    },

    // 生成GPX
    generateGPX(record) {
      const { trackPoints, startTime } = record;

      let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="CycloSafe">
  <metadata>
    <name>骑行记录 ${this.formatDate(startTime)}</name>
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
    },

    // 删除记录
    deleteRecord() {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条骑行记录吗？',
        success: (res) => {
          if (res.confirm) {
            this.performDelete();
          }
        }
      });
    },

    // 执行删除
    performDelete() {
      try {
        // 删除记录
        uni.removeStorageSync(`riding_${this.recordId}`);

        // 更新列表
        const list = uni.getStorageSync('riding_list') || '[]';
        const ids = JSON.parse(list);
        const newIds = ids.filter(id => id !== this.recordId);
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
    },

    // 格式化日期
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    // 格式化时长
    formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }
};
</script>

<style lang="scss" scoped>
.analysis-page {
  min-height: 100vh;
  background: #F5F5F5;
  padding: 20rpx;
}

.loading {
  padding: 200rpx 0;
  text-align: center;
  font-size: 32rpx;
  color: #6B7280;
}

.content {
  .data-card {
    background: white;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30rpx;
      padding-bottom: 20rpx;
      border-bottom: 1rpx solid #E5E7EB;

      .title {
        font-size: 36rpx;
        font-weight: bold;
        color: #1F2937;
      }

      .date {
        font-size: 24rpx;
        color: #6B7280;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24rpx;

      .stat-item {
        text-align: center;
        padding: 24rpx;
        background: #F9FAFB;
        border-radius: 12rpx;

        .stat-label {
          display: block;
          font-size: 24rpx;
          color: #6B7280;
          margin-bottom: 8rpx;
        }

        .stat-value {
          display: block;
          font-size: 32rpx;
          font-weight: bold;
          color: #3B82F6;
        }
      }
    }
  }

  .map-card {
    background: white;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;

    .card-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #1F2937;
      margin-bottom: 20rpx;
    }
  }

  .actions {
    display: flex;
    gap: 20rpx;

    .action-btn {
      flex: 1;
      height: 88rpx;
      background: #3B82F6;
      color: white;
      border-radius: 12rpx;
      font-size: 32rpx;
      border: none;

      &.danger {
        background: #EF4444;
      }
    }
  }
}
</style>
