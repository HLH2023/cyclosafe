<template>
  <uni-icons
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
  'arrow_forward': 'forward',
  'menu': 'bars',
  'close': 'closeempty',
  'search': 'search',

  // 功能类
  'directions_bike': 'location-filled',  // 骑行用定位图标
  'settings': 'gear-filled',
  'history': 'bars',
  'location': 'location',
  'map': 'map-filled',

  // 操作类
  'delete': 'trash',
  'edit': 'compose',
  'add': 'plus',
  'remove': 'minus',
  'check': 'checkmarkempty',

  // 媒体类
  'play_arrow': 'play-filled',
  'pause': 'pause-filled',
  'stop': 'stop-filled',
  'refresh': 'refresh',

  // 通信类
  'phone': 'phone',
  'email': 'email',
  'share': 'redo',

  // 状态类
  'info': 'info',
  'warning': 'info',
  'error': 'closeempty',
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
  'speed': 'forward'
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
</style>
