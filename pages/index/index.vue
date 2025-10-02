<template>
  <view class="index-page" :class="themeClass">
    <!-- 顶部标题 -->
    <view class="header-card">
      <view class="app-title">CycloSafe</view>
      <view class="app-subtitle">骑行安全，尽在掌握</view>
    </view>

    <!-- 开始骑行按钮 -->
    <view class="quick-start">
      <button class="start-btn" @click="startRiding" hover-class="start-btn-hover">
        <m-icon name="directions_bike" :size="48" color="#3B82F6" />
        <text class="btn-text">开始骑行</text>
      </button>
    </view>

    <!-- 功能卡片 -->
    <view class="feature-cards">
      <view class="feature-card glass-card" @click="goToHistory" hover-class="card-hover">
        <m-icon name="history" :size="60" color="#ffffff" />
        <view class="card-title">历史记录</view>
        <view class="card-desc">查看骑行数据</view>
      </view>

      <view class="feature-card glass-card" @click="goToSettings" hover-class="card-hover">
        <m-icon name="settings" :size="60" color="#ffffff" />
        <view class="card-title">设置</view>
        <view class="card-desc">个性化配置</view>
      </view>
    </view>

    <!-- 统计信息 -->
    <view class="stats-section glass-card">
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
import { useThemeStore } from '@/store/theme';

export default {
  data() {
    return {
      totalRides: 0,
      totalDistance: '0.0',
      totalTime: '0:00:00',
      themeClass: 'theme-light'
    };
  },
  onLoad() {
    this.initTheme();
    this.loadStats();
  },
  onShow() {
    this.loadStats();
    this.updateTheme();
  },
  onUnload() {
    // 移除主题变化监听
    uni.$off('themeChange', this.handleThemeChange);
  },
  methods: {
    // 初始化主题
    initTheme() {
      const themeStore = useThemeStore();
      this.themeClass = themeStore.isDark ? 'theme-dark' : 'theme-light';

      // 监听主题变化
      uni.$on('themeChange', this.handleThemeChange);
    },

    // 处理主题变化
    handleThemeChange(data) {
      this.themeClass = data.isDark ? 'theme-dark' : 'theme-light';
    },

    // 更新主题
    updateTheme() {
      const themeStore = useThemeStore();
      this.themeClass = themeStore.isDark ? 'theme-dark' : 'theme-light';
    },

    // 开始骑行
    async startRiding() {
      // 检查位置权限
      try {
        const hasPermission = await this.checkLocationPermission();
        if (!hasPermission) {
          uni.showModal({
            title: '需要位置权限',
            content: '骑行功能需要获取您的位置信息，请在设置中允许位置权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                uni.openSetting();
              }
            }
          });
          return;
        }

        // 跳转到骑行页面
        uni.navigateTo({
          url: '/pages/riding/riding'
        });
      } catch (err) {
        console.error('开始骑行失败:', err);
        uni.showToast({
          title: '启动失败',
          icon: 'none'
        });
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
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.index-page {
  min-height: 100vh;
  padding: 80rpx 40rpx 40rpx;
  background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
  position: relative;

  // 暗黑模式下的背景
  &.theme-dark {
    background: linear-gradient(135deg, #1E3A8A 0%, #1E293B 100%);
  }
}

/* 顶部标题 */
.header-card {
  text-align: center;
  color: #ffffff;
  margin-bottom: 60rpx;

  .app-title {
    font-size: 96rpx;
    font-weight: 700;
    margin-bottom: 16rpx;
    letter-spacing: 2rpx;
  }

  .app-subtitle {
    font-size: 32rpx;
    font-weight: 400;
    opacity: 0.9;
  }
}

/* 开始骑行按钮 */
.quick-start {
  margin-bottom: 48rpx;

  .start-btn {
    background: #ffffff;
    color: #3B82F6;
    border-radius: 80rpx;
    padding: 40rpx 60rpx;
    font-size: 40rpx;
    font-weight: 600;
    @include flex-center;
    gap: 20rpx;
    box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.2);
    border: none;
    transition: all 0.3s ease;

    &::after {
      border: none;
    }

    .btn-text {
      color: #3B82F6;
    }
  }

  .start-btn-hover {
    transform: scale(0.98);
    opacity: 0.9;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
  }
}

/* 功能卡片 */
.feature-cards {
  display: flex;
  gap: 24rpx;
  margin-bottom: 48rpx;

  .feature-card {
    flex: 1;
    padding: 48rpx 24rpx;
    text-align: center;
    color: #ffffff;
    border-radius: var(--radius-lg);
    transition: all 0.3s ease;

    .card-title {
      font-size: 32rpx;
      font-weight: 600;
      margin-top: 20rpx;
      margin-bottom: 8rpx;
    }

    .card-desc {
      font-size: 24rpx;
      opacity: 0.85;
    }
  }

  .card-hover {
    transform: translateY(-4rpx);
    opacity: 0.95;
  }
}

/* 玻璃态卡片效果 */
.glass-card {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

.theme-dark .glass-card {
  background: rgba(31, 41, 55, 0.4);
  border: 1rpx solid rgba(75, 85, 99, 0.3);
}

/* 统计信息 */
.stats-section {
  padding: 40rpx;
  color: #ffffff;
  border-radius: var(--radius-lg);

  .stats-title {
    font-size: 36rpx;
    font-weight: 600;
    margin-bottom: 32rpx;
  }

  .stats-grid {
    display: flex;
    justify-content: space-around;

    .stat-item {
      text-align: center;

      .stat-value {
        font-size: 56rpx;
        font-weight: 700;
        margin-bottom: 8rpx;
        color: #ffffff;
      }

      .stat-label {
        font-size: 24rpx;
        opacity: 0.85;
      }
    }
  }
}
</style>
