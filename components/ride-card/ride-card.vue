<template>
  <view class="ride-card glass-card" hover-class="ride-card-hover" @click="handleClick">
    <view class="card-header">
      <view class="date-info">
        <text class="date">{{ formatDate(record.startTime) }}</text>
        <text class="time">{{ formatTime(record.startTime) }}</text>
      </view>
      <uni-icons type="forward" size="20" :color="iconColor"></uni-icons>
    </view>

    <view class="card-stats">
      <view class="stat-item">
        <uni-icons type="location-filled" size="16" color="#3B82F6"></uni-icons>
        <text class="stat-value">{{ convertDistance(record.distance).toFixed(2) }}</text>
        <text class="stat-unit">{{ distanceUnit }}</text>
      </view>
      <view class="stat-item">
        <uni-icons type="clock" size="16" color="#10B981"></uni-icons>
        <text class="stat-value">{{ formatDuration(record.duration) }}</text>
      </view>
      <view class="stat-item">
        <uni-icons type="forward" size="16" color="#F59E0B"></uni-icons>
        <text class="stat-value">{{ convertSpeed(record.avgSpeed).toFixed(1) }}</text>
        <text class="stat-unit">{{ speedUnit }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { useThemeStore } from '@/store/theme';
import { useUnits } from '@/composables/useUnits.js';

const props = defineProps({
  record: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['click']);

const themeStore = useThemeStore();
const iconColor = computed(() => themeStore.isDark ? '#9CA3AF' : '#6B7280');

// 单位管理
const { distanceUnit, speedUnit, convertDistance, convertSpeed } = useUnits();

const handleClick = () => {
  emit('click', props.record.id);
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}:${String(mins).padStart(2, '0')}`;
};
</script>

<style lang="scss" scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 16rpx;
}

.theme-dark .glass-card {
  background: rgba(31, 41, 55, 0.4);
  border: 1rpx solid rgba(75, 85, 99, 0.3);
}

.ride-card {
  padding: 32rpx;
  transition: all 0.3s ease;

  .card-header {
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

    .date {
      font-size: 32rpx;
      font-weight: 700;
      color: #ffffff;
    }

    .time {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }
  }

  .card-stats {
    display: flex;
    justify-content: space-around;
    gap: 16rpx;

    .stat-item {
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

.ride-card-hover {
  transform: translateY(-4rpx);
  opacity: 0.95;
}

.theme-dark {
  .ride-card {
    .card-header {
      border-bottom-color: rgba(75, 85, 99, 0.4);

      .date {
        color: #F9FAFB;
      }

      .time {
        color: rgba(249, 250, 251, 0.6);
      }
    }

    .card-stats .stat-item {
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
