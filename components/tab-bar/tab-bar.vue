<template>
  <view class="tab-bar" :class="themeClass">
    <view
      v-for="(item, index) in items"
      :key="index"
      class="tab-item"
      :class="{ 'active': current === index }"
      @click="onChange(index)"
    >
      <m-icon
        :name="item.icon"
        :size="24"
        :class="current === index ? 'icon-active' : 'icon-inactive'"
      ></m-icon>
      <text class="tab-label" :class="{ 'active': current === index }">
        {{ item.text }}
      </text>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import { useThemeStore } from '@/store/theme';

// 主题
const themeStore = useThemeStore();
const themeClass = computed(() => themeStore.isDark ? 'theme-dark' : 'theme-light');

const props = defineProps({
  current: {
    type: Number,
    default: 0
  },
  items: {
    type: Array,
    default: () => [
      { icon: 'home', text: '首页', path: '/pages/index/index' },
      { icon: 'history', text: '记录', path: '/pages/history/history' },
      { icon: 'settings', text: '设置', path: '/pages/settings/settings' }
    ]
  }
});

const emit = defineEmits(['change']);

const onChange = (index) => {
  if (index !== props.current) {
    emit('change', index);
    const item = props.items[index];
    if (item.path) {
      uni.redirectTo({
        url: item.path
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 128rpx;
  background: var(--card-background);
  border-top: 1rpx solid var(--border-color);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -2rpx 16rpx rgba(0, 0, 0, 0.04);
  z-index: 999;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  transition: all 0.3s ease;

  .icon-active {
    color: var(--primary-color);
  }

  .icon-inactive {
    color: var(--text-secondary);
  }

  .tab-label {
    font-size: 24rpx;
    color: var(--text-secondary);
    transition: all 0.3s ease;

    &.active {
      color: var(--primary-color);
      font-weight: 500;
    }
  }
}
</style>
