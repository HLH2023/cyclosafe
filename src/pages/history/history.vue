<template>
  <view class="history-page">
    <view v-if="recordList.length === 0" class="empty-state">
      <text class="empty-icon">📭</text>
      <text class="empty-text">暂无骑行记录</text>
      <text class="empty-hint">点击首页"开始骑行"创建记录</text>
    </view>

    <view v-else class="record-list">
      <view
        v-for="record in recordList"
        :key="record.id"
        class="record-item"
        @click="viewDetail(record.id)"
      >
        <view class="record-header">
          <text class="record-date">{{ formatDate(record.startTime) }}</text>
          <text class="record-time">{{ formatTime(record.startTime) }}</text>
        </view>
        <view class="record-stats">
          <view class="stat">
            <text class="stat-value">{{ record.distance.toFixed(2) }}</text>
            <text class="stat-unit">km</text>
          </view>
          <view class="stat">
            <text class="stat-value">{{ formatDuration(record.duration) }}</text>
          </view>
          <view class="stat">
            <text class="stat-value">{{ record.avgSpeed.toFixed(1) }}</text>
            <text class="stat-unit">km/h</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      recordList: []
    };
  },
  onLoad() {
    this.loadRecords();
  },
  onShow() {
    this.loadRecords();
  },
  onPullDownRefresh() {
    this.loadRecords();
    uni.stopPullDownRefresh();
  },
  methods: {
    // 加载记录
    loadRecords() {
      try {
        const list = uni.getStorageSync('riding_list') || '[]';
        const ids = JSON.parse(list);

        this.recordList = ids.map(id => {
          const data = uni.getStorageSync(`riding_${id}`);
          return data ? JSON.parse(data) : null;
        }).filter(item => item !== null);
      } catch (err) {
        console.error('加载记录失败:', err);
      }
    },

    // 查看详情
    viewDetail(id) {
      uni.navigateTo({
        url: `/pages/analysis/analysis?id=${id}`
      });
    },

    // 格式化日期
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    // 格式化时间
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    // 格式化时长
    formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}:${String(mins).padStart(2, '0')}`;
    }
  }
};
</script>

<style lang="scss" scoped>
.history-page {
  min-height: 100vh;
  background: #F5F5F5;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 60rpx;
  text-align: center;

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 40rpx;
  }

  .empty-text {
    font-size: 32rpx;
    color: #1F2937;
    margin-bottom: 16rpx;
  }

  .empty-hint {
    font-size: 28rpx;
    color: #6B7280;
  }
}

.record-list {
  padding: 20rpx;
}

.record-item {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #E5E7EB;

    .record-date {
      font-size: 32rpx;
      font-weight: bold;
      color: #1F2937;
    }

    .record-time {
      font-size: 28rpx;
      color: #6B7280;
    }
  }

  .record-stats {
    display: flex;
    justify-content: space-around;

    .stat {
      text-align: center;

      .stat-value {
        font-size: 40rpx;
        font-weight: bold;
        color: #3B82F6;
      }

      .stat-unit {
        font-size: 24rpx;
        color: #6B7280;
        margin-left: 8rpx;
      }
    }
  }
}
</style>
