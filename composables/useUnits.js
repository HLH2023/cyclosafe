/**
 * 单位管理 Composable
 * 提供单位转换和格式化功能
 * 现在使用 Pinia store，所有页面都会响应式更新
 */

import { useUnitsStore } from '@/store/units';
import { storeToRefs } from 'pinia';

export function useUnits() {
  const unitsStore = useUnitsStore();

  // 从 store 获取响应式数据
  const { distanceUnit, distanceUnitShort, speedUnit, altitudeUnit } = storeToRefs(unitsStore);

  // 从 store 获取方法（getters 和 actions）
  const {
    convertDistance,
    convertSpeed,
    convertAltitude,
    formatDistance,
    formatSpeed,
    formatAltitude,
    refreshUnits
  } = unitsStore;

  return {
    // 单位标签（响应式）
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
