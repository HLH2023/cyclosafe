<template>
  <view class="danger-points-page">
    <!-- 顶部标题栏 -->
    <view class="header">
      <button class="back-btn" @click="goBack">
        <m-icon name="arrow_back_ios_new" :size="24" color="#1F2937"></m-icon>
      </button>
      <text class="title">危险点管理</text>
      <view class="placeholder"></view>
    </view>

    <!-- 地图区域 -->
    <view class="map-container">
      <map
        id="danger-map"
        :longitude="mapCenter.longitude"
        :latitude="mapCenter.latitude"
        :scale="mapScale"
        :markers="markers"
        :show-location="true"
        @markertap="onMarkerTap"
        @tap="onMapTap"
        @regionchange="onRegionChange"
        style="width: 100%; height: 100%;"
      />

      <!-- 添加模式的可拖动标记 -->
      <view v-if="isAddingMode" class="center-marker">
        <m-icon name="location_on" :size="48" color="#EF4444"></m-icon>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button v-if="!isAddingMode" class="add-btn" @click="startAddMode">
        <m-icon name="add_location" :size="28" color="#FFFFFF"></m-icon>
        <text class="btn-text">添加危险点</text>
      </button>
      <view v-else class="add-mode-btns">
        <button class="cancel-btn" @click="cancelAddMode">
          <text>取消</text>
        </button>
        <button class="confirm-btn" @click="confirmAddPoint">
          <text>确认位置</text>
        </button>
      </view>
    </view>

    <!-- 危险点信息弹出层 -->
    <view v-if="showInfoPopup" class="popup-overlay" @click="closeInfoPopup">
      <view class="info-popup" @click.stop>
        <view class="popup-header">
          <text class="popup-title">{{ selectedPoint.name }}</text>
          <button class="close-btn" @click="closeInfoPopup">
            <m-icon name="close" :size="24" color="#6B7280"></m-icon>
          </button>
        </view>
        <view class="popup-content">
          <view class="info-row">
            <text class="info-label">类型：</text>
            <text class="info-value">{{ getDangerTypeText(selectedPoint.dangerType) }}</text>
          </view>
          <view class="info-row" v-if="selectedPoint.speed > 0">
            <text class="info-label">速度：</text>
            <text class="info-value">{{ selectedPoint.speed.toFixed(1) }} km/h</text>
          </view>
          <view class="info-row">
            <text class="info-label">时间：</text>
            <text class="info-value">{{ formatDateTime(selectedPoint.createdAt) }}</text>
          </view>
        </view>
        <view class="popup-actions">
          <button class="action-btn rename-btn" @click="startRename">
            <m-icon name="edit" :size="20" color="#3B82F6"></m-icon>
            <text>重命名</text>
          </button>
          <button class="action-btn delete-btn" @click="confirmDelete">
            <m-icon name="delete" :size="20" color="#EF4444"></m-icon>
            <text>删除</text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getDangerPointRepository } from '@/db/repositories/index.js';
import { generateUUID } from '@/utils/uuid.js';

// 地图中心和缩放
const mapCenter = ref({
  longitude: 116.404,
  latitude: 39.915
});
const mapScale = ref(15);

// 危险点数据
const dangerPoints = ref([]);
const selectedPoint = ref(null);
const showInfoPopup = ref(false);

// 添加模式
const isAddingMode = ref(false);
const newPointLocation = ref(null);

// 地图标记
const markers = computed(() => {
  return dangerPoints.value.map((point, index) => ({
    id: index,
    latitude: point.latitude,
    longitude: point.longitude,
    iconPath: '/static/danger-marker.png', // 可选，使用默认标记
    width: 32,
    height: 32,
    callout: {
      content: point.name,
      color: '#1F2937',
      fontSize: 12,
      borderRadius: 4,
      bgColor: '#FFFFFF',
      padding: 8,
      display: 'ALWAYS'
    }
  }));
});

// 加载危险点
const loadDangerPoints = () => {
  try {
    const repo = getDangerPointRepository();
    dangerPoints.value = repo.getAllDangerPoints();

    // 如果有危险点，将地图中心设置为第一个危险点
    if (dangerPoints.value.length > 0) {
      const firstPoint = dangerPoints.value[0];
      mapCenter.value = {
        longitude: firstPoint.longitude,
        latitude: firstPoint.latitude
      };
    } else {
      // 否则获取当前位置
      getCurrentLocation();
    }
  } catch (err) {
    console.error('加载危险点失败:', err);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  }
};

// 获取当前位置
const getCurrentLocation = () => {
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      mapCenter.value = {
        longitude: res.longitude,
        latitude: res.latitude
      };
    },
    fail: (err) => {
      console.error('获取位置失败:', err);
    }
  });
};

// 标记点击
const onMarkerTap = (e) => {
  const markerId = e.detail.markerId;
  const point = dangerPoints.value[markerId];
  if (point) {
    selectedPoint.value = point;
    showInfoPopup.value = true;
  }
};

// 地图点击
const onMapTap = (e) => {
  if (isAddingMode.value) {
    // 添加模式下不处理
    return;
  }
};

// 地图区域变化
const onRegionChange = (e) => {
  if (e.type === 'end' && e.causedBy === 'drag') {
    // 用户拖动地图，更新中心点
    const mapContext = uni.createMapContext('danger-map');
    mapContext.getCenterLocation({
      success: (res) => {
        newPointLocation.value = {
          longitude: res.longitude,
          latitude: res.latitude
        };
      }
    });
  }
};

// 开始添加模式
const startAddMode = () => {
  isAddingMode.value = true;
  newPointLocation.value = { ...mapCenter.value };
};

// 取消添加模式
const cancelAddMode = () => {
  isAddingMode.value = false;
  newPointLocation.value = null;
};

// 确认添加危险点
const confirmAddPoint = () => {
  uni.showModal({
    title: '添加危险点',
    editable: true,
    placeholderText: '请输入危险点名称',
    success: async (res) => {
      if (res.confirm && res.content) {
        const name = res.content.trim() || `危险点 ${dangerPoints.value.length + 1}`;

        try {
          const repo = getDangerPointRepository();
          const newPoint = {
            id: generateUUID(),
            name: name,
            latitude: newPointLocation.value.latitude,
            longitude: newPointLocation.value.longitude,
            danger_type: 'manual',
            speed: 0,
            record_id: null
          };

          await repo.saveDangerPoint(newPoint);

          uni.showToast({
            title: '添加成功',
            icon: 'success'
          });

          // 重新加载
          loadDangerPoints();
          cancelAddMode();
        } catch (err) {
          console.error('添加危险点失败:', err);
          uni.showToast({
            title: '添加失败',
            icon: 'none'
          });
        }
      } else {
        cancelAddMode();
      }
    }
  });
};

// 关闭信息弹窗
const closeInfoPopup = () => {
  showInfoPopup.value = false;
  selectedPoint.value = null;
};

// 开始重命名
const startRename = () => {
  uni.showModal({
    title: '重命名危险点',
    editable: true,
    placeholderText: '请输入新名称',
    content: selectedPoint.value.name,
    success: (res) => {
      if (res.confirm && res.content) {
        const newName = res.content.trim();
        if (newName) {
          const repo = getDangerPointRepository();
          const success = repo.updateDangerPointName(selectedPoint.value.id, newName);

          if (success) {
            uni.showToast({
              title: '重命名成功',
              icon: 'success'
            });
            loadDangerPoints();
            closeInfoPopup();
          } else {
            uni.showToast({
              title: '重命名失败',
              icon: 'none'
            });
          }
        }
      }
    }
  });
};

// 确认删除
const confirmDelete = () => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除"${selectedPoint.value.name}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const repo = getDangerPointRepository();
          const success = await repo.deleteDangerPoint(selectedPoint.value.id);

          if (success) {
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            });
            loadDangerPoints();
            closeInfoPopup();
          } else {
            uni.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        } catch (err) {
          console.error('删除危险点失败:', err);
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 获取危险类型文本
const getDangerTypeText = (type) => {
  const typeMap = {
    fall: '摔倒检测',
    hard_brake: '急刹车',
    manual: '手动添加'
  };
  return typeMap[type] || '未知';
};

// 格式化时间
const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 返回
const goBack = () => {
  uni.navigateBack();
};

// 生命周期
onMounted(() => {
  loadDangerPoints();
});
</script>

<style lang="scss" scoped>
.danger-points-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F3F4F6;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  background: #FFFFFF;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

  .back-btn {
    padding: 0;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      border: none;
    }
  }

  .title {
    font-size: 36rpx;
    font-weight: 600;
    color: #1F2937;
  }

  .placeholder {
    width: 48rpx;
  }
}

.map-container {
  flex: 1;
  position: relative;
  min-height: 0;
}

.center-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -100%);
  z-index: 10;
  pointer-events: none;
}

.bottom-bar {
  padding: 32rpx;
  background: #FFFFFF;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.04);

  .add-btn {
    width: 100%;
    background: #EF4444;
    border-radius: 16rpx;
    padding: 32rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    transition: all 0.3s ease;

    &::after {
      border: none;
    }

    .btn-text {
      font-size: 32rpx;
      font-weight: 600;
      color: #FFFFFF;
    }

    &:active {
      background: #DC2626;
    }
  }

  .add-mode-btns {
    display: flex;
    gap: 24rpx;

    button {
      flex: 1;
      padding: 28rpx;
      border-radius: 12rpx;
      border: none;
      font-size: 30rpx;
      font-weight: 600;

      &::after {
        border: none;
      }
    }

    .cancel-btn {
      background: #E5E7EB;
      color: #6B7280;

      &:active {
        background: #D1D5DB;
      }
    }

    .confirm-btn {
      background: #3B82F6;
      color: #FFFFFF;

      &:active {
        background: #2563EB;
      }
    }
  }
}

// 弹出层
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.info-popup {
  width: 100%;
  background: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  padding: 48rpx;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;

  .popup-title {
    font-size: 40rpx;
    font-weight: 700;
    color: #1F2937;
  }

  .close-btn {
    padding: 0;
    background: transparent;
    border: none;

    &::after {
      border: none;
    }
  }
}

.popup-content {
  margin-bottom: 32rpx;

  .info-row {
    display: flex;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #E5E7EB;

    &:last-child {
      border-bottom: none;
    }

    .info-label {
      font-size: 28rpx;
      color: #6B7280;
      width: 150rpx;
    }

    .info-value {
      flex: 1;
      font-size: 28rpx;
      color: #1F2937;
      font-weight: 500;
    }
  }
}

.popup-actions {
  display: flex;
  gap: 24rpx;

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 28rpx;
    border-radius: 12rpx;
    border: none;
    font-size: 28rpx;
    font-weight: 600;

    &::after {
      border: none;
    }
  }

  .rename-btn {
    background: rgba(59, 130, 246, 0.1);
    color: #3B82F6;

    &:active {
      background: rgba(59, 130, 246, 0.2);
    }
  }

  .delete-btn {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;

    &:active {
      background: rgba(239, 68, 68, 0.2);
    }
  }
}
</style>
