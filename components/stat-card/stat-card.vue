<template>
  <view class="stat-card" :class="{ 'glass-effect': glass }">
    <view v-if="icon" class="stat-icon">
      <uni-icons :type="icon" :size="iconSize" :color="iconColor"></uni-icons>
    </view>
    <view class="stat-content">
      <text class="stat-label">{{ label }}</text>
      <text class="stat-value">{{ value }}</text>
      <text v-if="unit" class="stat-unit">{{ unit }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  unit: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  iconSize: {
    type: Number,
    default: 24
  },
  iconColor: {
    type: String,
    default: '#3B82F6'
  },
  glass: {
    type: Boolean,
    default: false
  }
});
</script>

<style lang="scss" scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 28rpx 20rpx;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 16rpx;
  border: 1rpx solid rgba(59, 130, 246, 0.12);
  transition: all 0.3s ease;

  &.glass-effect {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1rpx solid rgba(255, 255, 255, 0.2);
  }

  .stat-icon {
    margin-bottom: 4rpx;
  }

  .stat-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
  }

  .stat-label {
    font-size: 24rpx;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .stat-value {
    font-size: 40rpx;
    font-weight: 700;
    color: var(--text-primary);
  }

  .stat-unit {
    font-size: 22rpx;
    color: var(--text-secondary);
    margin-left: 4rpx;
  }
}

.theme-dark .stat-card {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.2);

  &.glass-effect {
    background: rgba(31, 41, 55, 0.5);
    border-color: rgba(75, 85, 99, 0.3);
  }
}
</style>
