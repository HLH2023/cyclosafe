<template>
  <view class="settings-page" :class="themeClass">
    <!-- 顶部标题栏 -->
    <view class="header">
      <text class="title">设置</text>
    </view>

    <!-- 主内容区 -->
    <view class="main-content">

      <!-- 单位设置 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">单位设置</text>
        </view>
        <view class="card">
          <view class="setting-item border-bottom">
            <text class="label">距离单位</text>
            <picker :value="distanceUnitIndex" :range="distanceUnits" @change="onDistanceUnitChange">
              <view class="picker-value">
                {{ distanceUnits[distanceUnitIndex] }}
              </view>
            </picker>
          </view>
          <view class="setting-item border-bottom">
            <text class="label">速度单位</text>
            <picker :value="speedUnitIndex" :range="speedUnits" @change="onSpeedUnitChange">
              <view class="picker-value">
                {{ speedUnits[speedUnitIndex] }}
              </view>
            </picker>
          </view>
          <view class="setting-item">
            <text class="label">海拔单位</text>
            <picker :value="altitudeUnitIndex" :range="altitudeUnits" @change="onAltitudeUnitChange">
              <view class="picker-value">
                {{ altitudeUnits[altitudeUnitIndex] }}
              </view>
            </picker>
          </view>
        </view>
      </view>

      <!-- 显示设置 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">显示设置</text>
        </view>
        <view class="card">
          <view class="setting-item">
            <text class="label">主题模式</text>
            <picker :value="themeIndex" :range="themeOptions" @change="onThemeChange">
              <view class="picker-value">
                {{ themeOptions[themeIndex] }}
              </view>
            </picker>
          </view>
        </view>
      </view>

      <!-- 安全设置 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">安全设置</text>
        </view>
        <view class="card">
          <view class="setting-item vertical border-bottom">
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
              backgroundColor="#E5E7EB"
              block-size="20"
            />
          </view>
          <view class="setting-item border-bottom">
            <text class="label">摔倒检测</text>
            <switch :checked="fallDetectionEnabled" @change="onFallDetectionChange" color="#3B82F6" />
          </view>
          <view class="setting-item border-bottom">
            <text class="label">摔倒检测灵敏度</text>
            <picker :value="fallSensitivityIndex" :range="fallSensitivityOptions" @change="onFallSensitivityChange" :disabled="!fallDetectionEnabled">
              <view class="picker-value" :class="{ disabled: !fallDetectionEnabled }">
                {{ fallSensitivityOptions[fallSensitivityIndex] }}
              </view>
            </picker>
          </view>
          <view class="setting-item">
            <text class="label">紧急联系人</text>
            <view class="action-link">
              <text class="link-text">管理</text>
              <m-icon name="chevron_right" :size="20" color="#3B82F6"></m-icon>
            </view>
          </view>
        </view>
      </view>

      <!-- 地图设置 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">地图设置</text>
        </view>
        <view class="card">
          <view class="setting-item border-bottom">
            <text class="label">地图类型</text>
            <picker :value="mapTypeIndex" :range="mapTypes" @change="onMapTypeChange">
              <view class="picker-value">
                {{ mapTypes[mapTypeIndex] }}
              </view>
            </picker>
          </view>
          <view class="setting-item border-bottom">
            <text class="label">轨迹颜色方案</text>
            <picker :value="trackColorIndex" :range="trackColorOptions" @change="onTrackColorChange">
              <view class="picker-value">
                {{ trackColorOptions[trackColorIndex] }}
              </view>
            </picker>
          </view>
          <view class="setting-item">
            <text class="label">危险点提醒</text>
            <switch :checked="showTrack" @change="onShowTrackChange" color="#3B82F6" />
          </view>
        </view>
      </view>

      <!-- 数据管理 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">数据管理</text>
        </view>
        <view class="card">
          <view class="setting-item action border-bottom" hover-class="item-hover" @click="clearCache">
            <text class="label">清理缓存</text>
            <m-icon name="chevron_right" :size="20" color="#6B7280"></m-icon>
          </view>
          <view class="setting-item action border-bottom danger" hover-class="item-hover" @click="clearAllData">
            <text class="label">清除所有历史记录</text>
            <m-icon name="chevron_right" :size="20" color="#EF4444"></m-icon>
          </view>
          <view class="setting-item action border-bottom danger" hover-class="item-hover" @click="clearAllDangerPoints">
            <text class="label">清除所有危险点</text>
            <m-icon name="chevron_right" :size="20" color="#EF4444"></m-icon>
          </view>
          <view class="setting-item action" hover-class="item-hover" @click="exportData">
            <text class="label">导出所有数据</text>
            <m-icon name="chevron_right" :size="20" color="#6B7280"></m-icon>
          </view>
        </view>
      </view>

      <!-- 其他设置 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">其他设置</text>
        </view>
        <view class="card">
          <view class="setting-item border-bottom">
            <text class="label">自动暂停</text>
            <switch :checked="autoPause" @change="onAutoPauseChange" color="#3B82F6" />
          </view>
          <view class="setting-item border-bottom">
            <text class="label">屏幕常亮</text>
            <switch :checked="keepScreenOn" @change="onKeepScreenOnChange" color="#3B82F6" />
          </view>
          <view class="setting-item">
            <text class="label">震动反馈</text>
            <switch :checked="vibrationEnabled" @change="onVibrationChange" color="#3B82F6" />
          </view>
        </view>
      </view>
    </view>

    <!-- 底部导航栏 -->
    <tab-bar :current="2"></tab-bar>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { getSettingsRepository, getRidingRecordRepository, getDangerPointRepository } from '@/db/repositories/index.js';
import { clearAllData as clearAllDataFromDB } from '@/db/database.js';

// 主题设置
const themeStore = useThemeStore();
const themeClass = computed(() => themeStore.isDark ? 'theme-dark' : 'theme-light');
const themeOptions = ['跟随系统', '明亮模式', '黑夜模式'];
const themeIndex = ref(0); // 默认跟随系统

// 单位设置
const distanceUnits = ['公里 (km)', '英里 (mi)'];
const distanceUnitIndex = ref(0);
const speedUnits = ['公里/小时 (km/h)', '英里/小时 (mph)'];
const speedUnitIndex = ref(0);
const altitudeUnits = ['米 (m)', '英尺 (ft)'];
const altitudeUnitIndex = ref(0);

// 地图设置
const mapTypes = ['标准', '卫星', '夜间'];
const mapTypeIndex = ref(0);
const trackColorOptions = ['经典蓝', '活力橙', '醒目绿'];
const trackColorIndex = ref(0);
const showTrack = ref(true);

// 安全设置
const speedThreshold = ref(40);
const vibrationEnabled = ref(true);
const fallDetectionEnabled = ref(true);
const fallSensitivityOptions = ['低灵敏度', '中灵敏度', '高灵敏度'];
const fallSensitivityIndex = ref(1); // 默认中灵敏度

// 其他设置
const autoPause = ref(true);
const keepScreenOn = ref(false);

// 加载设置
const loadSettings = () => {
  try {
    const settingsRepo = getSettingsRepository();

    // 主题设置
    const savedTheme = settingsRepo.getSetting('theme_mode', 'auto');
    const themeMap = { auto: 0, light: 1, dark: 2 };
    themeIndex.value = themeMap[savedTheme] || 0;

    // 单位设置
    distanceUnitIndex.value = settingsRepo.getSetting('distance_unit', 0);
    speedUnitIndex.value = settingsRepo.getSetting('speed_unit', 0);
    altitudeUnitIndex.value = settingsRepo.getSetting('altitude_unit', 0);

    // 地图设置
    mapTypeIndex.value = settingsRepo.getSetting('map_type', 0);
    trackColorIndex.value = settingsRepo.getSetting('track_color', 0);
    showTrack.value = settingsRepo.getSetting('show_track', true);

    // 安全设置
    speedThreshold.value = settingsRepo.getSetting('speed_threshold', 40);
    vibrationEnabled.value = settingsRepo.getSetting('vibration_enabled', true);
    fallDetectionEnabled.value = settingsRepo.getSetting('fallDetectionEnabled', true);

    // 加载摔倒检测灵敏度
    const sensitivity = settingsRepo.getSetting('fallDetectionSensitivity', 'medium');
    const sensitivityMap = { low: 0, medium: 1, high: 2 };
    fallSensitivityIndex.value = sensitivityMap[sensitivity] || 1;

    // 其他设置
    autoPause.value = settingsRepo.getSetting('auto_pause', true);
    keepScreenOn.value = settingsRepo.getSetting('keep_screen_on', false);

    console.log('✅ 从本地存储加载了所有设置');
  } catch (error) {
    console.error('❌ 加载设置失败:', error);
  }
};

// 主题变化
const onThemeChange = (e) => {
  themeIndex.value = e.detail.value;

  // 映射到主题模式
  const indexToMode = ['auto', 'light', 'dark'];
  const mode = indexToMode[themeIndex.value];

  // 使用themeStore更新主题
  themeStore.setMode(mode);

  uni.showToast({
    title: '主题已切换',
    icon: 'success'
  });
};

// 距离单位变化
const onDistanceUnitChange = (e) => {
  distanceUnitIndex.value = e.detail.value;
  const settingsRepo = getSettingsRepository();
  settingsRepo.saveSetting('distance_unit', distanceUnitIndex.value);
  uni.showToast({
    title: '设置已保存',
    icon: 'success'
  });
};

// 速度单位变化
const onSpeedUnitChange = (e) => {
  speedUnitIndex.value = e.detail.value;
  const settingsRepo = getSettingsRepository();
  settingsRepo.saveSetting('speed_unit', speedUnitIndex.value);
  uni.showToast({
    title: '设置已保存',
    icon: 'success'
  });
};

// 海拔单位变化
const onAltitudeUnitChange = (e) => {
  altitudeUnitIndex.value = e.detail.value;
  const settingsRepo = getSettingsRepository();
  settingsRepo.saveSetting('altitude_unit', altitudeUnitIndex.value);
  uni.showToast({
    title: '设置已保存',
    icon: 'success'
  });
};

// 地图类型变化
const onMapTypeChange = (e) => {
  mapTypeIndex.value = e.detail.value;
  const settingsRepo = getSettingsRepository();
  settingsRepo.saveSetting('map_type', mapTypeIndex.value);
  uni.showToast({
    title: '设置已保存',
    icon: 'success'
  });
};

// 轨迹颜色变化
const onTrackColorChange = (e) => {
  trackColorIndex.value = e.detail.value;
  const settingsRepo = getSettingsRepository();
  settingsRepo.saveSetting('track_color', trackColorIndex.value);
  uni.showToast({
    title: '设置已保存',
    icon: 'success'
  });
};

// 显示轨迹变化
const onShowTrackChange = (e) => {
  showTrack.value = e.detail.value;
  const settingsRepo = getSettingsRepository();
  settingsRepo.saveSetting('show_track', showTrack.value);
};

// 速度阈值变化
const onSpeedThresholdChange = (e) => {
  speedThreshold.value = e.detail.value;
  const settingsRepo = getSettingsRepository();
  settingsRepo.saveSetting('speed_threshold', speedThreshold.value);
};

// 速度阈值拖动中
const onSpeedThresholdChanging = (e) => {
  speedThreshold.value = e.detail.value;
};

// 摔倒检测开关变化
const onFallDetectionChange = (e) => {
  fallDetectionEnabled.value = e.detail.value;
  const settingsRepo = getSettingsRepository();
  settingsRepo.saveSetting('fallDetectionEnabled', fallDetectionEnabled.value);

  uni.showToast({
    title: fallDetectionEnabled.value ? '摔倒检测已开启' : '摔倒检测已关闭',
    icon: 'success'
  });
};

// 摔倒检测灵敏度变化
const onFallSensitivityChange = (e) => {
  fallSensitivityIndex.value = e.detail.value;

  // 转换为存储值
  const indexToSensitivity = ['low', 'medium', 'high'];
  const sensitivity = indexToSensitivity[fallSensitivityIndex.value];

  const settingsRepo = getSettingsRepository();
  settingsRepo.saveSetting('fallDetectionSensitivity', sensitivity);

  uni.showToast({
    title: '灵敏度已更新',
    icon: 'success'
  });
};

// 震动开关变化
const onVibrationChange = (e) => {
  vibrationEnabled.value = e.detail.value;
  const settingsRepo = getSettingsRepository();
  settingsRepo.saveSetting('vibration_enabled', vibrationEnabled.value);
};

// 自动暂停变化
const onAutoPauseChange = (e) => {
  autoPause.value = e.detail.value;
  const settingsRepo = getSettingsRepository();
  settingsRepo.saveSetting('auto_pause', autoPause.value);
};

// 屏幕常亮变化
const onKeepScreenOnChange = (e) => {
  keepScreenOn.value = e.detail.value;
  const settingsRepo = getSettingsRepository();
  settingsRepo.saveSetting('keep_screen_on', keepScreenOn.value);

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

// 清空所有危险点
const clearAllDangerPoints = () => {
  uni.showModal({
    title: '清除危险点',
    content: '确定要清除所有危险点吗？此操作不可恢复！',
    confirmText: '确定清除',
    confirmColor: '#EF4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          const dangerPointRepo = getDangerPointRepository();
          const success = await dangerPointRepo.clearAllDangerPoints();

          if (success) {
            uni.showToast({
              title: '已清除所有危险点',
              icon: 'success'
            });
          } else {
            throw new Error('清除失败');
          }
        } catch (error) {
          console.error('清除危险点失败:', error);
          uni.showToast({
            title: '清除失败',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 执行清空
const performClearAll = async () => {
  try {
    // 使用数据库清空函数
    const ridingRecordRepo = getRidingRecordRepository();
    const success = await clearAllDataFromDB(ridingRecordRepo.db);

    if (success) {
      uni.showToast({
        title: '已清空所有记录',
        icon: 'success'
      });
    } else {
      throw new Error('清空失败');
    }
  } catch (err) {
    console.error('清空失败:', err);
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    });
  }
};

// 生命周期
onLoad(() => {
  loadSettings();
});

onShow(() => {
  loadSettings();
});
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: var(--background-color);
  padding-bottom: 160rpx;
}

.header {
  background: var(--card-background);
  padding: 32rpx;
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

.main-content {
  padding: 32rpx;
}

.section {
  margin-bottom: 48rpx;

  .section-header {
    padding: 0 32rpx 24rpx 32rpx;

    .section-title {
      font-size: 36rpx;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .card {
    background: var(--card-background);
    border-radius: 16rpx;
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
}

.setting-item {
  padding: 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s ease;

  &.border-bottom {
    border-bottom: 1rpx solid var(--border-color);
  }

  &.vertical {
    flex-direction: column;
    align-items: stretch;
    gap: 24rpx;
  }

  &.action {
    cursor: pointer;

    &:active {
      background-color: var(--background-secondary);
    }
  }

  &.danger .label {
    color: var(--danger-color);
  }

  .label {
    font-size: 32rpx;
    color: var(--text-primary);
  }

  .picker-value {
    font-size: 28rpx;
    color: var(--text-secondary);
    padding: 8rpx 16rpx;
    border-radius: 8rpx;
    background: var(--background-secondary);

    &.disabled {
      opacity: 0.5;
      background: var(--border-color);
    }
  }

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 16rpx;
  }

  .value-highlight {
    font-size: 28rpx;
    font-weight: 700;
    color: var(--primary-color);
  }

  .action-link {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .link-text {
      font-size: 28rpx;
      color: var(--primary-color);
    }
  }

  slider {
    width: 100%;
  }
}

.item-hover {
  background: var(--background-secondary);
}
</style>
