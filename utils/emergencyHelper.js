/**
 * 紧急联系人辅助工具
 * 负责紧急呼叫相关的逻辑处理
 */

import { getSettingsRepository } from '@/db/repositories/SettingsRepository.js';

// 倒计时时长（毫秒）
const COUNTDOWN_DURATION = 10000; // 10秒

// 倒计时定时器
let countdownTimer = null;

/**
 * 获取所有紧急联系人
 * @returns {Array} 紧急联系人列表
 */
export function getEmergencyContacts() {
  try {
    const settingsRepo = getSettingsRepository();
    const contacts = settingsRepo.getSetting('emergency_contacts', []);
    return Array.isArray(contacts) ? contacts : [];
  } catch (error) {
    console.error('获取紧急联系人失败:', error);
    return [];
  }
}

/**
 * 保存紧急联系人列表
 * @param {Array} contacts 联系人列表
 * @returns {boolean} 是否保存成功
 */
export function saveEmergencyContacts(contacts) {
  try {
    const settingsRepo = getSettingsRepository();
    return settingsRepo.saveSetting('emergency_contacts', contacts);
  } catch (error) {
    console.error('保存紧急联系人失败:', error);
    return false;
  }
}

/**
 * 获取首选紧急联系人
 * @returns {Object|null} 首选联系人对象，如果没有则返回第一个联系人
 */
export function getPrimaryContact() {
  const contacts = getEmergencyContacts();

  if (contacts.length === 0) {
    return null;
  }

  // 查找首选联系人
  const primary = contacts.find(c => c.isPrimary);

  // 如果有首选联系人，返回它；否则返回第一个
  return primary || contacts[0];
}

/**
 * 拨打紧急联系人电话
 * @param {Object} contact 联系人对象
 * @returns {Promise} 拨打结果
 */
export function callEmergencyContact(contact) {
  return new Promise((resolve, reject) => {
    if (!contact || !contact.phone) {
      uni.showToast({
        title: '联系人信息不完整',
        icon: 'none'
      });
      reject(new Error('联系人信息不完整'));
      return;
    }

    uni.makePhoneCall({
      phoneNumber: contact.phone,
      success: () => {
        console.log('成功拨打电话:', contact.phone);
        resolve();
      },
      fail: (err) => {
        console.error('拨打电话失败:', err);
        uni.showToast({
          title: '拨打失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

/**
 * 显示紧急呼叫倒计时对话框
 * @param {Object} dangerInfo 危险信息 { type: 'fall'|'hard_brake', location: {...}, speed: 0 }
 */
export function showEmergencyCountdown(dangerInfo = {}) {
  // 清除之前的倒计时
  if (countdownTimer) {
    clearTimeout(countdownTimer);
    countdownTimer = null;
  }

  // 获取首选联系人
  const contact = getPrimaryContact();

  if (!contact) {
    // 如果没有紧急联系人，仅提示
    uni.showModal({
      title: '检测到危险！',
      content: '未设置紧急联系人，请前往设置页面添加',
      showCancel: false,
      confirmText: '知道了'
    });
    return;
  }

  // 震动提醒
  uni.vibrateShort({
    type: 'heavy'
  });

  // 危险类型描述
  const dangerTypeText = dangerInfo.type === 'fall' ? '摔倒' : '急刹车';

  // 启动倒计时（10秒后自动拨打）
  countdownTimer = setTimeout(() => {
    console.log('倒计时结束，自动拨打紧急电话');
    callEmergencyContact(contact);
    countdownTimer = null;
  }, COUNTDOWN_DURATION);

  // 显示对话框
  uni.showModal({
    title: `检测到${dangerTypeText}！`,
    content: `${Math.floor(COUNTDOWN_DURATION / 1000)}秒后将呼叫紧急联系人「${contact.name}」\n如无需帮助请点击取消`,
    confirmText: '立即呼叫',
    confirmColor: '#EF4444',
    cancelText: '我没事',
    success: (res) => {
      if (res.confirm) {
        // 用户点击"立即呼叫"
        if (countdownTimer) {
          clearTimeout(countdownTimer);
          countdownTimer = null;
        }
        callEmergencyContact(contact);
      } else if (res.cancel) {
        // 用户点击"我没事"，取消倒计时
        if (countdownTimer) {
          clearTimeout(countdownTimer);
          countdownTimer = null;
          console.log('用户取消紧急呼叫');
        }
      }
    },
    fail: () => {
      // 对话框显示失败，清除倒计时
      if (countdownTimer) {
        clearTimeout(countdownTimer);
        countdownTimer = null;
      }
    }
  });
}

/**
 * 取消紧急呼叫倒计时
 */
export function cancelEmergencyCountdown() {
  if (countdownTimer) {
    clearTimeout(countdownTimer);
    countdownTimer = null;
    console.log('紧急呼叫倒计时已取消');
  }
}

/**
 * 添加紧急联系人
 * @param {Object} contact 联系人对象 { name, phone, relationship, isPrimary }
 * @returns {boolean} 是否添加成功
 */
export function addEmergencyContact(contact) {
  try {
    const contacts = getEmergencyContacts();

    // 如果设置为首选，取消其他联系人的首选状态
    if (contact.isPrimary) {
      contacts.forEach(c => {
        c.isPrimary = false;
      });
    }

    // 添加时间戳
    const newContact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    contacts.push(newContact);

    return saveEmergencyContacts(contacts);
  } catch (error) {
    console.error('添加紧急联系人失败:', error);
    return false;
  }
}

/**
 * 更新紧急联系人
 * @param {string} contactId 联系人ID
 * @param {Object} updates 更新的字段
 * @returns {boolean} 是否更新成功
 */
export function updateEmergencyContact(contactId, updates) {
  try {
    const contacts = getEmergencyContacts();
    const index = contacts.findIndex(c => c.id === contactId);

    if (index === -1) {
      console.error('未找到联系人:', contactId);
      return false;
    }

    // 如果设置为首选，取消其他联系人的首选状态
    if (updates.isPrimary) {
      contacts.forEach((c, i) => {
        if (i !== index) {
          c.isPrimary = false;
        }
      });
    }

    // 更新联系人
    contacts[index] = {
      ...contacts[index],
      ...updates,
      updatedAt: Date.now()
    };

    return saveEmergencyContacts(contacts);
  } catch (error) {
    console.error('更新紧急联系人失败:', error);
    return false;
  }
}

/**
 * 删除紧急联系人
 * @param {string} contactId 联系人ID
 * @returns {boolean} 是否删除成功
 */
export function deleteEmergencyContact(contactId) {
  try {
    const contacts = getEmergencyContacts();
    const filtered = contacts.filter(c => c.id !== contactId);

    return saveEmergencyContacts(filtered);
  } catch (error) {
    console.error('删除紧急联系人失败:', error);
    return false;
  }
}

/**
 * 设置首选联系人
 * @param {string} contactId 联系人ID
 * @returns {boolean} 是否设置成功
 */
export function setPrimaryContact(contactId) {
  try {
    const contacts = getEmergencyContacts();

    contacts.forEach(c => {
      c.isPrimary = (c.id === contactId);
    });

    return saveEmergencyContacts(contacts);
  } catch (error) {
    console.error('设置首选联系人失败:', error);
    return false;
  }
}

export default {
  getEmergencyContacts,
  saveEmergencyContacts,
  getPrimaryContact,
  callEmergencyContact,
  showEmergencyCountdown,
  cancelEmergencyCountdown,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  setPrimaryContact
};
