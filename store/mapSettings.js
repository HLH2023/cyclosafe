import { defineStore } from 'pinia';
import { getSettingsRepository } from '@/db/repositories/index.js';

export const useMapSettingsStore = defineStore('mapSettings', {
  state: () => ({
    // 地图类型：0=标准, 1=卫星
    mapType: 0,
    // 轨迹颜色方案：0=经典蓝, 1=活力橙, 2=醒目绿
    trackColor: 0,
    // 是否显示危险点提醒
    showDangerPoints: true
  }),

  getters: {
    /**
     * 是否启用卫星地图
     */
    isSatelliteEnabled: (state) => {
      return state.mapType === 1;
    },

    /**
     * 获取轨迹颜色
     */
    getTrackColor: (state) => {
      const colors = ['#3B82F6', '#F59E0B', '#10B981'];
      return colors[state.trackColor] || colors[0];
    }
  },

  actions: {
    /**
     * 初始化地图设置
     */
    initMapSettings() {
      console.log('初始化地图设置...');

      try {
        const settingsRepo = getSettingsRepository();

        // 从本地存储读取设置
        this.mapType = settingsRepo.getSetting('map_type', 0);
        this.trackColor = settingsRepo.getSetting('track_color', 0);
        this.showDangerPoints = settingsRepo.getSetting('show_track', true);

        console.log('✅ 地图设置已加载:', {
          mapType: this.mapType,
          trackColor: this.trackColor,
          showDangerPoints: this.showDangerPoints
        });
      } catch (error) {
        console.error('❌ 加载地图设置失败:', error);
      }
    },

    /**
     * 设置地图类型
     * @param {number} type - 0=标准, 1=卫星
     */
    setMapType(type) {
      if (![0, 1].includes(type)) {
        console.error('无效的地图类型:', type);
        return;
      }

      console.log('切换地图类型:', type);
      this.mapType = type;

      // 保存到本地存储
      try {
        const settingsRepo = getSettingsRepository();
        settingsRepo.saveSetting('map_type', type);
        console.log('✅ 地图类型已保存');
      } catch (error) {
        console.error('❌ 保存地图类型失败:', error);
      }
    },

    /**
     * 设置轨迹颜色
     * @param {number} colorIndex - 0=经典蓝, 1=活力橙, 2=醒目绿
     */
    setTrackColor(colorIndex) {
      if (![0, 1, 2].includes(colorIndex)) {
        console.error('无效的轨迹颜色:', colorIndex);
        return;
      }

      console.log('切换轨迹颜色:', colorIndex);
      this.trackColor = colorIndex;

      // 保存到本地存储
      try {
        const settingsRepo = getSettingsRepository();
        settingsRepo.saveSetting('track_color', colorIndex);
        console.log('✅ 轨迹颜色已保存');
      } catch (error) {
        console.error('❌ 保存轨迹颜色失败:', error);
      }
    },

    /**
     * 切换危险点提醒
     * @param {boolean} enabled
     */
    setShowDangerPoints(enabled) {
      console.log('切换危险点提醒:', enabled);
      this.showDangerPoints = enabled;

      // 保存到本地存储
      try {
        const settingsRepo = getSettingsRepository();
        settingsRepo.saveSetting('show_track', enabled);
        console.log('✅ 危险点提醒设置已保存');
      } catch (error) {
        console.error('❌ 保存危险点提醒设置失败:', error);
      }
    }
  }
});
