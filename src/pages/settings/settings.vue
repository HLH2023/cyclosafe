<template>
  <view class="settings-page">
    <!-- 单位设置 -->
    <view class="section">
      <view class="section-title">单位设置</view>
      <view class="setting-item">
        <text class="setting-label">距离单位</text>
        <picker :value="distanceUnitIndex" :range="distanceUnits" @change="onDistanceUnitChange">
          <view class="picker-value">{{ distanceUnits[distanceUnitIndex] }}</view>
        </picker>
      </view>
    </view>

    <!-- 安全设置 -->
    <view class="section">
      <view class="section-title">安全设置</view>
      <view class="setting-item">
        <text class="setting-label">速度预警阈值</text>
        <view class="slider-container">
          <slider
            :value="speedThreshold"
            :min="20"
            :max="60"
            :step="5"
            @change="onSpeedThresholdChange"
            activeColor="#3B82F6"
          />
          <text class="slider-value">{{ speedThreshold }} km/h</text>
        </view>
      </view>
      <view class="setting-item">
        <text class="setting-label">震动反馈</text>
        <switch :checked="vibrationEnabled" @change="onVibrationChange" color="#3B82F6" />
      </view>
    </view>

    <!-- 地图设置 -->
    <view class="section">
      <view class="section-title">地图设置</view>
      <view class="setting-item">
        <text class="setting-label">地图类型</text>
        <picker :value="mapTypeIndex" :range="mapTypes" @change="onMapTypeChange">
          <view class="picker-value">{{ mapTypes[mapTypeIndex] }}</view>
        </picker>
      </view>
    </view>

    <!-- 数据管理 -->
    <view class="section">
      <view class="section-title">数据管理</view>
      <view class="setting-item action" @click="clearCache">
        <text class="setting-label">清除缓存</text>
        <text class="action-icon">→</text>
      </view>
      <view class="setting-item action danger" @click="clearAllData">
        <text class="setting-label">清空所有记录</text>
        <text class="action-icon">→</text>
      </view>
    </view>

    <!-- 关于 -->
    <view class="section">
      <view class="section-title">关于</view>
      <view class="setting-item">
        <text class="setting-label">版本号</text>
        <text class="setting-value">v0.1.0</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      distanceUnits: ['公里 (km)', '英里 (mi)'],
      distanceUnitIndex: 0,
      mapTypes: ['标准地图', '卫星地图'],
      mapTypeIndex: 0,
      speedThreshold: 40,
      vibrationEnabled: true
    };
  },
  onLoad() {
    this.loadSettings();
  },
  methods: {
    // 加载设置
    loadSettings() {
      this.distanceUnitIndex = uni.getStorageSync('distance_unit') || 0;
      this.mapTypeIndex = uni.getStorageSync('map_type') || 0;
      this.speedThreshold = uni.getStorageSync('speed_threshold') || 40;
      this.vibrationEnabled = uni.getStorageSync('vibration_enabled') !== false;
    },

    // 距离单位变化
    onDistanceUnitChange(e) {
      this.distanceUnitIndex = e.detail.value;
      uni.setStorageSync('distance_unit', this.distanceUnitIndex);
      uni.showToast({
        title: '设置已保存',
        icon: 'success'
      });
    },

    // 地图类型变化
    onMapTypeChange(e) {
      this.mapTypeIndex = e.detail.value;
      uni.setStorageSync('map_type', this.mapTypeIndex);
      uni.showToast({
        title: '设置已保存',
        icon: 'success'
      });
    },

    // 速度阈值变化
    onSpeedThresholdChange(e) {
      this.speedThreshold = e.detail.value;
      uni.setStorageSync('speed_threshold', this.speedThreshold);
    },

    // 震动开关变化
    onVibrationChange(e) {
      this.vibrationEnabled = e.detail.value;
      uni.setStorageSync('vibration_enabled', this.vibrationEnabled);
    },

    // 清除缓存
    clearCache() {
      uni.showModal({
        title: '清除缓存',
        content: '确定要清除缓存吗？',
        success: (res) => {
          if (res.confirm) {
            uni.showToast({
              title: '缓存已清除',
              icon: 'success'
            });
          }
        }
      });
    },

    // 清空所有记录
    clearAllData() {
      uni.showModal({
        title: '危险操作',
        content: '确定要清空所有骑行记录吗？此操作不可恢复！',
        confirmText: '确定清空',
        confirmColor: '#EF4444',
        success: (res) => {
          if (res.confirm) {
            this.performClearAll();
          }
        }
      });
    },

    // 执行清空
    performClearAll() {
      try {
        const list = uni.getStorageSync('riding_list') || '[]';
        const ids = JSON.parse(list);

        // 删除所有记录
        ids.forEach(id => {
          uni.removeStorageSync(`riding_${id}`);
        });

        // 清空列表
        uni.setStorageSync('riding_list', '[]');

        uni.showToast({
          title: '已清空所有记录',
          icon: 'success'
        });
      } catch (err) {
        console.error('清空失败:', err);
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: #F5F5F5;
  padding: 20rpx;
}

.section {
  margin-bottom: 20rpx;

  .section-title {
    font-size: 28rpx;
    color: #6B7280;
    padding: 20rpx 30rpx 10rpx;
  }
}

.setting-item {
  background: white;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #F3F4F6;

  &:first-child {
    border-top-left-radius: 12rpx;
    border-top-right-radius: 12rpx;
  }

  &:last-child {
    border-bottom: none;
    border-bottom-left-radius: 12rpx;
    border-bottom-right-radius: 12rpx;
  }

  &.action {
    .action-icon {
      color: #9CA3AF;
      font-size: 32rpx;
    }
  }

  &.danger {
    .setting-label {
      color: #EF4444;
    }
  }

  .setting-label {
    font-size: 32rpx;
    color: #1F2937;
  }

  .setting-value {
    font-size: 28rpx;
    color: #6B7280;
  }

  .picker-value {
    font-size: 28rpx;
    color: #3B82F6;
  }

  .slider-container {
    flex: 1;
    display: flex;
    align-items: center;
    margin-left: 40rpx;

    slider {
      flex: 1;
    }

    .slider-value {
      font-size: 28rpx;
      color: #3B82F6;
      margin-left: 20rpx;
      min-width: 120rpx;
      text-align: right;
    }
  }
}
</style>
