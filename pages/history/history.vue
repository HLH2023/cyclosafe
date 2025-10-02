<template>
  <view class="history-page" :class="themeClass">
    <view v-if="recordList.length === 0" class="empty-state">
      <uni-icons type="folder" size="80" color="#9CA3AF"></uni-icons>
      <text class="empty-text">暂无骑行记录</text>
      <text class="empty-hint">点击首页"开始骑行"创建记录</text>
    </view>

    <view v-else class="record-list">
      <view
        v-for="record in recordList"
        :key="record.id"
        class="record-item glass-card"
        hover-class="record-item-hover"
        @click="viewDetail(record.id)"
      >
        <view class="record-header">
          <view class="date-info">
            <text class="record-date">{{ formatDate(record.startTime) }}</text>
            <text class="record-time">{{ formatTime(record.startTime) }}</text>
          </view>
          <uni-icons type="forward" size="20" :color="iconColor"></uni-icons>
        </view>
        <view class="record-stats">
          <view class="stat">
            <uni-icons type="location-filled" size="16" color="#3B82F6"></uni-icons>
            <text class="stat-value">{{ record.distance.toFixed(2) }}</text>
            <text class="stat-unit">km</text>
          </view>
          <view class="stat">
            <uni-icons type="clock" size="16" color="#10B981"></uni-icons>
            <text class="stat-value">{{ formatDuration(record.duration) }}</text>
          </view>
          <view class="stat">
            <uni-icons type="forward" size="16" color="#F59E0B"></uni-icons>
            <text class="stat-value">{{ record.avgSpeed.toFixed(1) }}</text>
            <text class="stat-unit">km/h</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';

// 主题
const themeStore = useThemeStore();
const themeClass = computed(() => themeStore.isDark ? 'theme-dark' : 'theme-light');
const iconColor = computed(() => themeStore.isDark ? '#9CA3AF' : '#6B7280');

// 状态
const recordList = ref([]);

// 加载记录
const loadRecords = () => {
  try {
    const list = uni.getStorageSync('riding_list') || '[]';
    const ids = JSON.parse(list);

    recordList.value = ids.map(id => {
      const data = uni.getStorageSync(`riding_${id}`);
      return data ? JSON.parse(data) : null;
    }).filter(item => item !== null);
  } catch (err) {
    console.error('加载记录失败:', err);
  }
};

// 查看详情
const viewDetail = (id) => {
  uni.navigateTo({
    url: `/pages/analysis/analysis?id=${id}`
  });
};

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 格式化时长
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}:${String(mins).padStart(2, '0')}`;
};

// 生命周期
onLoad(() => {
  loadRecords();
});

onShow(() => {
  loadRecords();
});

onPullDownRefresh(() => {
  loadRecords();
  uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.history-page {
  min-height: 100vh;
  padding: 40rpx 30rpx 120rpx;
  background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);

  &.theme-dark {
    background: linear-gradient(135deg, #1E3A8A 0%, #1E293B 100%);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 60rpx;
  text-align: center;

  .empty-text {
    font-size: 36rpx;
    color: #ffffff;
    margin: 32rpx 0 16rpx;
    font-weight: 600;
  }

  .empty-hint {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.7);
  }
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
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

.record-item {
  padding: 32rpx;
  transition: all 0.3s ease;

  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.2);

    .date-info {
      display: flex;
      flex-direction: column;
      gap: 8rpx;
    }

    .record-date {
      font-size: 32rpx;
      font-weight: 700;
      color: #ffffff;
    }

    .record-time {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }
  }

  .record-stats {
    display: flex;
    justify-content: space-around;
    gap: 16rpx;

    .stat {
      display: flex;
      align-items: center;
      gap: 8rpx;

      .stat-value {
        font-size: 32rpx;
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

.record-item-hover {
  transform: translateY(-4rpx);
  opacity: 0.95;
}

.theme-dark {
  .record-item {
    .record-header {
      border-bottom-color: rgba(75, 85, 99, 0.4);

      .record-date {
        color: #F9FAFB;
      }

      .record-time {
        color: rgba(249, 250, 251, 0.6);
      }
    }

    .record-stats .stat {
      .stat-value {
        color: #F9FAFB;
      }

      .stat-unit {
        color: rgba(249, 250, 251, 0.6);
      }
    }
  }
}
</style>
