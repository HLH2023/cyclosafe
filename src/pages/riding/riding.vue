<template>
  <view class="riding-page">
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

<script>
export default {
  data() {
    return {
      isRiding: false,
      isPaused: false,
      currentSpeed: 0,
      distance: 0,
      duration: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      altitude: 0,
      totalAscent: 0,
      currentLocation: {
        longitude: 116.404,
        latitude: 39.915
      },
      markers: [],
      polyline: [],
      trackPoints: [],
      startTime: 0,
      timer: null
    };
  },
  computed: {
    formattedDuration() {
      const hours = Math.floor(this.duration / 3600);
      const mins = Math.floor((this.duration % 3600) / 60);
      const secs = this.duration % 60;
      return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  },
  onLoad() {
    console.log('骑行页面加载');
  },
  onUnload() {
    this.cleanup();
  },
  methods: {
    // 开始骑行
    startRiding() {
      console.log('开始骑行');
      this.isRiding = true;
      this.isPaused = false;
      this.startTime = Date.now();

      // 开始定位
      this.startLocationUpdate();

      // 开始计时
      this.startTimer();

      uni.showToast({
        title: '开始骑行',
        icon: 'success'
      });
    },

    // 暂停骑行
    pauseRiding() {
      console.log('暂停骑行');
      this.isPaused = true;

      // 停止定位
      uni.stopLocationUpdate();

      // 停止计时
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }

      uni.showToast({
        title: '已暂停',
        icon: 'none'
      });
    },

    // 继续骑行
    resumeRiding() {
      console.log('继续骑行');
      this.isPaused = false;

      // 恢复定位
      this.startLocationUpdate();

      // 恢复计时
      this.startTimer();

      uni.showToast({
        title: '继续骑行',
        icon: 'success'
      });
    },

    // 结束骑行
    stopRiding() {
      uni.showModal({
        title: '结束骑行',
        content: '确定要结束本次骑行吗？',
        success: (res) => {
          if (res.confirm) {
            this.finishRiding();
          }
        }
      });
    },

    // 完成骑行
    finishRiding() {
      console.log('结束骑行');

      // 停止所有监听
      this.cleanup();

      // 保存数据
      this.saveRidingRecord();

      // 重置状态
      this.isRiding = false;
      this.isPaused = false;

      // 跳转到分析页面
      uni.navigateTo({
        url: '/pages/analysis/analysis?latest=true'
      });
    },

    // 开始定位更新
    startLocationUpdate() {
      uni.startLocationUpdate({
        success: () => {
          uni.onLocationChange((res) => {
            this.handleLocationUpdate(res);
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
    },

    // 处理位置更新
    handleLocationUpdate(location) {
      if (this.isPaused) return;

      console.log('位置更新:', location);

      // 更新当前位置
      this.currentLocation = {
        longitude: location.longitude,
        latitude: location.latitude
      };

      // 更新速度（m/s 转 km/h）
      this.currentSpeed = (location.speed || 0) * 3.6;

      // 更新最高速度
      if (this.currentSpeed > this.maxSpeed) {
        this.maxSpeed = this.currentSpeed;
      }

      // 更新海拔
      this.altitude = location.altitude || 0;

      // 记录轨迹点
      this.trackPoints.push({
        latitude: location.latitude,
        longitude: location.longitude,
        altitude: location.altitude,
        speed: this.currentSpeed,
        timestamp: Date.now()
      });

      // 更新地图轨迹
      this.updateMapPolyline();

      // 计算距离
      this.calculateDistance();
    },

    // 更新地图轨迹
    updateMapPolyline() {
      if (this.trackPoints.length < 2) return;

      this.polyline = [{
        points: this.trackPoints.map(p => ({
          latitude: p.latitude,
          longitude: p.longitude
        })),
        color: '#3B82F6',
        width: 6,
        arrowLine: true
      }];
    },

    // 计算距离
    calculateDistance() {
      if (this.trackPoints.length < 2) return;

      const lastTwo = this.trackPoints.slice(-2);
      const segmentDistance = this.getDistance(
        lastTwo[0].latitude,
        lastTwo[0].longitude,
        lastTwo[1].latitude,
        lastTwo[1].longitude
      );

      this.distance += segmentDistance;

      // 计算平均速度
      if (this.duration > 0) {
        this.avgSpeed = (this.distance / this.duration) * 3600;
      }
    },

    // 计算两点距离（Haversine公式）
    getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // 地球半径（公里）
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;

      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) *
                Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    },

    // 开始计时
    startTimer() {
      this.timer = setInterval(() => {
        this.duration++;
      }, 1000);
    },

    // 保存骑行记录
    saveRidingRecord() {
      const recordId = this.generateUUID();
      const record = {
        id: recordId,
        startTime: this.startTime,
        endTime: Date.now(),
        duration: this.duration,
        distance: this.distance,
        avgSpeed: this.avgSpeed,
        maxSpeed: this.maxSpeed,
        totalAscent: this.totalAscent,
        trackPoints: this.trackPoints
      };

      // 保存记录
      uni.setStorageSync(`riding_${recordId}`, JSON.stringify(record));

      // 更新记录列表
      const list = uni.getStorageSync('riding_list') || '[]';
      const recordList = JSON.parse(list);
      recordList.unshift(recordId);
      uni.setStorageSync('riding_list', JSON.stringify(recordList));

      console.log('骑行记录已保存:', recordId);
    },

    // 生成UUID
    generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },

    // 清理资源
    cleanup() {
      // 停止定位
      uni.stopLocationUpdate();
      uni.offLocationChange();

      // 停止计时
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.riding-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F5F5F5;
}

.speed-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  text-align: center;

  .current-speed {
    color: white;

    .speed-value {
      font-size: 120rpx;
      font-weight: bold;
      line-height: 1.2;
    }

    .speed-unit {
      font-size: 36rpx;
      opacity: 0.8;
      margin-left: 16rpx;
    }
  }
}

.data-section {
  background: white;
  padding: 30rpx;

  .data-row {
    display: flex;
    gap: 20rpx;
    margin-bottom: 20rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .data-item {
      flex: 1;
      padding: 24rpx;
      background: #F9FAFB;
      border-radius: 12rpx;
      text-align: center;

      .data-label {
        display: block;
        font-size: 24rpx;
        color: #6B7280;
        margin-bottom: 8rpx;
      }

      .data-value {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: #1F2937;
      }
    }
  }
}

.map-section {
  flex: 1;
  position: relative;
}

.control-section {
  background: white;
  padding: 30rpx;
  display: flex;
  gap: 20rpx;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.1);

  .control-btn {
    flex: 1;
    height: 100rpx;
    border-radius: 50rpx;
    font-size: 32rpx;
    font-weight: bold;
    border: none;

    &.start-btn {
      background: #10B981;
      color: white;
    }

    &.pause-btn {
      background: #F59E0B;
      color: white;
    }

    &.resume-btn {
      background: #3B82F6;
      color: white;
    }

    &.stop-btn {
      background: #EF4444;
      color: white;
    }
  }
}
</style>
