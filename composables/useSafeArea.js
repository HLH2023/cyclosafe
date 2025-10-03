/**
 * 安全区域 Composable
 * 用于处理全面屏设备的安全区域适配
 */
import { ref, computed, onMounted } from 'vue';

export function useSafeArea() {
  // 系统信息
  const systemInfo = ref(null);

  // 状态栏高度（px）
  const statusBarHeight = ref(0);

  // 安全区域信息
  const safeArea = ref(null);
  const safeAreaInsets = ref({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  /**
   * 获取系统信息
   */
  const getSystemInfo = () => {
    try {
      const info = uni.getSystemInfoSync();
      systemInfo.value = info;

      // 获取状态栏高度
      statusBarHeight.value = info.statusBarHeight || 0;

      // 获取安全区域
      safeArea.value = info.safeArea || null;

      // 计算安全区域边距
      if (info.safeAreaInsets) {
        safeAreaInsets.value = info.safeAreaInsets;
      } else if (info.safeArea) {
        // 兼容旧版本API
        safeAreaInsets.value = {
          top: info.safeArea.top || 0,
          right: info.windowWidth - info.safeArea.right || 0,
          bottom: info.windowHeight - info.safeArea.bottom || 0,
          left: info.safeArea.left || 0
        };
      }

      console.log('✅ 安全区域信息:', {
        statusBarHeight: statusBarHeight.value,
        safeAreaInsets: safeAreaInsets.value,
        screenWidth: info.screenWidth,
        screenHeight: info.screenHeight,
        model: info.model
      });
    } catch (error) {
      console.error('❌ 获取系统信息失败:', error);
    }
  };

  /**
   * 状态栏高度（rpx）
   */
  const statusBarHeightRpx = computed(() => {
    // px转rpx: rpx = px * 750 / screenWidth
    if (!systemInfo.value) return 0;
    const screenWidth = systemInfo.value.screenWidth || 375;
    return Math.round((statusBarHeight.value * 750) / screenWidth);
  });

  /**
   * 顶部安全区域高度（包含状态栏，px）
   */
  const safeAreaTop = computed(() => {
    return safeAreaInsets.value.top || statusBarHeight.value;
  });

  /**
   * 顶部安全区域高度（rpx）
   */
  const safeAreaTopRpx = computed(() => {
    if (!systemInfo.value) return 0;
    const screenWidth = systemInfo.value.screenWidth || 375;
    return Math.round((safeAreaTop.value * 750) / screenWidth);
  });

  /**
   * 底部安全区域高度（px）
   */
  const safeAreaBottom = computed(() => {
    return safeAreaInsets.value.bottom || 0;
  });

  /**
   * 底部安全区域高度（rpx）
   */
  const safeAreaBottomRpx = computed(() => {
    if (!systemInfo.value) return 0;
    const screenWidth = systemInfo.value.screenWidth || 375;
    return Math.round((safeAreaBottom.value * 750) / screenWidth);
  });

  /**
   * 是否为全面屏设备（有底部安全区域）
   */
  const isFullScreen = computed(() => {
    return safeAreaBottom.value > 0;
  });

  /**
   * 是否为刘海屏/挖孔屏（顶部安全区域大于状态栏）
   */
  const hasNotch = computed(() => {
    return safeAreaTop.value > statusBarHeight.value;
  });

  /**
   * 获取自定义导航栏高度（包含状态栏）
   * @param {number} customNavHeight - 自定义导航栏内容高度（rpx），默认88rpx
   * @returns {number} 总高度（rpx）
   */
  const getCustomNavHeight = (customNavHeight = 88) => {
    return statusBarHeightRpx.value + customNavHeight;
  };

  /**
   * 获取页面内容区域的padding-top（用于避开自定义导航栏）
   * @param {number} customNavHeight - 自定义导航栏内容高度（rpx），默认88rpx
   * @returns {string} CSS值，如 "calc(var(--status-bar-height) + 88rpx)"
   */
  const getContentPaddingTop = (customNavHeight = 88) => {
    return `calc(var(--status-bar-height) + ${customNavHeight}rpx)`;
  };

  /**
   * 获取页面内容区域的padding-bottom（用于避开底部tab-bar）
   * @param {number} tabBarHeight - tab-bar高度（rpx），默认128rpx
   * @returns {string} CSS值，如 "calc(128rpx + env(safe-area-inset-bottom))"
   */
  const getContentPaddingBottom = (tabBarHeight = 128) => {
    return `calc(${tabBarHeight}rpx + env(safe-area-inset-bottom))`;
  };

  // 初始化时获取系统信息
  onMounted(() => {
    getSystemInfo();
  });

  return {
    // 原始数据
    systemInfo,
    statusBarHeight,
    safeArea,
    safeAreaInsets,

    // 计算属性
    statusBarHeightRpx,
    safeAreaTop,
    safeAreaTopRpx,
    safeAreaBottom,
    safeAreaBottomRpx,
    isFullScreen,
    hasNotch,

    // 工具方法
    getSystemInfo,
    getCustomNavHeight,
    getContentPaddingTop,
    getContentPaddingBottom
  };
}
