/**
 * 地图配置文件示例
 * 使用方法：
 * 1. 复制此文件为 map.config.js
 * 2. 在 map.config.js 中填入你的腾讯地图Key
 */

export default {
  // 腾讯地图Key（如需使用高级功能）
  tencentMapKey: 'YOUR_TENCENT_MAP_KEY_HERE',

  // 地图默认配置
  defaultCenter: {
    latitude: 39.9042,
    longitude: 116.4074
  },

  defaultScale: 15,

  mapType: {
    STANDARD: 0,
    SATELLITE: 1
  }
};
