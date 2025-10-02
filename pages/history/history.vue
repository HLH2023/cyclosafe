<template>
  <view class="history-page">
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
                  <text class="stat-text">{{ record.distance.toFixed(1) }} km</text>
                </view>
                <view class="stat-item">
                  <m-icon name="timer" :size="16" color="#3B82F6"></m-icon>
                  <text class="stat-text">{{ formatDuration(record.duration) }}</text>
                </view>
                <view class="stat-item">
                  <m-icon name="speed" :size="16" color="#3B82F6"></m-icon>
                  <text class="stat-text">{{ record.avgSpeed.toFixed(1) }} km/h</text>
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
import { ref } from 'vue';
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app';

// 状态
const recordList = ref([]);
const searchText = ref('');

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
const performDelete = (id) => {
  try {
    // 删除记录
    uni.removeStorageSync(`riding_${id}`);

    // 更新列表
    const list = uni.getStorageSync('riding_list') || '[]';
    const ids = JSON.parse(list);
    const newIds = ids.filter(rid => rid !== id);
    uni.setStorageSync('riding_list', JSON.stringify(newIds));

    // 重新加载
    loadRecords();

    uni.showToast({
      title: '删除成功',
      icon: 'success'
    });
  } catch (err) {
    console.error('删除失败:', err);
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
  background: #F3F4F6;
  padding-bottom: 160rpx;
}

.header {
  background: #FFFFFF;
  padding: 32rpx;
  text-align: center;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 10;

  .title {
    font-size: 40rpx;
    font-weight: 700;
    color: #1F2937;
  }
}

.search-section {
  background: #FFFFFF;
  padding: 24rpx 32rpx;
  display: flex;
  gap: 16rpx;
  border-bottom: 1rpx solid #E5E7EB;

  .search-box {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16rpx;
    background: #F3F4F6;
    border-radius: 16rpx;
    padding: 16rpx 24rpx;
    border: 1rpx solid #E5E7EB;

    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: #1F2937;
    }
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    background: #F3F4F6;
    padding: 16rpx 24rpx;
    border-radius: 16rpx;
    border: 1rpx solid #E5E7EB;

    .filter-text {
      font-size: 28rpx;
      color: #1F2937;
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
    color: #1F2937;
    margin: 32rpx 0 16rpx;
    font-weight: 600;
  }

  .empty-hint {
    font-size: 28rpx;
    color: #6B7280;
  }
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.record-item {
  background: #FFFFFF;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
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
      background: #F3F4F6;
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
    color: #1F2937;
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
        color: #6B7280;
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
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}
</style>
