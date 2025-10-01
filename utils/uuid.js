/**
 * UUID生成工具
 */

/**
 * 生成UUID
 * @returns {string} UUID字符串
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 生成短ID（用于简化显示）
 * @returns {string} 短ID字符串
 */
export function generateShortId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export default {
  generateUUID,
  generateShortId
};
