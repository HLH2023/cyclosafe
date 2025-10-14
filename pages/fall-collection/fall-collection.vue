<template>
  <view class="fall-page" :class="themeClass">
    <view class="header">
      <text class="title">摔倒数据采集</text>
      <text class="subtitle">用于上传真实骑行摔倒传感器数据</text>
    </view>

    <view class="status-card glass">
      <view class="status-row">
        <text class="status-label">采集状态</text>
        <text class="status-value" :class="statusClass">{{ statusText }}</text>
      </view>
      <view class="status-row">
        <text class="status-label">数据点数</text>
        <text class="status-value">{{ dataCount }} / {{ bufferSize }}</text>
      </view>
      <view class="progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progress + '%' }"></view>
        </view>
        <text class="progress-text">{{ progress.toFixed(1) }}%</text>
      </view>
      <view class="countdown" v-if="isCollecting">
        <text class="countdown-value">{{ countdown }}</text>
        <text class="countdown-label">剩余秒数</text>
      </view>
    </view>

    <view class="action-card">
      <button
        class="btn btn-primary"
        v-if="!isCollecting"
        @click="startCollection"
      >
        开始采集 ({{ COLLECTION_DURATION }}秒)
      </button>
      <button
        class="btn btn-danger"
        v-else
        @click="stopCollection"
      >
        提前结束并标注上传
      </button>
      <text class="tips">⚠️ 请在确保安全的情况下模拟摔倒过程</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import DataCollector from '@/utils/dataCollector.js';
import { useThemeStore } from '@/store/theme';

const COLLECTION_DURATION = 30; // 单次采集时长（秒）
const BUFFER_SIZE = 1500;

const themeStore = useThemeStore();
const themeClass = computed(() => themeStore.isDark ? 'theme-dark' : 'theme-light');

const collector = ref(null);
const isCollecting = ref(false);
const countdown = ref(COLLECTION_DURATION);
const dataCount = ref(0);
const bufferSize = ref(BUFFER_SIZE);
const progress = ref(0);
const countdownTimer = ref(null);
const accelerometerActive = ref(false);
const gyroscopeActive = ref(false);
const sensorsStarting = ref(false);
const pageActive = ref(false);
let startSensorsRequestId = 0;

const statusText = computed(() => {
  if (isCollecting.value) {
    return '采集中';
  }
  if (dataCount.value > 0) {
    return '待上传';
  }
  return '就绪';
});

const statusClass = computed(() => {
  if (isCollecting.value) {
    return 'status-collecting';
  }
  if (dataCount.value > 0) {
    return 'status-pending';
  }
  return 'status-ready';
});

const clearTimer = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
};

const resetState = () => {
  clearTimer();
  isCollecting.value = false;
  countdown.value = COLLECTION_DURATION;
};

const handleUploadDecision = async () => {
  if (!collector.value) return;

  const bufferData = collector.value.getBufferData();
  if (bufferData.length === 0) {
    return;
  }

  if (bufferData.length < 100) {
    uni.showToast({
      title: '数据点不足，未上传',
      icon: 'none'
    });
    collector.value.clearBuffer();
    dataCount.value = 0;
    progress.value = 0;
    return;
  }

  const shouldUpload = await new Promise((resolve) => {
    uni.showModal({
      title: '上传摔倒数据',
      content: `已采集${bufferData.length}个数据点，是否上传至服务器？`,
      cancelText: '暂不上传',
      confirmText: '上传',
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false)
    });
  });

  if (!shouldUpload) {
    uni.showToast({
      title: '已取消上传',
      icon: 'none'
    });
    collector.value.clearBuffer();
    dataCount.value = 0;
    progress.value = 0;
    return;
  }

  try {
    uni.showLoading({
      title: '上传中...'
    });

    await collector.value.uploadData('fall', 'fall_collection', {
      collection_method: 'fall_collection_page',
      planned_duration_seconds: COLLECTION_DURATION
    });

    uni.hideLoading();
    uni.showToast({
      title: '上传成功',
      icon: 'success'
    });
  } catch (error) {
    uni.hideLoading();
    console.error('摔倒数据上传失败:', error);
    uni.showToast({
      title: '上传失败',
      icon: 'none'
    });
  } finally {
    collector.value.clearBuffer();
    dataCount.value = 0;
    progress.value = 0;
  }
};

const stopCollection = async () => {
  if (!collector.value) return;

  if (isCollecting.value) {
    collector.value.stopCollection();
  }
  resetState();
  await handleUploadDecision();
};

const waitForSensorStartCompletion = (initialRequestId) =>
  new Promise((resolve) => {
    const checkStatus = setInterval(() => {
      const cancelled = !pageActive.value || initialRequestId !== startSensorsRequestId;
      if (!sensorsStarting.value || cancelled) {
        clearInterval(checkStatus);
        if (cancelled) {
          resolve(false);
          return;
        }
        resolve(accelerometerActive.value);
      }
    }, 100);
  });

const startSensors = async () => {
  if (!pageActive.value) {
    return false;
  }

  if (accelerometerActive.value) {
    return true;
  }

  if (sensorsStarting.value) {
    return waitForSensorStartCompletion(startSensorsRequestId);
  }

  sensorsStarting.value = true;
  const requestId = ++startSensorsRequestId;

  const accelerometerPromise = new Promise((resolve) => {
    uni.startAccelerometer({
      interval: 'game',
      success: () => {
        console.log('[FallCollection] 加速度计已启动');
        accelerometerActive.value = true;
        resolve(true);
      },
      fail: (err) => {
        console.error('[FallCollection] 加速度计启动失败:', err);
        accelerometerActive.value = false;
        uni.showToast({
          title: '加速度计启动失败',
          icon: 'none'
        });
        resolve(false);
      }
    });
  });

  const gyroscopePromise = new Promise((resolve) => {
    uni.startGyroscope({
      interval: 'game',
      success: () => {
        console.log('[FallCollection] 陀螺仪已启动');
        gyroscopeActive.value = true;
        resolve(true);
      },
      fail: (err) => {
        console.warn('[FallCollection] 陀螺仪启动失败:', err);
        gyroscopeActive.value = false;
        resolve(false);
      }
    });
  });

  const [accelerometerReady, gyroscopeReady] = await Promise.all([
    accelerometerPromise,
    gyroscopePromise
  ]);

  sensorsStarting.value = false;

  const cancelled = !pageActive.value || requestId !== startSensorsRequestId;

  if (!accelerometerReady || cancelled) {
    if (gyroscopeReady || accelerometerReady) {
      stopSensors();
    }
    return false;
  }

  return true;
};

const stopSensors = () => {
  if (accelerometerActive.value) {
    uni.stopAccelerometer({
      complete: () => {
        accelerometerActive.value = false;
        console.log('[FallCollection] 加速度计已停止');
      }
    });
  }

  if (gyroscopeActive.value) {
    uni.stopGyroscope({
      complete: () => {
        gyroscopeActive.value = false;
        console.log('[FallCollection] 陀螺仪已停止');
      }
    });
  }
};

const startCollection = async () => {
  if (!collector.value || isCollecting.value) return;

  const sensorsReady = await startSensors();
  if (!sensorsReady) {
    return;
  }

  collector.value.clearBuffer();
  dataCount.value = 0;
  progress.value = 0;

  collector.value.startCollection();
  isCollecting.value = true;
  countdown.value = COLLECTION_DURATION;

  clearTimer();
  countdownTimer.value = setInterval(async () => {
    if (countdown.value <= 1) {
      await stopCollection();
      return;
    }
    countdown.value -= 1;
  }, 1000);
};

onLoad(() => {
  pageActive.value = true;
  collector.value = new DataCollector({
    sampleRate: 50,
    bufferSize: BUFFER_SIZE,
    onDataUpdate: ({ count, bufferSize: size, progress: progressValue }) => {
      dataCount.value = count;
      bufferSize.value = size;
      progress.value = progressValue;
    },
    onBufferFull: () => {
      stopCollection();
    }
  });

  startSensors();
});

onUnload(() => {
  pageActive.value = false;
  startSensorsRequestId += 1;
  clearTimer();
  if (collector.value) {
    collector.value.stopCollection();
    collector.value.clearBuffer();
  }
  stopSensors();
});
</script>

<style lang="scss" scoped>
.fall-page {
  min-height: 100vh;
  padding: 48rpx 32rpx 80rpx;
  background: var(--background-color, #f5f5f5);
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-primary-color, #111827);
}

.subtitle {
  font-size: 26rpx;
  color: var(--text-secondary-color, #6b7280);
}

.glass {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 20rpx 40rpx rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(12px);
}

.status-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-label {
  font-size: 28rpx;
  color: var(--text-secondary-color, #6b7280);
}

.status-value {
  font-size: 32rpx;
  font-weight: 600;
}

.status-ready {
  color: #3b82f6;
}

.status-collecting {
  color: #f97316;
}

.status-pending {
  color: #10b981;
}

.progress {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-bar {
  flex: 1;
  height: 16rpx;
  background: rgba(148, 163, 184, 0.25);
  border-radius: 16rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f97316 0%, #ef4444 100%);
  border-radius: 16rpx;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 26rpx;
  color: var(--text-secondary-color, #6b7280);
}

.countdown {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8rpx;
}

.countdown-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #ef4444;
}

.countdown-label {
  font-size: 24rpx;
  color: var(--text-secondary-color, #6b7280);
}

.action-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  box-shadow: 0 10rpx 30rpx rgba(15, 23, 42, 0.05);
}

.btn {
  height: 96rpx;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  color: #ffffff;
}

.btn-danger {
  background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
  color: #ffffff;
}

.tips {
  font-size: 24rpx;
  color: var(--text-secondary-color, #6b7280);
  text-align: center;
}

.theme-dark {
  --background-color: #0f172a;
  --text-primary-color: #f9fafb;
  --text-secondary-color: #94a3b8;
  background: #0f172a;
}

.theme-dark .glass,
.theme-dark .action-card {
  background: rgba(30, 41, 59, 0.85);
  box-shadow: 0 20rpx 40rpx rgba(15, 23, 42, 0.6);
}

.theme-dark .progress-bar {
  background: rgba(71, 85, 105, 0.6);
}
</style>
