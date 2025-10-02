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
import { ref, onMounted, watch } from 'vue';
import uCharts from '@qiun/ucharts';

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

  // 获取canvas上下文
  const query = uni.createSelectorQuery();
  query.select(`#${props.canvasId}`).fields({ node: true, size: true }).exec((res) => {
    if (res && res[0]) {
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');

      // 获取设备像素比
      const dpr = uni.getSystemInfoSync().pixelRatio;
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      ctx.scale(dpr, dpr);

      canvasContext.value = ctx;

      // 创建图表
      chartInstance = new uCharts({
        type: 'line',
        context: ctx,
        width: res[0].width,
        height: res[0].height,
        categories: props.chartData.categories,
        series: props.chartData.series,
        animation: true,
        background: '#FFFFFF',
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
          fontColor: '#666666',
          fontSize: 13
        },
        xAxis: {
          disableGrid: true,
          type: 'calibration',
          gridType: 'dash',
          dashLength: 4,
          gridColor: '#E5E5E5',
          fontColor: '#9CA3AF',
          fontSize: 11,
          rotateLabel: false,
          itemCount: 5,
          scrollShow: true,
          scrollAlign: 'left',
          boundaryGap: 'center',
          axisLine: true,
          axisLineColor: '#E5E5E5',
          ...props.opts.xAxis
        },
        yAxis: {
          gridType: 'dash',
          dashLength: 4,
          gridColor: '#E5E5E5',
          fontColor: '#9CA3AF',
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
    }
  });
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
