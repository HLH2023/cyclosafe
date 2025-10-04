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
      const pixelRatio = uni.getWindowInfo().pixelRatio || 1;

      // 创建图表配置
      const chartConfig = {
        $this: instance.proxy,
        canvasId: props.canvasId,
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
        padding: [2, 2, 2, 2], // 上右下左，最小边距
        fontSize: 3, // 全局字体大小，影响坐标轴标签
        enableScroll: false,
        legend: {
          show: false // 关闭图例，节省空间
        },
        xAxis: {
          disableGrid: false,
          gridColor: themeColors.value.gridColor,
          fontColor: themeColors.value.textSecondary,
          rotateLabel: false,
          itemCount: 4, // 只显示 4 个刻度
          boundaryGap: 'justify',
          axisLine: true,
          axisLineColor: themeColors.value.gridColor,
          scrollShow: false,
          ...props.opts.xAxis
        },
        yAxis: {
          gridType: 'dash',
          dashLength: 2, // 从 4 减小到 2，更细的虚线
          gridColor: themeColors.value.gridColor,
          fontColor: themeColors.value.textSecondary,
          splitNumber: 4, // 只显示4条网格线
          format: (val) => {
            // 确保 Y 轴值不为负数
            const safeVal = Math.max(0, val);
            return safeVal.toFixed(0);
          },
          axisLine: false,
          min: 0, // 强制 Y 轴最小值为 0
          ...props.opts.yAxis
        },
        dataLabel: false,
        dataPointShape: false,
        extra: {
          line: {
            type: 'curve',
            width: 2.5, // 2.5px 粗细，平衡清晰度和空间
            activeType: 'none', // 禁用激活状态
            linearType: 'none',
            onShadow: false
          }
        }
      };

      const drawingWidth = rect.width - 2 - 2; // 宽度 - 左padding - 右padding
      const drawingHeight = rect.height - 2 - 2; // 高度 - 上padding - 下padding

      console.log('图表配置:', {
        canvasId: props.canvasId,
        containerWidth: rect.width,
        containerHeight: rect.height,
        padding: [2, 2, 2, 2],
        drawingWidth: drawingWidth,
        drawingHeight: drawingHeight,
        drawingRatio: `${((drawingWidth * drawingHeight) / (rect.width * rect.height) * 100).toFixed(1)}%`,
        categoriesCount: props.chartData.categories.length,
        seriesCount: props.chartData.series.length
      });

      // 创建图表
      chartInstance = new uCharts(chartConfig);

      console.log('图表初始化成功:', props.canvasId);
    }
  }).exec();
};

// 触摸事件（仅当 chartInstance 支持时才调用）
const touchStart = (e) => {
  if (chartInstance && typeof chartInstance.touchStart === 'function') {
    chartInstance.touchStart(e);
  }
};

const touchMove = (e) => {
  if (chartInstance && typeof chartInstance.touchMove === 'function') {
    chartInstance.touchMove(e);
  }
};

const touchEnd = (e) => {
  if (chartInstance && typeof chartInstance.touchEnd === 'function') {
    chartInstance.touchEnd(e);
  }
};

// 监听数据变化
watch(() => props.chartData, () => {
  if (chartInstance && typeof chartInstance.updateData === 'function') {
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
