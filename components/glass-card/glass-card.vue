<template>
  <view class="glass-card" :class="themeClass">
    <slot></slot>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { useThemeStore } from '@/store/theme';

const themeStore = useThemeStore();
const themeClass = computed(() => themeStore.isDark ? 'theme-dark' : 'theme-light');
</script>

<style lang="scss" scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 16rpx;
  overflow: hidden;

  &.theme-dark {
    background: rgba(31, 41, 55, 0.4);
    border: 1rpx solid rgba(75, 85, 99, 0.3);
  }
}
</style>
