/**
 * 震动反馈工具
 * 统一管理震动功能，根据设置决定是否执行震动
 */

import { getSettingsRepository } from '@/db/repositories/SettingsRepository.js';

/**
 * 检查震动是否启用
 * @returns {boolean} 震动是否启用
 */
function isVibrationEnabled() {
  try {
    const settingsRepo = getSettingsRepository();
    return settingsRepo.getSetting('vibration_enabled', true); // 默认开启
  } catch (error) {
    console.error('读取震动设置失败:', error);
    return true; // 出错时默认开启
  }
}

/**
 * 短震动（约15ms）
 * @param {Object} options 震动选项
 * @param {string} options.type 震动强度（仅iOS）: 'heavy' | 'medium' | 'light'
 */
export function vibrateShort(options = {}) {
  if (!isVibrationEnabled()) {
    console.log('震动已禁用，跳过短震动');
    return;
  }

  uni.vibrateShort({
    type: options.type || 'medium',
    success: () => {
      console.log('短震动已触发');
    },
    fail: (err) => {
      console.error('短震动失败:', err);
    }
  });
}

/**
 * 长震动（约400ms）
 */
export function vibrateLong() {
  if (!isVibrationEnabled()) {
    console.log('震动已禁用，跳过长震动');
    return;
  }

  uni.vibrateLong({
    success: () => {
      console.log('长震动已触发');
    },
    fail: (err) => {
      console.error('长震动失败:', err);
    }
  });
}

export default {
  vibrateShort,
  vibrateLong,
  isVibrationEnabled
};
