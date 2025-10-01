/**
 * GPS计算工具类
 */

import { EARTH_RADIUS, SPEED_CONVERSION } from './constants';

/**
 * 使用Haversine公式计算两点间距离
 * @param {number} lat1 纬度1
 * @param {number} lon1 经度1
 * @param {number} lat2 纬度2
 * @param {number} lon2 经度2
 * @returns {number} 距离（公里）
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS * c;

  return distance;
}

/**
 * 角度转弧度
 * @param {number} degrees 角度
 * @returns {number} 弧度
 */
function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * 计算速度（基于距离和时间）
 * @param {number} distance 距离（米）
 * @param {number} timeInterval 时间间隔（秒）
 * @returns {number} 速度（km/h）
 */
export function calculateSpeed(distance, timeInterval) {
  if (timeInterval === 0) return 0;

  const speedMps = distance / timeInterval; // m/s
  const speedKmh = speedMps * SPEED_CONVERSION.MPS_TO_KMH; // km/h

  return speedKmh;
}

/**
 * 计算平均速度
 * @param {number} totalDistance 总距离（公里）
 * @param {number} totalTime 总时间（秒）
 * @returns {number} 平均速度（km/h）
 */
export function calculateAvgSpeed(totalDistance, totalTime) {
  if (totalTime === 0) return 0;

  return (totalDistance / totalTime) * 3600;
}

/**
 * 计算海拔变化（爬升和下降）
 * @param {Array} trackPoints 轨迹点数组
 * @returns {Object} { ascent: 爬升, descent: 下降 }
 */
export function calculateElevationChange(trackPoints) {
  let ascent = 0;
  let descent = 0;

  for (let i = 1; i < trackPoints.length; i++) {
    const prev = trackPoints[i - 1];
    const curr = trackPoints[i];

    if (!prev.altitude || !curr.altitude) continue;

    const elevationDiff = curr.altitude - prev.altitude;

    if (elevationDiff > 0) {
      ascent += elevationDiff;
    } else {
      descent += Math.abs(elevationDiff);
    }
  }

  return { ascent, descent };
}

/**
 * 判断轨迹点是否应该被记录
 * @param {Object} newPoint 新轨迹点
 * @param {Object} lastPoint 上一个轨迹点
 * @param {Object} options 选项
 * @returns {boolean} 是否应该记录
 */
export function shouldRecordPoint(newPoint, lastPoint, options = {}) {
  const {
    minDistance = 5,  // 最小距离（米）
    minInterval = 3000,  // 最小时间间隔（毫秒）
    maxAccuracy = 50  // 最大精度（米）
  } = options;

  // 检查精度
  if (newPoint.accuracy > maxAccuracy) {
    return false;
  }

  // 第一个点
  if (!lastPoint) {
    return true;
  }

  // 检查时间间隔
  const timeDiff = newPoint.timestamp - lastPoint.timestamp;
  if (timeDiff < minInterval) {
    return false;
  }

  // 检查距离
  const distance = calculateDistance(
    lastPoint.latitude,
    lastPoint.longitude,
    newPoint.latitude,
    newPoint.longitude
  );

  const distanceMeters = distance * 1000;

  return distanceMeters >= minDistance;
}

/**
 * 根据速度获取颜色
 * @param {number} speed 速度（km/h）
 * @returns {string} 颜色值
 */
export function getSpeedColor(speed) {
  if (speed < 15) return '#22C55E'; // 绿色
  if (speed < 25) return '#3B82F6'; // 蓝色
  return '#EF4444'; // 红色
}

/**
 * 计算轨迹边界框
 * @param {Array} trackPoints 轨迹点数组
 * @returns {Object} { minLat, maxLat, minLon, maxLon }
 */
export function calculateBounds(trackPoints) {
  if (trackPoints.length === 0) {
    return null;
  }

  let minLat = trackPoints[0].latitude;
  let maxLat = trackPoints[0].latitude;
  let minLon = trackPoints[0].longitude;
  let maxLon = trackPoints[0].longitude;

  trackPoints.forEach(point => {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  });

  return { minLat, maxLat, minLon, maxLon };
}

/**
 * 计算轨迹中心点
 * @param {Array} trackPoints 轨迹点数组
 * @returns {Object} { latitude, longitude }
 */
export function calculateCenter(trackPoints) {
  if (trackPoints.length === 0) {
    return null;
  }

  const bounds = calculateBounds(trackPoints);

  return {
    latitude: (bounds.minLat + bounds.maxLat) / 2,
    longitude: (bounds.minLon + bounds.maxLon) / 2
  };
}

export default {
  calculateDistance,
  calculateSpeed,
  calculateAvgSpeed,
  calculateElevationChange,
  shouldRecordPoint,
  getSpeedColor,
  calculateBounds,
  calculateCenter
};
