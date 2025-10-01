<template>
  <view class="index-page">
    <!-- 顶部卡片 -->
    <view class="header-card">
      <view class="app-title">CycloSafe</view>
      <view class="app-subtitle">骑行安全码表</view>
      <view class="app-desc">专业码表 · 智能检测 · 安全保障</view>
    </view>

    <!-- 快速开始 -->
    <view class="quick-start">
      <button class="start-btn" @click="startRiding">
        <text class="btn-icon">🚴</text>
        <text class="btn-text">开始骑行</text>
      </button>
    </view>

    <!-- 功能卡片 -->
    <view class="feature-cards">
      <view class="feature-card" @click="goToHistory">
        <view class="card-icon">📊</view>
        <view class="card-title">历史记录</view>
        <view class="card-desc">查看骑行数据</view>
      </view>

      <view class="feature-card" @click="goToSettings">
        <view class="card-icon">⚙️</view>
        <view class="card-title">设置</view>
        <view class="card-desc">个性化配置</view>
      </view>
    </view>

    <!-- 统计信息 -->
    <view class="stats-section">
      <view class="stats-title">我的统计</view>
      <view class="stats-grid">
        <view class="stat-item">
          <view class="stat-value">{{ totalRides }}</view>
          <view class="stat-label">总次数</view>
        </view>
        <view class="stat-item">
          <view class="stat-value">{{ totalDistance }}</view>
          <view class="stat-label">总里程(km)</view>
        </view>
        <view class="stat-item">
          <view class="stat-value">{{ totalTime }}</view>
          <view class="stat-label">总时长</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      totalRides: 0,
      totalDistance: '0.0',
      totalTime: '0:00:00'
    };
  },
  onLoad() {
    this.loadStats();
  },
  onShow() {
    this.loadStats();
  },
  methods: {
    // 开始骑行
    async startRiding() {
      // 检查位置权限
      try {
        const hasPermission = await this.checkLocationPermission();
        if (!hasPermission) {
          uni.showToast({
            title: '需要位置权限',
            icon: 'none'
          });
          return;
        }

        // 跳转到骑行页面
        uni.navigateTo({
          url: '/pages/riding/riding'
        });
      } catch (err) {
        console.error('开始骑行失败:', err);
      }
    },

    // 检查位置权限
    checkLocationPermission() {
      return new Promise((resolve) => {
        uni.getSetting({
          success: (res) => {
            if (res.authSetting['scope.userLocation']) {
              resolve(true);
            } else {
              // 请求权限
              uni.authorize({
                scope: 'scope.userLocation',
                success: () => resolve(true),
                fail: () => resolve(false)
              });
            }
          },
          fail: () => resolve(false)
        });
      });
    },

    // 跳转到历史记录
    goToHistory() {
      uni.switchTab({
        url: '/pages/history/history'
      });
    },

    // 跳转到设置
    goToSettings() {
      uni.switchTab({
        url: '/pages/settings/settings'
      });
    },

    // 加载统计数据
    loadStats() {
      try {
        const recordList = uni.getStorageSync('riding_list') || '[]';
        const records = JSON.parse(recordList);

        this.totalRides = records.length;

        let distance = 0;
        let duration = 0;

        records.forEach(id => {
          const record = uni.getStorageSync(`riding_${id}`);
          if (record) {
            const data = JSON.parse(record);
            distance += data.distance || 0;
            duration += data.duration || 0;
          }
        });

        this.totalDistance = distance.toFixed(1);
        this.totalTime = this.formatDuration(duration);
      } catch (err) {
        console.error('加载统计数据失败:', err);
      }
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
.index-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
}

.header-card {
  text-align: center;
  color: white;
  margin-bottom: 60rpx;
  padding-top: 80rpx;

  .app-title {
    font-size: 72rpx;
    font-weight: bold;
    margin-bottom: 20rpx;
  }

  .app-subtitle {
    font-size: 36rpx;
    margin-bottom: 16rpx;
    opacity: 0.9;
  }

  .app-desc {
    font-size: 28rpx;
    opacity: 0.7;
  }
}

.quick-start {
  margin-bottom: 60rpx;

  .start-btn {
    background: white;
    color: #667eea;
    border-radius: 60rpx;
    padding: 40rpx;
    font-size: 36rpx;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);

    .btn-icon {
      font-size: 48rpx;
      margin-right: 20rpx;
    }
  }
}

.feature-cards {
  display: flex;
  gap: 24rpx;
  margin-bottom: 60rpx;

  .feature-card {
    flex: 1;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 24rpx;
    padding: 40rpx 20rpx;
    text-align: center;
    color: white;

    .card-icon {
      font-size: 64rpx;
      margin-bottom: 16rpx;
    }

    .card-title {
      font-size: 32rpx;
      font-weight: bold;
      margin-bottom: 8rpx;
    }

    .card-desc {
      font-size: 24rpx;
      opacity: 0.8;
    }
  }
}

.stats-section {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 24rpx;
  padding: 40rpx;
  color: white;

  .stats-title {
    font-size: 32rpx;
    font-weight: bold;
    margin-bottom: 30rpx;
  }

  .stats-grid {
    display: flex;
    justify-content: space-around;

    .stat-item {
      text-align: center;

      .stat-value {
        font-size: 48rpx;
        font-weight: bold;
        margin-bottom: 8rpx;
      }

      .stat-label {
        font-size: 24rpx;
        opacity: 0.8;
      }
    }
  }
}
</style>
