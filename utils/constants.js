/**
 * 常量定义
 */

// 速度单位转换
export const SPEED_CONVERSION = {
  MPS_TO_KMH: 3.6,  // m/s 转 km/h
  KMH_TO_MPH: 0.621371  // km/h 转 mph
};

// 距离单位转换
export const DISTANCE_CONVERSION = {
  KM_TO_MILE: 0.621371  // km 转 mile
};

// 地球半径（公里）
export const EARTH_RADIUS = 6371;

// GPS精度阈值（米）
export const GPS_ACCURACY_THRESHOLD = 50;

// 最小记录距离（米）
export const MIN_RECORD_DISTANCE = 5;

// 最小记录时间间隔（毫秒）
export const MIN_RECORD_INTERVAL = 3000;

// 最小骑行速度（km/h）
export const MIN_RIDING_SPEED = 1;

// 安全检测阈值
export const SAFETY_THRESHOLDS = {
  // 急刹车检测
  HARD_BRAKING_ACC: 6,  // 加速度阈值（m/s²）
  HARD_BRAKING_SPEED_DROP: 15,  // 速度骤降阈值（km/h/s）

  // 摔倒检测
  FALL_ACC: 15,  // 加速度阈值（m/s²）
  FALL_GYRO: 200,  // 角速度阈值（°/s）

  // 速度预警
  DEFAULT_SPEED_WARNING: 40  // 默认速度预警阈值（km/h）
};

// 传感器采样频率
export const SENSOR_INTERVAL = {
  GAME: 'game',  // 20ms/次（50Hz）
  UI: 'ui',      // 60ms/次（16Hz）
  NORMAL: 'normal'  // 200ms/次（5Hz）
};

// 存储键名
export const STORAGE_KEYS = {
  RIDING_LIST: 'riding_list',
  RIDING_RECORD_PREFIX: 'riding_',
  DISTANCE_UNIT: 'distance_unit',
  MAP_TYPE: 'map_type',
  SPEED_THRESHOLD: 'speed_threshold',
  VIBRATION_ENABLED: 'vibration_enabled',
  EMERGENCY_CONTACTS: 'emergency_contacts'
};

// 地图配置
export const MAP_CONFIG = {
  DEFAULT_SCALE: 15,
  MIN_SCALE: 5,
  MAX_SCALE: 18
};

// 颜色配置
export const COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',

  // 速度颜色编码
  SPEED_SLOW: '#22C55E',    // < 15 km/h
  SPEED_MEDIUM: '#3B82F6',  // 15-25 km/h
  SPEED_FAST: '#EF4444'     // > 25 km/h
};

export default {
  SPEED_CONVERSION,
  DISTANCE_CONVERSION,
  EARTH_RADIUS,
  GPS_ACCURACY_THRESHOLD,
  MIN_RECORD_DISTANCE,
  MIN_RECORD_INTERVAL,
  MIN_RIDING_SPEED,
  SAFETY_THRESHOLDS,
  SENSOR_INTERVAL,
  STORAGE_KEYS,
  MAP_CONFIG,
  COLORS
};
