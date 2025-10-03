<template>
  <!-- 自定义CSS图标 -->
  <view v-if="isCustomIcon" class="custom-icon" :style="customIconStyle">
    <view v-if="name === 'play_arrow'" class="play-triangle"></view>
    <view v-if="name === 'pause'" class="pause-bars">
      <view class="pause-bar"></view>
      <view class="pause-bar"></view>
    </view>
  </view>
  <!-- uni-icons图标 -->
  <uni-icons
    v-else
    :type="iconType"
    :size="iconSize"
    :color="color"
  ></uni-icons>
</template>

<script>
/**
 * m-icon 组件 - 基于 uni-icons 的图标封装
 * 提供与 Material Icons 类似的接口，内部使用 uni-icons
 */

// Material Icons 到 uni-icons 的映射表
const ICON_MAP = {
  // 导航类
  'home': 'home-filled',
  'arrow_back': 'back',
  'arrow_back_ios_new': 'back',
  'arrow_forward': 'forward',
  'chevron_right': 'right',
  'arrow_downward': 'bottom',
  'menu': 'bars',
  'close': 'closeempty',
  'search': 'search',

  // 功能类
  'directions_bike': 'location-filled',  // 骑行用定位图标
  'settings': 'gear-filled',
  'history': 'bars',
  'location': 'location',
  'location_on': 'location-filled',  // 位置标记
  'place': 'location-filled',
  'map': 'map-filled',
  'add_location': 'location',

  // 操作类
  'delete': 'trash',
  'edit': 'compose',
  'add': 'plus',
  'remove': 'minus',
  'check': 'checkmarkempty',
  'science': 'pyq',
  'science_off': 'pyq',

  // 媒体类
  // 'play_arrow' 和 'pause' 使用自定义CSS图标，不需要映射
  'stop': 'smallcircle-filled',  // 停止按钮使用实心小圆
  'refresh': 'refresh',

  // 通信类
  'phone': 'phone',
  'email': 'email',
  'share': 'redo',

  // 状态类
  'info': 'info',
  'warning': 'info-filled',
  'error': 'closeempty',
  'report': 'info-filled',
  'check_circle': 'checkbox-filled',

  // 时间类
  'schedule': 'clock',
  'timer': 'clock',
  'alarm': 'notification',

  // 文件类
  'folder': 'folder',
  'download': 'download',
  'upload': 'upload',

  // 其他
  'star': 'star-filled',
  'favorite': 'heart-filled',
  'person': 'contact-filled',
  'notifications': 'notification',
  'battery_full': 'notification',
  'battery_horiz_075': 'notification',
  'speed': 'forward',
  'pedal_bike': 'location-filled',
  'bar_chart': 'bars',
  'route': 'map-pin'
};

export default {
  name: 'MIcon',
  props: {
    // 图标名称（Material Icons 风格）
    name: {
      type: String,
      required: true
    },
    // 尺寸
    size: {
      type: [String, Number],
      default: 24
    },
    // 颜色
    color: {
      type: String,
      default: ''
    }
  },
  computed: {
    // 是否使用自定义CSS图标
    isCustomIcon() {
      return this.name === 'play_arrow' || this.name === 'pause';
    },

    // 自定义图标容器样式
    customIconStyle() {
      const size = this.iconSize;
      return {
        width: size + 'px',
        height: size + 'px',
        '--icon-color': this.color || '#333333',
        '--icon-size': size + 'px'
      };
    },

    // 映射到 uni-icons 的图标类型
    iconType() {
      // 如果有映射，使用映射的图标
      if (ICON_MAP[this.name]) {
        return ICON_MAP[this.name];
      }

      // 如果没有映射，尝试直接使用（可能是 uni-icons 原生图标）
      return this.name;
    },

    // 处理尺寸
    iconSize() {
      if (typeof this.size === 'number') {
        return this.size;
      }

      // 预设尺寸映射
      const sizeMap = {
        'sm': 20,
        'md': 24,
        'lg': 32,
        'xl': 40,
        '18': 18,
        '24': 24,
        '36': 36,
        '48': 48
      };

      return sizeMap[this.size] || 24;
    }
  }
};
</script>

<style scoped>
/* 样式由 uni-icons 处理 */

/* 自定义图标容器 */
.custom-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 播放三角形 */
.play-triangle {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: calc(var(--icon-size) * 0.3) 0 calc(var(--icon-size) * 0.3) calc(var(--icon-size) * 0.5);
  border-color: transparent transparent transparent var(--icon-color);
  margin-left: calc(var(--icon-size) * 0.08);
}

/* 暂停两条竖线容器 */
.pause-bars {
  display: flex;
  gap: calc(var(--icon-size) * 0.15);
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 暂停竖线 */
.pause-bar {
  width: calc(var(--icon-size) * 0.2);
  height: calc(var(--icon-size) * 0.6);
  background-color: var(--icon-color);
  border-radius: calc(var(--icon-size) * 0.04);
}
</style>
