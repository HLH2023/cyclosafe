<script>
export default {
  onLaunch: function() {
    console.log('App Launch');
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
