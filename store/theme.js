import { defineStore } from 'pinia';
import { getSettingsRepository } from '@/db/repositories/index.js';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    // 主题模式：'auto' | 'light' | 'dark'
    mode: 'auto',
    // 当前是否为暗黑模式
    isDark: false,
    // 系统主题（从系统获取）
    systemTheme: 'light'
  }),

  getters: {
    // 获取当前生效的主题
    currentTheme: (state) => {
      if (state.mode === 'auto') {
        return state.systemTheme;
      }
      return state.mode;
    },

    // 主题相关的 CSS 类名
    themeClass: (state) => {
      return state.isDark ? 'theme-dark' : 'theme-light';
    }
  },

  actions: {
    /**
     * 初始化主题
     */
    initTheme() {
      console.log('初始化主题系统...');

      // 从本地存储读取用户设置
      try {
        const settingsRepo = getSettingsRepository();
        const savedMode = settingsRepo.getSetting('theme_mode', 'auto');
        if (savedMode && ['auto', 'light', 'dark'].includes(savedMode)) {
          this.mode = savedMode;
        }
        console.log('✅ 从本地存储读取主题设置:', savedMode);
      } catch (error) {
        console.error('❌ 读取主题设置失败:', error);
      }

      // 获取系统主题
      this.getSystemTheme();

      // 应用主题
      this.applyTheme();

      console.log(`主题初始化完成 - 模式: ${this.mode}, 暗黑: ${this.isDark}`);
    },

    /**
     * 获取系统主题
     */
    getSystemTheme() {
      try {
        const systemInfo = uni.getSystemInfoSync();

        // 微信小程序支持 theme 属性（仅 iOS/Android 部分版本支持）
        if (systemInfo.theme) {
          this.systemTheme = systemInfo.theme; // 'light' 或 'dark'
          console.log('系统主题:', this.systemTheme);
        } else {
          // 默认浅色主题
          this.systemTheme = 'light';
          console.log('系统不支持主题检测，使用默认浅色主题');
        }
      } catch (error) {
        console.error('获取系统主题失败:', error);
        this.systemTheme = 'light';
      }
    },

    /**
     * 设置主题模式
     * @param {string} mode - 'auto' | 'light' | 'dark'
     */
    setMode(mode) {
      if (!['auto', 'light', 'dark'].includes(mode)) {
        console.error('无效的主题模式:', mode);
        return;
      }

      console.log('切换主题模式:', mode);
      this.mode = mode;

      // 保存到本地存储
      try {
        const settingsRepo = getSettingsRepository();
        settingsRepo.saveSetting('theme_mode', mode);
        console.log('✅ 主题设置已保存到本地存储:', mode);
      } catch (error) {
        console.error('❌ 保存主题设置失败:', error);
      }

      // 应用主题
      this.applyTheme();
    },

    /**
     * 应用主题
     */
    applyTheme() {
      // 确定当前应该使用的主题
      let targetTheme;
      if (this.mode === 'auto') {
        targetTheme = this.systemTheme;
      } else {
        targetTheme = this.mode;
      }

      // 更新 isDark 状态
      this.isDark = targetTheme === 'dark';

      // 应用到页面
      this.updatePageTheme();

      console.log('主题已应用:', targetTheme, '暗黑模式:', this.isDark);
    },

    /**
     * 更新页面主题
     */
    updatePageTheme() {
      // 获取页面实例
      const pages = getCurrentPages();
      if (pages.length === 0) {
        console.warn('当前没有页面实例');
        return;
      }

      // 设置页面样式类名
      // 注意：小程序中无法直接操作 document，需要通过其他方式
      // 可以在页面的 onShow 中监听 themeStore 的变化来更新样式

      // 发送主题变化事件
      uni.$emit('themeChange', {
        isDark: this.isDark,
        theme: this.currentTheme
      });
    },

    /**
     * 切换暗黑模式（快捷方法）
     */
    toggleDark() {
      const newMode = this.isDark ? 'light' : 'dark';
      this.setMode(newMode);
    },

    /**
     * 监听系统主题变化
     */
    watchSystemTheme() {
      // 微信小程序支持监听主题变化
      uni.onThemeChange && uni.onThemeChange((res) => {
        console.log('系统主题变化:', res.theme);
        this.systemTheme = res.theme;

        // 如果当前是自动模式，重新应用主题
        if (this.mode === 'auto') {
          this.applyTheme();
        }
      });
    }
  }
});
