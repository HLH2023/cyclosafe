<template>
  <view class="history-page" :class="themeClass">
    <!-- 顶部标题栏 -->
    <view class="header">
      <text class="title">历史记录</text>
    </view>

    <!-- 搜索和筛选 -->
    <view class="search-section">
      <view class="search-box">
        <m-icon name="search" :size="20" color="#6B7280"></m-icon>
        <input
          class="search-input"
          type="text"
          placeholder="搜索日期范围，如 '2023-10-20 ~ 2023-10-22'"
          v-model="searchText"
        />
      </view>
      <view class="filter-btn">
        <text class="filter-text">时间</text>
        <m-icon name="arrow_downward" :size="18" color="#1F2937"></m-icon>
      </view>
    </view>

    <!-- 主内容区 -->
    <view class="main-content">
      <!-- 空状态 -->
      <view v-if="recordList.length === 0" class="empty-state">
        <m-icon name="pedal_bike" :size="120" color="#9CA3AF"></m-icon>
        <text class="empty-text">暂无骑行记录</text>
        <text class="empty-hint">开始您的第一次骑行吧！</text>
      </view>

      <!-- 记录列表 -->
      <view v-else class="record-list">
        <view
          v-for="record in recordList"
          :key="record.id"
          class="record-item"
          hover-class="record-item-hover"
          @click="viewDetail(record.id)"
        >
          <view class="record-content">
            <view class="map-preview">
              <!-- 地图缩略图占位 -->
              <view class="map-placeholder">
                <m-icon name="map" :size="40" color="#9CA3AF"></m-icon>
              </view>
            </view>
            <view class="record-info">
              <text class="record-date">{{ formatDateTime(record.startTime) }}</text>
              <view class="record-stats">
                <view class="stat-item">
                  <m-icon name="route" :size="16" color="#3B82F6"></m-icon>
                  <text class="stat-text">{{ convertDistance(record.distance).toFixed(1) }} {{ distanceUnit }}</text>
                </view>
                <view class="stat-item">
                  <m-icon name="timer" :size="16" color="#3B82F6"></m-icon>
                  <text class="stat-text">{{ formatDuration(record.duration) }}</text>
                </view>
                <view class="stat-item">
                  <m-icon name="speed" :size="16" color="#3B82F6"></m-icon>
                  <text class="stat-text">{{ convertSpeed(record.avgSpeed).toFixed(1) }} {{ speedUnit }}</text>
                </view>
              </view>
            </view>
          </view>
          <button class="delete-btn" @click.stop="deleteRecord(record.id)">
            <m-icon name="delete" :size="20" color="#EF4444"></m-icon>
          </button>
        </view>
      </view>
    </view>

    <!-- 底部导航栏 -->
    <tab-bar :current="1"></tab-bar>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { useUnits } from '@/composables/useUnits.js';
import { getRidingRecordRepository } from '@/db/repositories/index.js';

// 主题
const themeStore = useThemeStore();
const themeClass = computed(() => themeStore.isDark ? 'theme-dark' : 'theme-light');

// 单位管理
const { distanceUnit, speedUnit, convertDistance, convertSpeed } = useUnits();

// 状态
const recordList = ref([]);
const searchText = ref('');

// 加载记录
const loadRecords = () => {
  try {
    // 使用Repository从本地存储读取记录
    const repository = getRidingRecordRepository();
    recordList.value = repository.getAllRecords();
    console.log('✅ 从本地存储加载了', recordList.value.length, '条记录');
  } catch (err) {
    console.error('❌ 加载记录失败:', err);
    uni.showToast({
      title: '加载记录失败',
      icon: 'none'
    });
  }
};

// 查看详情
const viewDetail = (id) => {
  uni.navigateTo({
    url: `/pages/analysis/analysis?id=${id}`
  });
};

// 格式化日期时间
const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 格式化时长
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// 删除记录
const deleteRecord = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    confirmColor: '#EF4444',
    success: (res) => {
      if (res.confirm) {
        performDelete(id);
      }
    }
  });
};

// 执行删除
const performDelete = async (id) => {
  try {
    // 使用Repository从本地存储删除记录
    const repository = getRidingRecordRepository();
    const success = await repository.deleteRecord(id);

    if (success) {
      console.log('✅ 记录已从本地存储删除:', id);

      // 重新加载
      loadRecords();

      uni.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } else {
      throw new Error('删除失败');
    }
  } catch (err) {
    console.error('❌ 删除失败:', err);
    uni.showToast({
      title: '删除失败',
      icon: 'none'
    });
  }
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
.history-page {
  min-height: 100vh;
  background: var(--background-color);
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.header {
  background: var(--card-background);
  padding: 32rpx;
  padding-top: calc(var(--status-bar-height) + 32rpx);
  text-align: center;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 10;

  .title {
    font-size: 40rpx;
    font-weight: 700;
    color: var(--text-primary);
  }
}

.search-section {
  background: var(--card-background);
  padding: 24rpx 32rpx;
  display: flex;
  gap: 16rpx;
  border-bottom: 1rpx solid var(--border-color);

  .search-box {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16rpx;
    background: var(--background-secondary);
    border-radius: 16rpx;
    padding: 16rpx 24rpx;
    border: 1rpx solid var(--border-color);

    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: var(--text-primary);
    }
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    background: var(--background-secondary);
    padding: 16rpx 24rpx;
    border-radius: 16rpx;
    border: 1rpx solid var(--border-color);

    .filter-text {
      font-size: 28rpx;
      color: var(--text-primary);
    }
  }
}

.main-content {
  padding: 32rpx;
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
    color: var(--text-primary);
    margin: 32rpx 0 16rpx;
    font-weight: 600;
  }

  .empty-hint {
    font-size: 28rpx;
    color: var(--text-secondary);
  }
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.record-item {
  background: var(--card-background);
  border-radius: 16rpx;
  box-shadow: var(--shadow-sm);
  padding: 32rpx;
  position: relative;
  transition: all 0.3s ease;

  .record-content {
    display: flex;
    gap: 32rpx;
  }

  .map-preview {
    width: 192rpx;
    height: 192rpx;
    flex-shrink: 0;
    border-radius: 12rpx;
    overflow: hidden;

    .map-placeholder {
      width: 100%;
      height: 100%;
      background: var(--background-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .record-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .record-date {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 24rpx;
  }

  .record-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx 32rpx;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .stat-text {
        font-size: 24rpx;
        color: var(--text-secondary);
      }
    }
  }

  .delete-btn {
    position: absolute;
    top: 16rpx;
    right: 16rpx;
    background: transparent;
    border: none;
    padding: 12rpx;
    opacity: 0;
    transition: opacity 0.3s ease;

    &::after {
      border: none;
    }
  }

  &:hover .delete-btn,
  &:active .delete-btn {
    opacity: 1;
  }
}

.record-item-hover {
  transform: scale(0.98);
  box-shadow: var(--shadow-md);
}
</style>
