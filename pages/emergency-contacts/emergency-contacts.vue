<template>
  <view class="emergency-contacts-page" :class="themeClass">
    <!-- 顶部标题栏 -->
    <view class="header">
      <button class="back-btn" @click="goBack">
        <m-icon name="arrow_back_ios_new" :size="24" :color="themeStore.isDark ? '#F9FAFB' : '#1F2937'"></m-icon>
      </button>
      <text class="title">紧急联系人</text>
      <view class="placeholder"></view>
    </view>

    <!-- 主内容区 -->
    <view class="main-content">
      <!-- 空状态 -->
      <view v-if="contacts.length === 0" class="empty-state">
        <m-icon name="contact_phone" :size="80" color="#D1D5DB"></m-icon>
        <text class="empty-text">暂无紧急联系人</text>
        <text class="empty-hint">添加紧急联系人，在检测到摔倒时可快速呼叫</text>
      </view>

      <!-- 联系人列表 -->
      <view v-else class="contacts-list">
        <view
          v-for="contact in contacts"
          :key="contact.id"
          class="contact-card"
          @longpress="showQuickMenu(contact)"
        >
          <!-- 首选标记 -->
          <view v-if="contact.isPrimary" class="primary-badge">
            <m-icon name="star" :size="16" color="#FBBF24"></m-icon>
            <text class="badge-text">首选</text>
          </view>

          <!-- 联系人信息 -->
          <view class="contact-info">
            <view class="info-header">
              <text class="contact-name">{{ contact.name }}</text>
              <view class="relationship-tag">
                <text class="tag-text">{{ contact.relationship }}</text>
              </view>
            </view>
            <text class="contact-phone">{{ contact.phone }}</text>
          </view>

          <!-- 操作按钮 -->
          <view class="contact-actions">
            <button class="action-btn call-btn" @click="handleCall(contact)">
              <m-icon name="phone" :size="20" color="#FFFFFF"></m-icon>
              <text class="btn-text">拨打</text>
            </button>
            <button class="action-btn edit-btn" @click="handleEdit(contact)">
              <m-icon name="edit" :size="18" color="#3B82F6"></m-icon>
            </button>
            <button class="action-btn delete-btn" @click="handleDelete(contact)">
              <m-icon name="delete" :size="18" color="#EF4444"></m-icon>
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部添加按钮 -->
    <view class="bottom-actions">
      <button class="add-btn" @click="showAddDialog">
        <m-icon name="add" :size="24" color="#FFFFFF"></m-icon>
        <text class="btn-text">添加紧急联系人</text>
      </button>
    </view>

    <!-- 添加/编辑弹出层 -->
    <view v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <view class="dialog-container" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">{{ isEditing ? '编辑联系人' : '添加联系人' }}</text>
          <button class="close-btn" @click="closeDialog">
            <m-icon name="close" :size="24" color="#6B7280"></m-icon>
          </button>
        </view>

        <view class="dialog-content">
          <!-- 姓名输入 -->
          <view class="form-item">
            <text class="form-label">姓名 <text class="required">*</text></text>
            <input
              class="form-input"
              v-model="formData.name"
              placeholder="请输入姓名"
              maxlength="20"
            />
          </view>

          <!-- 电话输入 -->
          <view class="form-item">
            <text class="form-label">电话 <text class="required">*</text></text>
            <input
              class="form-input"
              v-model="formData.phone"
              type="number"
              placeholder="请输入手机号"
              maxlength="11"
            />
          </view>

          <!-- 关系选择 -->
          <view class="form-item">
            <text class="form-label">关系</text>
            <picker
              :value="relationshipIndex"
              :range="relationshipOptions"
              @change="onRelationshipChange"
            >
              <view class="picker-value">
                {{ relationshipOptions[relationshipIndex] }}
              </view>
            </picker>
          </view>

          <!-- 设为首选 -->
          <view class="form-item switch-item">
            <text class="form-label">设为首选联系人</text>
            <switch :checked="formData.isPrimary" @change="onPrimaryChange" color="#3B82F6" />
          </view>
        </view>

        <view class="dialog-actions">
          <button class="dialog-btn cancel-btn" @click="closeDialog">取消</button>
          <button class="dialog-btn confirm-btn" @click="handleSubmit">确定</button>
        </view>
      </view>
    </view>

    <!-- 快捷菜单（长按） -->
    <view v-if="showMenu" class="menu-overlay" @click="closeMenu">
      <view class="quick-menu" @click.stop>
        <text class="menu-title">{{ selectedContact?.name }}</text>
        <button
          v-if="!selectedContact?.isPrimary"
          class="menu-item"
          @click="handleSetPrimary"
        >
          <m-icon name="star" :size="20" color="#FBBF24"></m-icon>
          <text class="menu-text">设为首选</text>
        </button>
        <button
          v-else
          class="menu-item"
          @click="handleCancelPrimary"
        >
          <m-icon name="star_border" :size="20" color="#6B7280"></m-icon>
          <text class="menu-text">取消首选</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useThemeStore } from '@/store/theme';
import {
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  setPrimaryContact,
  callEmergencyContact
} from '@/utils/emergencyHelper.js';
import { vibrateShort } from '@/utils/vibrationHelper.js';

// 主题
const themeStore = useThemeStore();
const themeClass = computed(() => themeStore.isDark ? 'theme-dark' : 'theme-light');

// 联系人列表
const contacts = ref([]);

// 对话框状态
const showDialog = ref(false);
const isEditing = ref(false);
const editingContactId = ref(null);

// 快捷菜单
const showMenu = ref(false);
const selectedContact = ref(null);

// 关系选项
const relationshipOptions = ['家人', '朋友', '同事'];
const relationshipIndex = ref(0);

// 表单数据
const formData = ref({
  name: '',
  phone: '',
  relationship: '家人',
  isPrimary: false
});

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 加载联系人列表
const loadContacts = () => {
  contacts.value = getEmergencyContacts();
  console.log('加载紧急联系人:', contacts.value.length, '个');
};

// 显示添加对话框
const showAddDialog = () => {
  isEditing.value = false;
  editingContactId.value = null;
  formData.value = {
    name: '',
    phone: '',
    relationship: '家人',
    isPrimary: false
  };
  relationshipIndex.value = 0;
  showDialog.value = true;
};

// 显示编辑对话框
const handleEdit = (contact) => {
  isEditing.value = true;
  editingContactId.value = contact.id;
  formData.value = {
    name: contact.name,
    phone: contact.phone,
    relationship: contact.relationship,
    isPrimary: contact.isPrimary
  };
  relationshipIndex.value = relationshipOptions.indexOf(contact.relationship);
  if (relationshipIndex.value === -1) relationshipIndex.value = 0;
  showDialog.value = true;
};

// 关闭对话框
const closeDialog = () => {
  showDialog.value = false;
  isEditing.value = false;
  editingContactId.value = null;
};

// 关系选择器变化
const onRelationshipChange = (e) => {
  relationshipIndex.value = parseInt(e.detail.value);
  formData.value.relationship = relationshipOptions[relationshipIndex.value];
};

// 首选开关变化
const onPrimaryChange = (e) => {
  formData.value.isPrimary = e.detail.value;
};

// 提交表单
const handleSubmit = () => {
  // 验证表单
  if (!formData.value.name.trim()) {
    uni.showToast({
      title: '请输入姓名',
      icon: 'none'
    });
    return;
  }

  if (!formData.value.phone.trim()) {
    uni.showToast({
      title: '请输入电话',
      icon: 'none'
    });
    return;
  }

  // 验证手机号格式（简单验证）
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(formData.value.phone)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    });
    return;
  }

  let success = false;

  if (isEditing.value) {
    // 更新联系人
    success = updateEmergencyContact(editingContactId.value, {
      name: formData.value.name.trim(),
      phone: formData.value.phone.trim(),
      relationship: formData.value.relationship,
      isPrimary: formData.value.isPrimary
    });
  } else {
    // 添加联系人
    success = addEmergencyContact({
      name: formData.value.name.trim(),
      phone: formData.value.phone.trim(),
      relationship: formData.value.relationship,
      isPrimary: formData.value.isPrimary
    });
  }

  if (success) {
    uni.showToast({
      title: isEditing.value ? '修改成功' : '添加成功',
      icon: 'success'
    });
    loadContacts();
    closeDialog();
  } else {
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    });
  }
};

// 拨打电话
const handleCall = (contact) => {
  callEmergencyContact(contact);
};

// 删除联系人
const handleDelete = (contact) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除联系人「${contact.name}」吗？`,
    confirmColor: '#EF4444',
    success: (res) => {
      if (res.confirm) {
        const success = deleteEmergencyContact(contact.id);
        if (success) {
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          });
          loadContacts();
        } else {
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 显示快捷菜单
const showQuickMenu = (contact) => {
  selectedContact.value = contact;
  showMenu.value = true;
  vibrateShort();
};

// 关闭快捷菜单
const closeMenu = () => {
  showMenu.value = false;
  selectedContact.value = null;
};

// 设为首选
const handleSetPrimary = () => {
  if (selectedContact.value) {
    const success = setPrimaryContact(selectedContact.value.id);
    if (success) {
      uni.showToast({
        title: '已设为首选',
        icon: 'success'
      });
      loadContacts();
    }
  }
  closeMenu();
};

// 取消首选
const handleCancelPrimary = () => {
  if (selectedContact.value) {
    const success = updateEmergencyContact(selectedContact.value.id, {
      isPrimary: false
    });
    if (success) {
      uni.showToast({
        title: '已取消首选',
        icon: 'success'
      });
      loadContacts();
    }
  }
  closeMenu();
};

// 页面加载
onMounted(() => {
  loadContacts();
});
</script>

<style lang="scss" scoped>
.emergency-contacts-page {
  min-height: 100vh;
  background: var(--background-color);
  padding-bottom: 160rpx;
}

.header {
  background: var(--card-background);
  padding: 32rpx;
  padding-top: calc(var(--status-bar-height) + 32rpx);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 10;

  .back-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    padding: 0;

    &::after {
      border: none;
    }
  }

  .title {
    font-size: 40rpx;
    font-weight: 700;
    color: var(--text-primary);
  }

  .placeholder {
    width: 64rpx;
  }
}

.main-content {
  padding: 32rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 32rpx;
  gap: 24rpx;

  .empty-text {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .empty-hint {
    font-size: 28rpx;
    color: var(--text-tertiary);
    text-align: center;
    max-width: 400rpx;
  }
}

.contacts-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.contact-card {
  background: var(--card-background);
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;

  .primary-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: linear-gradient(135deg, #FCD34D 0%, #FBBF24 100%);
    padding: 8rpx 16rpx;
    border-bottom-left-radius: 16rpx;
    display: flex;
    align-items: center;
    gap: 4rpx;

    .badge-text {
      font-size: 22rpx;
      color: #78350F;
      font-weight: 600;
    }
  }

  .contact-info {
    margin-bottom: 24rpx;

    .info-header {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 12rpx;
    }

    .contact-name {
      font-size: 36rpx;
      font-weight: 700;
      color: var(--text-primary);
    }

    .relationship-tag {
      background: var(--background-secondary);
      padding: 4rpx 12rpx;
      border-radius: 8rpx;

      .tag-text {
        font-size: 24rpx;
        color: var(--text-secondary);
      }
    }

    .contact-phone {
      font-size: 30rpx;
      color: var(--text-secondary);
      font-family: monospace;
    }
  }

  .contact-actions {
    display: flex;
    gap: 16rpx;
  }

  .action-btn {
    flex: 1;
    height: 72rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    border: none;
    padding: 0;

    &::after {
      border: none;
    }

    &.call-btn {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      flex: 2;

      .btn-text {
        font-size: 28rpx;
        color: #FFFFFF;
        font-weight: 600;
      }
    }

    &.edit-btn {
      background: var(--background-secondary);

      &:active {
        opacity: 0.7;
      }
    }

    &.delete-btn {
      background: var(--background-secondary);

      &:active {
        opacity: 0.7;
      }
    }
  }
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  background: linear-gradient(to top, var(--background-color) 70%, transparent);
  z-index: 5;
}

.add-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.3);
  border: none;

  &::after {
    border: none;
  }

  &:active {
    opacity: 0.8;
  }

  .btn-text {
    font-size: 32rpx;
    font-weight: 600;
    color: #FFFFFF;
  }
}

// 对话框样式
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog-container {
  width: 600rpx;
  background: var(--card-background);
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
}

.dialog-header {
  padding: 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid var(--border-color);

  .dialog-title {
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text-primary);
  }

  .close-btn {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    padding: 0;

    &::after {
      border: none;
    }
  }
}

.dialog-content {
  padding: 32rpx;
}

.form-item {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }

  &.switch-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .form-label {
    display: block;
    font-size: 28rpx;
    color: var(--text-primary);
    margin-bottom: 12rpx;
    font-weight: 600;

    .required {
      color: #EF4444;
    }
  }

  .form-input {
    width: 100%;
    height: 80rpx;
    background: var(--background-secondary);
    border-radius: 12rpx;
    padding: 0 24rpx;
    font-size: 30rpx;
    color: var(--text-primary);
  }

  .picker-value {
    width: 100%;
    height: 80rpx;
    background: var(--background-secondary);
    border-radius: 12rpx;
    padding: 0 24rpx;
    font-size: 30rpx;
    color: var(--text-primary);
    display: flex;
    align-items: center;
  }
}

.dialog-actions {
  padding: 32rpx;
  display: flex;
  gap: 16rpx;
  border-top: 1rpx solid var(--border-color);
}

.dialog-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;

  &::after {
    border: none;
  }

  &.cancel-btn {
    background: var(--background-secondary);
    color: var(--text-secondary);

    &:active {
      opacity: 0.7;
    }
  }

  &.confirm-btn {
    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
    color: #FFFFFF;

    &:active {
      opacity: 0.8;
    }
  }
}

// 快捷菜单
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}

.quick-menu {
  width: 400rpx;
  background: var(--card-background);
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);

  .menu-title {
    display: block;
    padding: 32rpx;
    font-size: 32rpx;
    font-weight: 700;
    color: var(--text-primary);
    text-align: center;
    border-bottom: 1rpx solid var(--border-color);
  }

  .menu-item {
    width: 100%;
    height: 96rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    background: transparent;
    border: none;
    padding: 0;

    &::after {
      border: none;
    }

    &:active {
      background: var(--background-secondary);
    }

    .menu-text {
      font-size: 30rpx;
      color: var(--text-primary);
    }
  }
}
</style>
