<template>
  <view class="settings-page" :class="themeClass">
    <!-- 外观设置 -->
    <view class="section glass-card">
      <view class="section-title">
        <uni-icons type="eye" size="20" :color="iconColor"></uni-icons>
        <text>外观设置</text>
      </view>
      <view class="setting-item">
        <text class="label">主题模式</text>
        <picker :value="themeModeIndex" :range="themeModes" @change="onThemeModeChange">
          <view class="picker-value">
            {{ themeModes[themeModeIndex] }}
            <uni-icons type="forward" size="14" :color="iconColor"></uni-icons>
          </view>
        </picker>
      </view>
    </view>

    <!-- 单位设置 -->
    <view class="section glass-card">
      <view class="section-title">
        <uni-icons type="gear" size="20" :color="iconColor"></uni-icons>
        <text>单位设置</text>
      </view>
      <view class="setting-item">
        <text class="label">距离单位</text>
        <picker :value="distanceUnitIndex" :range="distanceUnits" @change="onDistanceUnitChange">
          <view class="picker-value">
            {{ distanceUnits[distanceUnitIndex] }}
            <uni-icons type="forward" size="14" :color="iconColor"></uni-icons>
          </view>
        </picker>
      </view>
      <view class="setting-item">
        <text class="label">速度单位</text>
        <picker :value="speedUnitIndex" :range="speedUnits" @change="onSpeedUnitChange">
          <view class="picker-value">
            {{ speedUnits[speedUnitIndex] }}
            <uni-icons type="forward" size="14" :color="iconColor"></uni-icons>
          </view>
        </picker>
      </view>
    </view>

    <!-- 安全设置 -->
    <view class="section glass-card">
      <view class="section-title">
        <uni-icons type="locked" size="20" :color="iconColor"></uni-icons>
        <text>安全设置</text>
      </view>
      <view class="setting-item vertical">
        <view class="label-row">
          <text class="label">超速提醒阈值</text>
          <text class="value-highlight">{{ speedThreshold }} km/h</text>
        </view>
        <slider
          :value="speedThreshold"
          :min="20"
          :max="60"
          :step="5"
          @change="onSpeedThresholdChange"
          @changing="onSpeedThresholdChanging"
          activeColor="#3B82F6"
          backgroundColor="rgba(59, 130, 246, 0.2)"
          block-size="20"
        />
      </view>
      <view class="setting-item">
        <text class="label">震动反馈</text>
        <switch :checked="vibrationEnabled" @change="onVibrationChange" color="#3B82F6" />
      </view>
    </view>

    <!-- 地图设置 -->
    <view class="section glass-card">
      <view class="section-title">
        <uni-icons type="map-filled" size="20" :color="iconColor"></uni-icons>
        <text>地图设置</text>
      </view>
      <view class="setting-item">
        <text class="label">地图类型</text>
        <picker :value="mapTypeIndex" :range="mapTypes" @change="onMapTypeChange">
          <view class="picker-value">
            {{ mapTypes[mapTypeIndex] }}
            <uni-icons type="forward" size="14" :color="iconColor"></uni-icons>
          </view>
        </picker>
      </view>
      <view class="setting-item">
        <text class="label">显示轨迹</text>
        <switch :checked="showTrack" @change="onShowTrackChange" color="#3B82F6" />
      </view>
      <view class="setting-item">
        <text class="label">自动定位</text>
        <switch :checked="autoCenter" @change="onAutoCenterChange" color="#3B82F6" />
      </view>
    </view>

    <!-- 数据管理 -->
    <view class="section glass-card">
      <view class="section-title">
        <uni-icons type="folder" size="20" :color="iconColor"></uni-icons>
        <text>数据管理</text>
      </view>
      <view class="setting-item action" hover-class="item-hover" @click="exportData">
        <text class="label">导出数据</text>
        <uni-icons type="forward" size="14" :color="iconColor"></uni-icons>
      </view>
      <view class="setting-item action" hover-class="item-hover" @click="clearCache">
        <text class="label">清除缓存</text>
        <uni-icons type="forward" size="14" :color="iconColor"></uni-icons>
      </view>
      <view class="setting-item action danger" hover-class="item-hover" @click="clearAllData">
        <text class="label">清空所有记录</text>
        <uni-icons type="forward" size="14" color="#EF4444"></uni-icons>
      </view>
    </view>

    <!-- 其他设置 -->
    <view class="section glass-card">
      <view class="section-title">
        <uni-icons type="more-filled" size="20" :color="iconColor"></uni-icons>
        <text>其他</text>
      </view>
      <view class="setting-item">
        <text class="label">自动暂停</text>
        <switch :checked="autoPause" @change="onAutoPauseChange" color="#3B82F6" />
      </view>
      <view class="setting-item">
        <text class="label">屏幕常亮</text>
        <switch :checked="keepScreenOn" @change="onKeepScreenOnChange" color="#3B82F6" />
      </view>
      <view class="setting-item action" hover-class="item-hover" @click="showAbout">
        <text class="label">关于</text>
        <text class="version">v0.1.0</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';

// 主题
const themeStore = useThemeStore();
const themeClass = computed(() => themeStore.isDark ? 'theme-dark' : 'theme-light');
const iconColor = computed(() => themeStore.isDark ? '#9CA3AF' : '#6B7280');

// 主题模式
const themeModes = ['跟随系统', '浅色模式', '深色模式'];
const themeModeMap = ['auto', 'light', 'dark'];
const themeModeIndex = ref(0);

// 单位设置
const distanceUnits = ['公里 (km)', '英里 (mi)'];
const distanceUnitIndex = ref(0);
const speedUnits = ['公里/小时 (km/h)', '英里/小时 (mph)'];
const speedUnitIndex = ref(0);

// 地图设置
const mapTypes = ['标准地图', '卫星地图', '夜间地图'];
const mapTypeIndex = ref(0);
const showTrack = ref(true);
const autoCenter = ref(true);

// 安全设置
const speedThreshold = ref(40);
const vibrationEnabled = ref(true);

// 其他设置
const autoPause = ref(true);
const keepScreenOn = ref(false);

// 处理主题变化
const handleThemeChange = () => {
  // themeClass 是计算属性，会自动更新
};

// 加载设置
const loadSettings = () => {
  // 主题模式
  const savedMode = themeStore.mode;
  themeModeIndex.value = themeModeMap.indexOf(savedMode);

  // 单位设置
  distanceUnitIndex.value = uni.getStorageSync('distance_unit') || 0;
  speedUnitIndex.value = uni.getStorageSync('speed_unit') || 0;

  // 地图设置
  mapTypeIndex.value = uni.getStorageSync('map_type') || 0;
  showTrack.value = uni.getStorageSync('show_track') !== false;
  autoCenter.value = uni.getStorageSync('auto_center') !== false;

  // 安全设置
  speedThreshold.value = uni.getStorageSync('speed_threshold') || 40;
  vibrationEnabled.value = uni.getStorageSync('vibration_enabled') !== false;

  // 其他设置
  autoPause.value = uni.getStorageSync('auto_pause') !== false;
  keepScreenOn.value = uni.getStorageSync('keep_screen_on') === true;
};

// 主题模式变化
const onThemeModeChange = (e) => {
  themeModeIndex.value = e.detail.value;
  const mode = themeModeMap[e.detail.value];
  themeStore.setMode(mode);
  uni.showToast({
    title: '主题已切换',
    icon: 'success',
    duration: 1500
  });
};

// 距离单位变化
const onDistanceUnitChange = (e) => {
  distanceUnitIndex.value = e.detail.value;
  uni.setStorageSync('distance_unit', distanceUnitIndex.value);
  uni.showToast({
    title: '设置已保存',
    icon: 'success'
  });
};

// 速度单位变化
const onSpeedUnitChange = (e) => {
  speedUnitIndex.value = e.detail.value;
  uni.setStorageSync('speed_unit', speedUnitIndex.value);
  uni.showToast({
    title: '设置已保存',
    icon: 'success'
  });
};

// 地图类型变化
const onMapTypeChange = (e) => {
  mapTypeIndex.value = e.detail.value;
  uni.setStorageSync('map_type', mapTypeIndex.value);
  uni.showToast({
    title: '设置已保存',
    icon: 'success'
  });
};

// 显示轨迹变化
const onShowTrackChange = (e) => {
  showTrack.value = e.detail.value;
  uni.setStorageSync('show_track', showTrack.value);
};

// 自动定位变化
const onAutoCenterChange = (e) => {
  autoCenter.value = e.detail.value;
  uni.setStorageSync('auto_center', autoCenter.value);
};

// 速度阈值变化
const onSpeedThresholdChange = (e) => {
  speedThreshold.value = e.detail.value;
  uni.setStorageSync('speed_threshold', speedThreshold.value);
};

// 速度阈值拖动中
const onSpeedThresholdChanging = (e) => {
  speedThreshold.value = e.detail.value;
};

// 震动开关变化
const onVibrationChange = (e) => {
  vibrationEnabled.value = e.detail.value;
  uni.setStorageSync('vibration_enabled', vibrationEnabled.value);
};

// 自动暂停变化
const onAutoPauseChange = (e) => {
  autoPause.value = e.detail.value;
  uni.setStorageSync('auto_pause', autoPause.value);
};

// 屏幕常亮变化
const onKeepScreenOnChange = (e) => {
  keepScreenOn.value = e.detail.value;
  uni.setStorageSync('keep_screen_on', keepScreenOn.value);

  if (keepScreenOn.value) {
    uni.setKeepScreenOn({
      keepScreenOn: true
    });
  } else {
    uni.setKeepScreenOn({
      keepScreenOn: false
    });
  }
};

// 导出数据
const exportData = () => {
  uni.showModal({
    title: '导出数据',
    content: '导出功能开发中，敬请期待',
    showCancel: false
  });
};

// 清除缓存
const clearCache = () => {
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
};

// 清空所有记录
const clearAllData = () => {
  uni.showModal({
    title: '危险操作',
    content: '确定要清空所有骑行记录吗？此操作不可恢复！',
    confirmText: '确定清空',
    confirmColor: '#EF4444',
    success: (res) => {
      if (res.confirm) {
        performClearAll();
      }
    }
  });
};

// 执行清空
const performClearAll = () => {
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
};

// 关于
const showAbout = () => {
  uni.showModal({
    title: 'CycloSafe',
    content: '版本: v0.1.0\n骑行安全码表\n基于uniapp开发',
    showCancel: false
  });
};

// 生命周期
onLoad(() => {
  loadSettings();
  uni.$on('themeChange', handleThemeChange);
});

onShow(() => {
  loadSettings();
});

onUnmounted(() => {
  uni.$off('themeChange', handleThemeChange);
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.settings-page {
  min-height: 100vh;
  padding: 40rpx 30rpx 120rpx;
  background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);

  &.theme-dark {
    background: linear-gradient(135deg, #1E3A8A 0%, #1E293B 100%);
  }
}

.section {
  margin-bottom: 32rpx;
}

.glass-card {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.theme-dark .glass-card {
  background: rgba(31, 41, 55, 0.4);
  border: 1rpx solid rgba(75, 85, 99, 0.3);
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #ffffff;
  padding: 32rpx 32rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.setting-item {
  padding: 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &.vertical {
    flex-direction: column;
    align-items: stretch;
    gap: 24rpx;
  }

  &.action {
    cursor: pointer;
  }

  &.danger {
    .label {
      color: #EF4444;
    }
  }

  .label {
    font-size: 30rpx;
    color: #ffffff;
    font-weight: 500;
  }

  .version {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.7);
  }

  .picker-value {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
  }

  .value-highlight {
    font-size: 30rpx;
    font-weight: 700;
    color: #3B82F6;
  }

  slider {
    flex: 1;
  }
}

.item-hover {
  background: rgba(255, 255, 255, 0.1);
}

.theme-dark {
  .section-title {
    color: #F9FAFB;
  }

  .setting-item {
    border-bottom-color: rgba(75, 85, 99, 0.3);

    .label {
      color: #F9FAFB;
    }

    .version {
      color: rgba(249, 250, 251, 0.6);
    }

    .picker-value {
      color: rgba(249, 250, 251, 0.8);
    }
  }

  .item-hover {
    background: rgba(75, 85, 99, 0.2);
  }
}
</style>
