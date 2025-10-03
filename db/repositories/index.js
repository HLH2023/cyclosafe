/**
 * 仓储层统一导出
 */

import RidingRecordRepository, { getRidingRecordRepository } from './RidingRecordRepository.js';
import SettingsRepository, { getSettingsRepository } from './SettingsRepository.js';
import DangerPointRepository, { getDangerPointRepository } from './DangerPointRepository.js';

export {
  // 骑行记录仓储
  RidingRecordRepository,
  getRidingRecordRepository,

  // 设置仓储
  SettingsRepository,
  getSettingsRepository,

  // 危险点仓储
  DangerPointRepository,
  getDangerPointRepository
};

/**
 * 获取所有仓储实例
 * @returns {Object} 所有仓储实例对象
 */
export function getAllRepositories() {
  return {
    ridingRecord: getRidingRecordRepository(),
    settings: getSettingsRepository(),
    dangerPoint: getDangerPointRepository()
  };
}

export default {
  RidingRecordRepository,
  getRidingRecordRepository,
  SettingsRepository,
  getSettingsRepository,
  DangerPointRepository,
  getDangerPointRepository,
  getAllRepositories
};
