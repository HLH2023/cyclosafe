<template>
  <text
    class="material-icons"
    :class="sizeClass"
    :style="iconStyle"
  >
    {{ name }}
  </text>
</template>

<script>
export default {
  name: 'MIcon',
  props: {
    // 图标名称（必填）
    name: {
      type: String,
      required: true
    },
    // 尺寸：sm(小) | md(中) | lg(大) | xl(超大) | 数字(px)
    size: {
      type: [String, Number],
      default: 'md'
    },
    // 颜色
    color: {
      type: String,
      default: ''
    }
  },
  computed: {
    sizeClass() {
      const presetSizes = ['sm', 'md', 'lg', 'xl', '18', '24', '36', '48'];
      if (presetSizes.includes(String(this.size))) {
        return `md-${this.size}`;
      }
      return '';
    },
    iconStyle() {
      let style = '';

      // 自定义颜色
      if (this.color) {
        style += `color: ${this.color};`;
      }

      // 自定义尺寸（数字）
      if (typeof this.size === 'number' || !['sm', 'md', 'lg', 'xl', '18', '24', '36', '48'].includes(String(this.size))) {
        style += `font-size: ${this.size}px;`;
      }

      return style;
    }
  }
};
</script>

<style scoped>
/* 组件内样式已在全局 material-icons.css 中定义 */
</style>
