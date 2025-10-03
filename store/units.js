/**
 * 单位设置 Store
 * 管理距离、速度、海拔单位设置
 */

import { defineStore } from 'pinia';
import { getSettingsRepository } from '@/db/repositories/index.js';
import { DISTANCE_CONVERSION, SPEED_CONVERSION } from '@/utils/constants.js';

export const useUnitsStore = defineStore('units', {
  state: () => ({
    // 单位索引：0=公制，1=英制
    distanceUnitIndex: 0,
    speedUnitIndex: 0,
    altitudeUnitIndex: 0
  }),

  getters: {
    // 距离单位标签
    distanceUnit: (state) => (state.distanceUnitIndex === 0 ? 'km' : 'mi'),

    // 小距离单位标签
    distanceUnitShort: (state) => (state.distanceUnitIndex === 0 ? 'm' : 'ft'),

    // 速度单位标签
    speedUnit: (state) => (state.speedUnitIndex === 0 ? 'km/h' : 'mph'),

    // 海拔单位标签
    altitudeUnit: (state) => (state.altitudeUnitIndex === 0 ? 'm' : 'ft'),

    /**
     * 转换距离值（不含单位）
     */
    convertDistance: (state) => (distanceKm) => {
      if (state.distanceUnitIndex === 1) {
        return distanceKm * DISTANCE_CONVERSION.KM_TO_MILE;
      }
      return distanceKm;
    },

    /**
     * 转换速度值（不含单位）
     */
    convertSpeed: (state) => (speedKmh) => {
      if (state.speedUnitIndex === 1) {
        return speedKmh * SPEED_CONVERSION.KMH_TO_MPH;
      }
      return speedKmh;
    },

    /**
     * 转换海拔值（不含单位）
     */
    convertAltitude: (state) => (altitudeM) => {
      if (state.altitudeUnitIndex === 1) {
        return altitudeM * 3.28084;
      }
      return altitudeM;
    },

    /**
     * 格式化距离（带单位）
     */
    formatDistance: (state) => (distanceKm, precision = 2) => {
      let value = distanceKm;
      let unit = 'km';

      if (state.distanceUnitIndex === 1) {
        value = distanceKm * DISTANCE_CONVERSION.KM_TO_MILE;
        unit = 'mi';
      }

      // 小于1的距离显示为米/英尺
      if (value < 1) {
        if (state.distanceUnitIndex === 0) {
          return `${(value * 1000).toFixed(0)} m`;
        } else {
          return `${(value * 5280).toFixed(0)} ft`;
        }
      }

      return `${value.toFixed(precision)} ${unit}`;
    },

    /**
     * 格式化速度（带单位）
     */
    formatSpeed: (state) => (speedKmh, precision = 1) => {
      let value = speedKmh;
      let unit = 'km/h';

      if (state.speedUnitIndex === 1) {
        value = speedKmh * SPEED_CONVERSION.KMH_TO_MPH;
        unit = 'mph';
      }

      return `${value.toFixed(precision)} ${unit}`;
    },

    /**
     * 格式化海拔（带单位）
     */
    formatAltitude: (state) => (altitudeM, precision = 0) => {
      let value = altitudeM;
      let unit = 'm';

      if (state.altitudeUnitIndex === 1) {
        value = altitudeM * 3.28084;
        unit = 'ft';
      }

      return `${value.toFixed(precision)} ${unit}`;
    }
  },

  actions: {
    /**
     * 初始化单位设置
     */
    initUnits() {
      console.log('初始化单位设置...');

      try {
        const settingsRepo = getSettingsRepository();

        this.distanceUnitIndex = settingsRepo.getSetting('distance_unit', 0);
        this.speedUnitIndex = settingsRepo.getSetting('speed_unit', 0);
        this.altitudeUnitIndex = settingsRepo.getSetting('altitude_unit', 0);

        console.log('✅ 从本地存储读取单位设置:', {
          distance: this.distanceUnitIndex,
          speed: this.speedUnitIndex,
          altitude: this.altitudeUnitIndex
        });
      } catch (error) {
        console.error('❌ 读取单位设置失败:', error);
      }
    },

    /**
     * 设置距离单位
     */
    setDistanceUnit(index) {
      this.distanceUnitIndex = index;

      try {
        const settingsRepo = getSettingsRepository();
        settingsRepo.saveSetting('distance_unit', index);
        console.log('✅ 距离单位已更新:', index === 0 ? 'km' : 'mi');
      } catch (error) {
        console.error('❌ 保存距离单位失败:', error);
      }
    },

    /**
     * 设置速度单位
     */
    setSpeedUnit(index) {
      this.speedUnitIndex = index;

      try {
        const settingsRepo = getSettingsRepository();
        settingsRepo.saveSetting('speed_unit', index);
        console.log('✅ 速度单位已更新:', index === 0 ? 'km/h' : 'mph');
      } catch (error) {
        console.error('❌ 保存速度单位失败:', error);
      }
    },

    /**
     * 设置海拔单位
     */
    setAltitudeUnit(index) {
      this.altitudeUnitIndex = index;

      try {
        const settingsRepo = getSettingsRepository();
        settingsRepo.saveSetting('altitude_unit', index);
        console.log('✅ 海拔单位已更新:', index === 0 ? 'm' : 'ft');
      } catch (error) {
        console.error('❌ 保存海拔单位失败:', error);
      }
    },

    /**
     * 刷新单位设置（从存储重新加载）
     */
    refreshUnits() {
      this.initUnits();
    }
  }
});
