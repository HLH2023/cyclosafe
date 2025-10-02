/**
 * 小程序配置文件
 * 用于管理后端API地址、密钥等配置
 */

// 开发环境配置
const devConfig = {
  // 后端API基础地址（开发环境）
  API_BASE_URL: 'http://localhost:8000/api',

  // API密钥
  API_KEY: 'dev-test-key-2024',

  // 采样率配置
  SAMPLE_RATE: 50, // Hz

  // 缓冲区大小（30秒 * 50Hz = 1500点）
  BUFFER_SIZE: 1500,

  // 是否启用调试模式
  DEBUG: true,

  // ========== 模型配置 ==========

  // 模型自动更新配置
  MODEL_AUTO_UPDATE: {
    // 是否启用模型自动更新（默认关闭）
    enabled: false,

    // 版本检查间隔（毫秒），默认1小时
    checkInterval: 60 * 60 * 1000,

    // 是否在启动时检查更新
    checkOnStartup: false,

    // 模型文件路径（本地路径）
    localModelPath: '/static/models/fall_detection_model.json',

    // 模型版本API地址（会自动拼接API_BASE_URL）
    versionApiPath: '/model/version'
  }
};

// 生产环境配置
const prodConfig = {
  // 后端API基础地址（生产环境）
  API_BASE_URL: 'https://your-production-domain.com/api',

  // API密钥（生产环境应该从服务器获取或使用环境变量）
  API_KEY: 'your-production-api-key',

  // 采样率配置
  SAMPLE_RATE: 50, // Hz

  // 缓冲区大小
  BUFFER_SIZE: 1500,

  // 是否启用调试模式
  DEBUG: false,

  // ========== 模型配置 ==========

  // 模型自动更新配置
  MODEL_AUTO_UPDATE: {
    // 是否启用模型自动更新（生产环境也默认关闭，需手动开启）
    enabled: false,

    // 版本检查间隔（毫秒），默认1小时
    checkInterval: 60 * 60 * 1000,

    // 是否在启动时检查更新
    checkOnStartup: false,

    // 模型文件路径（本地路径）
    localModelPath: '/static/models/fall_detection_model.json',

    // 模型版本API地址（会自动拼接API_BASE_URL）
    versionApiPath: '/model/version'
  }
};

// 根据环境选择配置
// 可以通过 manifest.json 中的 define 来设置环境变量
const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

/**
 * 日志输出（仅在调试模式下）
 */
export function debugLog(...args) {
  if (config.DEBUG) {
    console.log('[Debug]', ...args);
  }
}

/**
 * 错误日志输出
 */
export function errorLog(...args) {
  console.error('[Error]', ...args);
}

/**
 * 警告日志输出
 */
export function warnLog(...args) {
  console.warn('[Warn]', ...args);
}

export default config;
