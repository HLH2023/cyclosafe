/**
 * 地图配置文件
 * 腾讯位置服务配置
 */

export default {
  // 腾讯地图Key
  // 申请地址: https://lbs.qq.com/
  //
  // 注意：基础地图功能（地图显示、轨迹绘制）不需要Key
  // 只有使用高级功能（地址解析、路径规划）时才需要配置
  tencentMapKey: '', // 在这里填入你的Key

  // 地图默认配置
  defaultCenter: {
    latitude: 39.9042,  // 默认中心点纬度
    longitude: 116.4074 // 默认中心点经度
  },

  // 默认缩放级别
  defaultScale: 15,

  // 地图类型常量（仅用于定义，实际选择存储在 store/mapSettings.js）
  mapType: {
    STANDARD: 0,  // 标准地图
    SATELLITE: 1, // 卫星地图
    NIGHT: 2      // 夜间地图
  }
};
