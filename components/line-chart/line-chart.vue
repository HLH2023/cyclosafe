<template>
  <view class="chart-container">
    <canvas
      :canvas-id="canvasId"
      :id="canvasId"
      class="chart-canvas"
      @touchstart="touchStart"
      @touchmove="touchMove"
      @touchend="touchEnd"
    />
  </view>
</template>

<script setup>
import { ref, onMounted, watch, computed, getCurrentInstance } from 'vue';
import { useThemeStore } from '@/store/theme';
import uCharts from '@qiun/ucharts';

// 主题管理
const themeStore = useThemeStore();
const isDark = computed(() => themeStore.isDark);

// 获取组件实例
const instance = getCurrentInstance();

// 主题相关颜色配置
const themeColors = computed(() => ({
  background: isDark.value ? '#1F2937' : '#FFFFFF',
  textPrimary: isDark.value ? '#F9FAFB' : '#1F2937',
  textSecondary: isDark.value ? '#9CA3AF' : '#6B7280',
  gridColor: isDark.value ? '#374151' : '#E5E5E5',
  legendColor: isDark.value ? '#D1D5DB' : '#666666'
}));

const props = defineProps({
  canvasId: {
    type: String,
    required: true
  },
  chartData: {
    type: Object,
    default: () => ({})
  },
  opts: {
    type: Object,
    default: () => ({})
  }
});

let chartInstance = null;
const canvasContext = ref(null);

// 初始化图表
const initChart = () => {
  if (!props.chartData || !props.chartData.categories || props.chartData.categories.length === 0) {
    console.log('图表数据为空');
    return;
  }

  // 使用旧版 Canvas API (uni-app 兼容方式)
  const ctx = uni.createCanvasContext(props.canvasId, instance.proxy);
  canvasContext.value = ctx;

  // 获取容器尺寸
  const query = uni.createSelectorQuery().in(instance.proxy);
  query.select(`#${props.canvasId}`).boundingClientRect((rect) => {
    if (rect) {
      const pixelRatio = uni.getSystemInfoSync().pixelRatio || 1;

      // 创建图表
      chartInstance = new uCharts({
        type: 'line',
        context: ctx,
        width: rect.width,
        height: rect.height,
        pixelRatio: pixelRatio,
        categories: props.chartData.categories,
        series: props.chartData.series,
        animation: true,
        background: themeColors.value.background,
        color: ['#3B82F6', '#10B981', '#F59E0B'],
        padding: [15, 15, 0, 5],
        enableScroll: false,
        legend: {
          show: true,
          position: 'top',
          float: 'center',
          padding: 5,
          margin: 5,
          backgroundColor: 'rgba(0,0,0,0)',
          borderColor: 'rgba(0,0,0,0)',
          borderWidth: 0,
          fontColor: themeColors.value.legendColor,
          fontSize: 13
        },
        xAxis: {
          disableGrid: true,
          type: 'calibration',
          gridType: 'dash',
          dashLength: 4,
          gridColor: themeColors.value.gridColor,
          fontColor: themeColors.value.textSecondary,
          fontSize: 11,
          rotateLabel: false,
          itemCount: 5,
          scrollShow: true,
          scrollAlign: 'left',
          boundaryGap: 'center',
          axisLine: true,
          axisLineColor: themeColors.value.gridColor,
          ...props.opts.xAxis
        },
        yAxis: {
          gridType: 'dash',
          dashLength: 4,
          gridColor: themeColors.value.gridColor,
          fontColor: themeColors.value.textSecondary,
          fontSize: 11,
          format: (val) => val.toFixed(0),
          axisLine: false,
          ...props.opts.yAxis
        },
        dataLabel: false,
        dataPointShape: false,
        extra: {
          line: {
            type: 'curve',
            width: 2,
            activeType: 'hollow',
            linearType: 'none',
            onShadow: false,
            animation: 'vertical'
          }
        },
        ...props.opts
      });

      console.log('图表初始化成功:', props.canvasId);
    }
  }).exec();
};

// 触摸事件
const touchStart = (e) => {
  if (chartInstance) {
    chartInstance.touchStart(e);
  }
};

const touchMove = (e) => {
  if (chartInstance) {
    chartInstance.touchMove(e);
  }
};

const touchEnd = (e) => {
  if (chartInstance) {
    chartInstance.touchEnd(e);
  }
};

// 监听数据变化
watch(() => props.chartData, () => {
  if (chartInstance) {
    chartInstance.updateData({
      categories: props.chartData.categories,
      series: props.chartData.series
    });
  } else {
    initChart();
  }
}, { deep: true });

// 监听主题变化
watch(isDark, () => {
  // 主题变化时重新初始化图表
  if (chartInstance) {
    chartInstance = null;
  }
  setTimeout(() => {
    initChart();
  }, 100);
});

onMounted(() => {
  setTimeout(() => {
    initChart();
  }, 100);
});
</script>

<style lang="scss" scoped>
.chart-container {
  width: 100%;
  height: 100%;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}
</style>
