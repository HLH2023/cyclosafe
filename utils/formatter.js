/**
 * 格式化工具类
 */

/**
 * 格式化时长
 * @param {number} seconds 秒数
 * @returns {string} 格式化后的时长 (HH:MM:SS)
 */
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * 格式化距离
 * @param {number} distance 距离（公里）
 * @param {number} precision 小数位数
 * @returns {string} 格式化后的距离
 */
export function formatDistance(distance, precision = 2) {
  if (distance < 1) {
    // 小于1km，显示米
    return `${(distance * 1000).toFixed(0)} m`;
  }

  return `${distance.toFixed(precision)} km`;
}

/**
 * 格式化速度
 * @param {number} speed 速度（km/h）
 * @param {number} precision 小数位数
 * @returns {string} 格式化后的速度
 */
export function formatSpeed(speed, precision = 1) {
  return `${speed.toFixed(precision)} km/h`;
}

/**
 * 格式化日期
 * @param {number|Date} timestamp 时间戳或日期对象
 * @param {string} format 格式（默认：YYYY-MM-DD）
 * @returns {string} 格式化后的日期
 */
export function formatDate(timestamp, format = 'YYYY-MM-DD') {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化日期时间
 * @param {number|Date} timestamp 时间戳或日期对象
 * @returns {string} 格式化后的日期时间
 */
export function formatDateTime(timestamp) {
  return formatDate(timestamp, 'YYYY-MM-DD HH:mm:ss');
}

/**
 * 格式化相对时间
 * @param {number} timestamp 时间戳
 * @returns {string} 相对时间（如：3分钟前）
 */
export function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  if (seconds > 0) return `${seconds}秒前`;

  return '刚刚';
}

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default {
  formatDuration,
  formatDistance,
  formatSpeed,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatFileSize
};
