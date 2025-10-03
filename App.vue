<script>
import { useThemeStore } from '@/store/theme';
import { setupDatabase } from '@/db/database.js';

export default {
  onLaunch: async function() {
    console.log('App Launch');

    // 初始化本地存储
    await this.initDatabase();

    // 初始化主题系统
    this.initTheme();

    // 初始化应用
    this.checkPermissions();
  },
  onShow: function() {
    console.log('App Show');
  },
  onHide: function() {
    console.log('App Hide');
  },
  methods: {
    // 初始化数据库
    async initDatabase() {
      try {
        console.log('开始初始化本地存储...');
        await setupDatabase();
        console.log('✅ 本地存储初始化成功');
      } catch (error) {
        console.error('❌ 本地存储初始化失败:', error);
      }
    },

    // 初始化主题
    initTheme() {
      const themeStore = useThemeStore();
      themeStore.initTheme();

      // 监听系统主题变化
      themeStore.watchSystemTheme();

      // 监听主题变化事件
      uni.$on('themeChange', (data) => {
        console.log('主题变化事件:', data);
        // 更新页面类名
        this.updatePageClass(data.isDark);
      });
    },

    // 更新页面类名
    updatePageClass(isDark) {
      // 注意：小程序中需要通过页面实例来更新
      // 这里只是示例，实际使用时在各个页面监听
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        currentPage.$vm && (currentPage.$vm.themeClass = isDark ? 'theme-dark' : 'theme-light');
      }
    },

    // 检查必要权限
    checkPermissions() {
      uni.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.userLocation']) {
            console.log('位置权限未授权');
          }
        }
      });
    }
  }
};
</script>

<style lang="scss">
/* 全局样式 */
@import '@/uni.scss';

/* 主题系统 */
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';
@import '@/styles/common.scss';

/* Material Icons 字体 */
@import '@/static/css/material-icons.css';

page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
}

/* 通用类 */
.container {
  padding: 20rpx;
}

.text-center {
  text-align: center;
}

.flex {
  display: flex;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mt-10 {
  margin-top: 10rpx;
}

.mt-20 {
  margin-top: 20rpx;
}

.mb-10 {
  margin-bottom: 10rpx;
}

.mb-20 {
  margin-bottom: 20rpx;
}

.p-20 {
  padding: 20rpx;
}

/* 主题色 */
.primary-color {
  color: #3b82f6;
}

.success-color {
  color: #10b981;
}

.warning-color {
  color: #f59e0b;
}

.danger-color {
  color: #ef4444;
}
</style>
