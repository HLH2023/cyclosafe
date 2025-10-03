<template>
  <view class="simulate-page" :class="themeClass">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">模拟摔倒数据采集</text>
      <text class="subtitle">请在安全环境下进行数据采集</text>
    </view>

    <!-- 状态卡片 -->
    <view class="status-card">
      <view class="status-item">
        <text class="status-label">采集状态</text>
        <text class="status-value" :class="statusClass">{{ statusText }}</text>
      </view>
      <view class="status-item">
        <text class="status-label">数据点数</text>
        <text class="status-value">{{ dataCount }} / {{ bufferSize }}</text>
      </view>
      <view class="status-item">
        <text class="status-label">采集进度</text>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progress + '%' }"></view>
        </view>
        <text class="progress-text">{{ progress.toFixed(1) }}%</text>
      </view>
    </view>

    <!-- 倒计时显示 -->
    <view class="countdown-section" v-if="isCountingDown || isCollecting">
      <view class="countdown-circle">
        <text class="countdown-text">{{ countdown }}</text>
      </view>
      <text class="countdown-label">{{ countdownLabel }}</text>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section" v-if="!isCollecting && !isLabeling">
      <button
        class="btn btn-primary"
        @click="startCollection"
        :disabled="isCountingDown"
      >
        {{ isCountingDown ? '准备中...' : '开始采集 (30秒)' }}
      </button>
      <view class="tips">
        <text class="tip-text">⚠️ 提示：点击后有3秒准备时间</text>
        <text class="tip-text">📱 请在安全环境下进行模拟摔倒动作</text>
        <text class="tip-text">⏱️ 采集时长：30秒（自动停止）</text>
      </view>
    </view>

    <!-- 数据标注界面 -->
    <view class="labeling-section" v-if="isLabeling">
      <view class="label-card">
        <text class="label-title">请标注采集的数据类型</text>
        <text class="label-desc">已采集 {{ dataCount }} 个数据点</text>

        <view class="label-buttons">
          <button
            class="btn btn-danger"
            @click="labelAndUpload('fall')"
            :loading="isUploading"
          >
            🚴 摔倒数据
          </button>
          <button
            class="btn btn-success"
            @click="labelAndUpload('normal')"
            :loading="isUploading"
          >
            ✅ 正常数据
          </button>
        </view>

        <button
          class="btn btn-secondary"
          @click="discardData"
          :disabled="isUploading"
        >
          丢弃数据
        </button>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-section">
      <text class="stats-title">已上传数据统计</text>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-value">{{ stats.total_samples || 0 }}</text>
          <text class="stat-label">总样本数</text>
        </view>
        <view class="stat-item fall">
          <text class="stat-value">{{ stats.fall_samples || 0 }}</text>
          <text class="stat-label">摔倒样本</text>
        </view>
        <view class="stat-item normal">
          <text class="stat-value">{{ stats.normal_samples || 0 }}</text>
          <text class="stat-label">正常样本</text>
        </view>
      </view>
      <button class="btn btn-outline" @click="loadStats">刷新统计</button>
    </view>
  </view>
</template>

<script>
import DataCollector from '@/utils/dataCollector.js';
import { useThemeStore } from '@/store/theme';
import { mapState } from 'pinia';

export default {
  computed: {
    ...mapState(useThemeStore, ['isDark']),
    themeClass() {
      return this.isDark ? 'theme-dark' : 'theme-light';
    }
  },
  data() {
    return {
      // 数据采集器
      collector: null,

      // 状态
      isCountingDown: false,
      isCollecting: false,
      isLabeling: false,
      isUploading: false,

      // 倒计时
      countdown: 3,
      countdownLabel: '准备开始',

      // 数据统计
      dataCount: 0,
      bufferSize: 1500,
      progress: 0,

      // 数据统计
      stats: {
        total_samples: 0,
        fall_samples: 0,
        normal_samples: 0
      }
    };
  },

  computed: {
    statusText() {
      if (this.isCountingDown) return '准备中';
      if (this.isCollecting) return '采集中';
      if (this.isLabeling) return '待标注';
      return '就绪';
    },

    statusClass() {
      if (this.isCountingDown) return 'status-preparing';
      if (this.isCollecting) return 'status-collecting';
      if (this.isLabeling) return 'status-labeling';
      return 'status-ready';
    }
  },

  onLoad() {
    // 初始化数据采集器
    this.collector = new DataCollector({
      sampleRate: 50,
      bufferSize: 1500,
      onDataUpdate: this.handleDataUpdate,
      onBufferFull: this.handleBufferFull
    });

    // 加载统计信息
    this.loadStats();
  },

  onUnload() {
    // 清理资源
    if (this.collector && this.collector.isCollecting) {
      this.collector.stopCollection();
    }
  },

  methods: {
    /**
     * 开始采集流程（带3秒倒计时）
     */
    startCollection() {
      this.isCountingDown = true;
      this.countdown = 3;
      this.countdownLabel = '准备开始';

      // 倒计时
      const timer = setInterval(() => {
        this.countdown--;

        if (this.countdown === 0) {
          clearInterval(timer);
          this.countdownLabel = '正在采集...';
          this._startActualCollection();
        }
      }, 1000);
    },

    /**
     * 实际开始采集
     */
    _startActualCollection() {
      this.isCountingDown = false;
      this.isCollecting = true;
      this.countdown = 30;
      this.countdownLabel = '剩余时间';

      // 开始采集
      this.collector.startCollection();

      // 倒计时（显示用）
      const timer = setInterval(() => {
        this.countdown--;

        if (this.countdown <= 0 || !this.isCollecting) {
          clearInterval(timer);
        }
      }, 1000);
    },

    /**
     * 数据更新回调
     */
    handleDataUpdate(info) {
      this.dataCount = info.count;
      this.progress = info.progress;
    },

    /**
     * 缓冲区已满回调
     */
    handleBufferFull(data) {
      console.log('数据采集完成，共', data.length, '个数据点');
      this.isCollecting = false;
      this.isLabeling = true;

      uni.showToast({
        title: '采集完成！',
        icon: 'success'
      });
    },

    /**
     * 标注并上传数据
     */
    async labelAndUpload(label) {
      this.isUploading = true;

      try {
        const result = await this.collector.uploadData(label, 'simulate', {
          collection_method: 'simulate_page',
          device_info: uni.getSystemInfoSync()
        });

        uni.showToast({
          title: '上传成功！',
          icon: 'success'
        });

        console.log('上传结果:', result);

        // 清空缓冲区并重置状态
        this.collector.clearBuffer();
        this.resetState();

        // 刷新统计
        this.loadStats();
      } catch (error) {
        console.error('上传失败:', error);
        uni.showToast({
          title: '上传失败：' + error.message,
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.isUploading = false;
      }
    },

    /**
     * 丢弃数据
     */
    discardData() {
      uni.showModal({
        title: '确认丢弃',
        content: '确定要丢弃这次采集的数据吗？',
        success: (res) => {
          if (res.confirm) {
            this.collector.clearBuffer();
            this.resetState();
            uni.showToast({
              title: '已丢弃',
              icon: 'none'
            });
          }
        }
      });
    },

    /**
     * 重置状态
     */
    resetState() {
      this.isLabeling = false;
      this.isCollecting = false;
      this.isCountingDown = false;
      this.dataCount = 0;
      this.progress = 0;
      this.countdown = 3;
    },

    /**
     * 加载数据统计
     */
    async loadStats() {
      try {
        const stats = await this.collector.getDataStats();
        this.stats = stats;
      } catch (error) {
        console.error('加载统计失败:', error);
      }
    }
  }
};
</script>

<style scoped>
.simulate-page {
  padding: 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 状态卡片 */
.status-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.status-item {
  margin-bottom: 20rpx;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.status-value {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
}

.status-ready { color: #52c41a; }
.status-preparing { color: #faad14; }
.status-collecting { color: #1890ff; }
.status-labeling { color: #722ed1; }

.progress-bar {
  height: 20rpx;
  background: #f0f0f0;
  border-radius: 10rpx;
  overflow: hidden;
  margin-top: 10rpx;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s;
}

.progress-text {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
  text-align: right;
}

/* 倒计时 */
.countdown-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 60rpx 0;
}

.countdown-circle {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.2);
  margin-bottom: 20rpx;
}

.countdown-text {
  font-size: 80rpx;
  font-weight: bold;
  color: #667eea;
}

.countdown-label {
  font-size: 32rpx;
  color: #fff;
}

/* 操作按钮 */
.action-section {
  margin-bottom: 30rpx;
}

.btn {
  width: 100%;
  height: 90rpx;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn-danger {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.btn-success {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-outline {
  background: transparent;
  color: #fff;
  border: 2rpx solid #fff;
}

.tips {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15rpx;
  padding: 20rpx;
}

.tip-text {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 40rpx;
}

/* 数据标注界面 */
.labeling-section {
  margin-bottom: 30rpx;
}

.label-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.label-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 10rpx;
}

.label-desc {
  display: block;
  font-size: 28rpx;
  color: #999;
  text-align: center;
  margin-bottom: 30rpx;
}

.label-buttons {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.label-buttons .btn {
  flex: 1;
}

/* 数据统计 */
.stats-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  padding: 30rpx;
}

.stats-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  text-align: center;
  margin-bottom: 20rpx;
}

.stats-grid {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.stat-item {
  flex: 1;
  background: #fff;
  border-radius: 15rpx;
  padding: 20rpx;
  text-align: center;
}

.stat-item.fall {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-item.fall .stat-value,
.stat-item.fall .stat-label {
  color: #fff;
}

.stat-item.normal {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-item.normal .stat-value,
.stat-item.normal .stat-label {
  color: #fff;
}

.stat-value {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 5rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #666;
}
</style>
