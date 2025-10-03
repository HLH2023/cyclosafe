<template>
  <view class="index-page">
    <!-- 主内容区 -->
    <view class="main-content">
      <!-- 顶部标题 -->
      <view class="header">
        <text class="app-title">CycloSafe</text>
        <text class="app-subtitle">骑行安全，尽在掌握</text>
      </view>

      <!-- 开始骑行按钮 -->
      <view class="start-section">
        <button class="start-btn" @click="startRiding" hover-class="start-btn-hover">
          <m-icon name="directions_bike" :size="40" color="#FFFFFF"></m-icon>
          <text class="btn-text">开始骑行</text>
        </button>
      </view>

      <!-- 功能卡片 -->
      <view class="feature-cards">
        <view class="feature-card" @click="goToHistory" hover-class="card-hover">
          <m-icon name="history" :size="48" color="#3B82F6"></m-icon>
          <text class="card-title">历史记录</text>
          <text class="card-desc">查看骑行数据</text>
        </view>

        <view class="feature-card" @click="goToDangerPoints" hover-class="card-hover">
          <m-icon name="location_on" :size="48" color="#EF4444"></m-icon>
          <text class="card-title">危险点</text>
          <text class="card-desc">查看与管理</text>
        </view>

        <view class="feature-card" @click="goToSettings" hover-class="card-hover">
          <m-icon name="settings" :size="48" color="#3B82F6"></m-icon>
          <text class="card-title">设置</text>
          <text class="card-desc">个性化配置</text>
        </view>
      </view>

      <!-- 统计信息 -->
      <view class="stats-section">
        <text class="stats-title">我的统计</text>
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-value">{{ totalRides }}</text>
            <text class="stat-label">总次数</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ totalDistance }}</text>
            <text class="stat-label">总里程(km)</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ totalTime }}</text>
            <text class="stat-label">总时长</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部导航栏 -->
    <tab-bar :current="0"></tab-bar>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getRidingRecordRepository } from '@/db/repositories/index.js';

// 状态
const totalRides = ref(0);
const totalDistance = ref('0.0');
const totalTime = ref('0:00:00');

// 检查位置权限
const checkLocationPermission = () => {
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
};

// 开始骑行
const startRiding = async () => {
  try {
    const hasPermission = await checkLocationPermission();
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
};

// 跳转到历史记录
const goToHistory = () => {
  uni.redirectTo({
    url: '/pages/history/history'
  });
};

// 跳转到危险点
const goToDangerPoints = () => {
  uni.navigateTo({
    url: '/pages/danger-points/danger-points'
  });
};

// 跳转到设置
const goToSettings = () => {
  uni.redirectTo({
    url: '/pages/settings/settings'
  });
};

// 格式化时长
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// 加载统计数据
const loadStats = async () => {
  try {
    const ridingRecordRepo = getRidingRecordRepository();
    const records = ridingRecordRepo.getAllRecords();

    totalRides.value = records.length;

    let distance = 0;
    let duration = 0;

    records.forEach(record => {
      distance += record.distance || 0;
      duration += record.duration || 0;
    });

    totalDistance.value = distance.toFixed(1);
    totalTime.value = formatDuration(duration);
  } catch (err) {
    console.error('加载统计数据失败:', err);
  }
};

// 生命周期
onLoad(() => {
  loadStats();
});

onShow(() => {
  loadStats();
});
</script>

<style lang="scss" scoped>
.index-page {
  min-height: 100vh;
  background: #F3F4F6;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 32rpx 48rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部标题 */
.header {
  text-align: center;
  margin: 32rpx 0 64rpx;

  .app-title {
    display: block;
    font-size: 80rpx;
    font-weight: 700;
    color: #3B82F6;
    margin-bottom: 8rpx;
  }

  .app-subtitle {
    display: block;
    font-size: 28rpx;
    color: #6B7280;
  }
}

/* 开始骑行按钮 */
.start-section {
  margin-bottom: 32rpx;

  .start-btn {
    width: 100%;
    background: #3B82F6;
    border-radius: 16rpx;
    padding: 48rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32rpx;
    box-shadow: 0 4rpx 24rpx rgba(59, 130, 246, 0.2);
    transition: all 0.3s ease;

    &::after {
      border: none;
    }

    .btn-text {
      font-size: 48rpx;
      font-weight: 600;
      color: #FFFFFF;
    }
  }

  .start-btn-hover {
    box-shadow: 0 8rpx 32rpx rgba(59, 130, 246, 0.3);
  }
}

/* 功能卡片 */
.feature-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  margin-bottom: 32rpx;

  .feature-card {
    flex: 1 1 calc(33.333% - 16rpx);
    min-width: 180rpx;
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 32rpx 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;

    .card-title {
      display: block;
      font-size: 28rpx;
      font-weight: 600;
      color: #1F2937;
      margin: 16rpx 0 8rpx;
    }

    .card-desc {
      display: block;
      font-size: 22rpx;
      color: #6B7280;
    }
  }

  .card-hover {
    background: #F9FAFB;
    transform: translateY(-4rpx);
  }
}

/* 统计信息 */
.stats-section {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 48rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);

  .stats-title {
    display: block;
    font-size: 36rpx;
    font-weight: 600;
    color: #1F2937;
    margin-bottom: 32rpx;
  }

  .stats-grid {
    display: flex;
    justify-content: space-around;

    .stat-item {
      text-align: center;

      .stat-value {
        display: block;
        font-size: 48rpx;
        font-weight: 700;
        color: #3B82F6;
        margin-bottom: 8rpx;
      }

      .stat-label {
        display: block;
        font-size: 24rpx;
        color: #6B7280;
      }
    }
  }
}
</style>
