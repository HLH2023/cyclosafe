/**
 * 单位管理 Composable
 * 提供单位转换和格式化功能
 */

import { ref, computed } from 'vue';
import { getSettingsRepository } from '@/db/repositories/index.js';
import { DISTANCE_CONVERSION, SPEED_CONVERSION } from '@/utils/constants.js';

export function useUnits() {
  const settingsRepo = getSettingsRepository();

  // 获取单位设置（0=公制，1=英制）
  const distanceUnitIndex = ref(settingsRepo.getSetting('distance_unit', 0));
  const speedUnitIndex = ref(settingsRepo.getSetting('speed_unit', 0));
  const altitudeUnitIndex = ref(settingsRepo.getSetting('altitude_unit', 0));

  // 单位标签
  const distanceUnit = computed(() =>
    distanceUnitIndex.value === 0 ? 'km' : 'mi'
  );

  const distanceUnitShort = computed(() =>
    distanceUnitIndex.value === 0 ? 'm' : 'ft'
  );

  const speedUnit = computed(() =>
    speedUnitIndex.value === 0 ? 'km/h' : 'mph'
  );

  const altitudeUnit = computed(() =>
    altitudeUnitIndex.value === 0 ? 'm' : 'ft'
  );

  /**
   * 刷新单位设置（从存储重新加载）
   */
  const refreshUnits = () => {
    distanceUnitIndex.value = settingsRepo.getSetting('distance_unit', 0);
    speedUnitIndex.value = settingsRepo.getSetting('speed_unit', 0);
    altitudeUnitIndex.value = settingsRepo.getSetting('altitude_unit', 0);
  };

  /**
   * 格式化距离
   * @param {number} distanceKm - 距离（公里）
   * @param {number} precision - 小数位数
   * @returns {string} 格式化后的距离（带单位）
   */
  const formatDistance = (distanceKm, precision = 2) => {
    let value = distanceKm;
    let unit = 'km';

    if (distanceUnitIndex.value === 1) {
      // 转换为英里
      value = distanceKm * DISTANCE_CONVERSION.KM_TO_MILE;
      unit = 'mi';
    }

    // 小于1的距离显示为米/英尺
    if (value < 1) {
      if (distanceUnitIndex.value === 0) {
        // 公制：显示米
        return `${(value * 1000).toFixed(0)} m`;
      } else {
        // 英制：显示英尺
        return `${(value * 5280).toFixed(0)} ft`;
      }
    }

    return `${value.toFixed(precision)} ${unit}`;
  };

  /**
   * 格式化速度
   * @param {number} speedKmh - 速度（km/h）
   * @param {number} precision - 小数位数
   * @returns {string} 格式化后的速度（带单位）
   */
  const formatSpeed = (speedKmh, precision = 1) => {
    let value = speedKmh;
    let unit = 'km/h';

    if (speedUnitIndex.value === 1) {
      // 转换为 mph
      value = speedKmh * SPEED_CONVERSION.KMH_TO_MPH;
      unit = 'mph';
    }

    return `${value.toFixed(precision)} ${unit}`;
  };

  /**
   * 格式化海拔
   * @param {number} altitudeM - 海拔（米）
   * @param {number} precision - 小数位数
   * @returns {string} 格式化后的海拔（带单位）
   */
  const formatAltitude = (altitudeM, precision = 0) => {
    let value = altitudeM;
    let unit = 'm';

    if (altitudeUnitIndex.value === 1) {
      // 转换为英尺
      value = altitudeM * 3.28084;
      unit = 'ft';
    }

    return `${value.toFixed(precision)} ${unit}`;
  };

  /**
   * 转换距离值（不含单位）
   * @param {number} distanceKm - 距离（公里）
   * @returns {number} 转换后的距离值
   */
  const convertDistance = (distanceKm) => {
    if (distanceUnitIndex.value === 1) {
      return distanceKm * DISTANCE_CONVERSION.KM_TO_MILE;
    }
    return distanceKm;
  };

  /**
   * 转换速度值（不含单位）
   * @param {number} speedKmh - 速度（km/h）
   * @returns {number} 转换后的速度值
   */
  const convertSpeed = (speedKmh) => {
    if (speedUnitIndex.value === 1) {
      return speedKmh * SPEED_CONVERSION.KMH_TO_MPH;
    }
    return speedKmh;
  };

  /**
   * 转换海拔值（不含单位）
   * @param {number} altitudeM - 海拔（米）
   * @returns {number} 转换后的海拔值
   */
  const convertAltitude = (altitudeM) => {
    if (altitudeUnitIndex.value === 1) {
      return altitudeM * 3.28084;
    }
    return altitudeM;
  };

  return {
    // 单位标签
    distanceUnit,
    distanceUnitShort,
    speedUnit,
    altitudeUnit,

    // 格式化方法（带单位）
    formatDistance,
    formatSpeed,
    formatAltitude,

    // 转换方法（仅数值）
    convertDistance,
    convertSpeed,
    convertAltitude,

    // 刷新设置
    refreshUnits
  };
}
