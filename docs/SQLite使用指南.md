# SQLite 数据访问层使用指南

## 概述

本项目使用 **SQLite WebAssembly** 作为本地存储方案，提供结构化的数据存储和高性能查询能力。

## 目录结构

```
mobileHomework/
├── db/                           # 数据库层
│   ├── database.js               # 数据库初始化和Schema
│   └── repositories/             # 数据仓储层
│       ├── index.js              # 仓储统一导出
│       ├── RidingRecordRepository.js  # 骑行记录仓储
│       └── SettingsRepository.js      # 设置仓储
├── utils/
│   ├── sqlite-wrapper.js         # SQLite WASM 包装器
│   └── storage.js                # 存储工具API
└── static/
    └── sqlite/                   # SQLite WASM 文件目录
        └── sql-wasm.wasm         # （需要手动复制）
```

## 数据库表结构

### 1. riding_records（骑行记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键，记录ID |
| start_time | INTEGER | 开始时间戳 |
| end_time | INTEGER | 结束时间戳 |
| duration | INTEGER | 骑行时长（秒） |
| distance | REAL | 骑行距离（公里） |
| avg_speed | REAL | 平均速度 |
| max_speed | REAL | 最高速度 |
| total_ascent | REAL | 总爬升（米） |
| created_at | INTEGER | 创建时间 |
| updated_at | INTEGER | 更新时间 |

### 2. track_points（轨迹点表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键（自增） |
| record_id | TEXT | 外键，关联骑行记录 |
| latitude | REAL | 纬度 |
| longitude | REAL | 经度 |
| altitude | REAL | 海拔 |
| speed | REAL | 速度 |
| timestamp | INTEGER | 时间戳 |
| sequence | INTEGER | 序号 |

### 3. settings（设置表）

| 字段 | 类型 | 说明 |
|------|------|------|
| key | TEXT | 主键，设置键名 |
| value | TEXT | 设置值（JSON） |
| updated_at | INTEGER | 更新时间 |

## 快速开始

### 1. 安装依赖

```bash
npm install sql.js
```

### 2. 复制 WASM 文件

将 `sql-wasm.wasm` 文件复制到 `static/sqlite/` 目录：

```bash
mkdir -p static/sqlite
cp node_modules/sql.js/dist/sql-wasm.wasm static/sqlite/
```

### 3. 初始化数据库

在 `App.vue` 中添加初始化代码：

```javascript
<script>
import { setupDatabase } from '@/db/database.js';

export default {
  async onLaunch() {
    try {
      // 初始化SQLite数据库
      await setupDatabase();
      console.log('✅ 数据库初始化成功');
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error);
      uni.showToast({
        title: '数据库初始化失败',
        icon: 'none'
      });
    }
  }
};
</script>
```

## 数据操作 API

### 方式一：使用 storage.js（推荐）

简单易用的封装API，适合日常使用：

#### 骑行记录操作

```javascript
import {
  saveRidingRecord,
  getRidingRecord,
  getAllRecords,
  getRecordList,
  deleteRidingRecord,
  clearAllRecords,
  getStatistics
} from '@/utils/storage.js';

// 1. 保存骑行记录（异步）
const record = {
  id: 'uuid-xxx',
  startTime: Date.now(),
  endTime: Date.now() + 3600000,
  duration: 3600,
  distance: 10.5,
  avgSpeed: 15.2,
  maxSpeed: 28.5,
  totalAscent: 50,
  trackPoints: [
    {
      latitude: 39.915,
      longitude: 116.404,
      altitude: 50,
      speed: 15,
      timestamp: Date.now()
    }
  ]
};

await saveRidingRecord(record);

// 2. 获取单条记录
const record = getRidingRecord('uuid-xxx');
console.log(record);

// 3. 获取所有记录
const records = getAllRecords();
console.log('共有', records.length, '条记录');

// 4. 获取记录ID列表
const ids = getRecordList();

// 5. 删除记录（异步）
await deleteRidingRecord('uuid-xxx');

// 6. 清空所有记录（异步）
await clearAllRecords();

// 7. 获取统计数据
const stats = getStatistics();
console.log(stats);
// {
//   totalRides: 15,
//   totalDistance: 156.7,
//   totalDuration: 36000,
//   maxSpeed: 35.2,
//   avgSpeed: 18.5
// }
```

#### 设置操作

```javascript
import { saveSetting, getSetting } from '@/utils/storage.js';

// 保存设置
saveSetting('theme', 'dark');
saveSetting('speedThreshold', 40);
saveSetting('userPreferences', {
  distanceUnit: 'km',
  mapType: 'satellite'
});

// 获取设置（第二个参数为默认值）
const theme = getSetting('theme', 'light');
const speed = getSetting('speedThreshold', 30);
const prefs = getSetting('userPreferences', {});
```

### 方式二：直接使用 Repository（高级用法）

提供更灵活的查询和操作能力：

```javascript
import {
  getRidingRecordRepository,
  getSettingsRepository
} from '@/db/repositories/index.js';

// 骑行记录仓储
const ridingRepo = getRidingRecordRepository();

// 1. 分页查询
const records = ridingRepo.getAllRecords({
  limit: 10,          // 每页10条
  offset: 0,          // 从第0条开始
  startDate: Date.now() - 30 * 24 * 3600 * 1000,  // 最近30天
  endDate: Date.now()
});

// 2. 获取记录总数
const totalCount = ridingRepo.getRecordCount();

// 3. 更新记录
ridingRepo.updateRecord('uuid-xxx', {
  distance: 11.2,
  avgSpeed: 16.0
});

// 4. 获取统计数据
const stats = ridingRepo.getStatistics();

// 设置仓储
const settingsRepo = getSettingsRepository();

// 批量保存设置
await settingsRepo.batchSaveSettings({
  theme: 'dark',
  language: 'zh-CN',
  notifications: true
});

// 获取所有设置
const allSettings = settingsRepo.getAllSettings();

// 检查设置是否存在
const hasTheme = settingsRepo.hasSetting('theme');
```

## 实际使用示例

### 示例1：骑行页面保存记录

```javascript
// pages/riding/riding.vue

import { saveRidingRecord } from '@/utils/storage.js';
import { generateUUID } from '@/utils/uuid.js';

// 结束骑行时保存记录
const finishRiding = async () => {
  const record = {
    id: generateUUID(),
    startTime: startTime.value,
    endTime: Date.now(),
    duration: duration.value,
    distance: distance.value,
    avgSpeed: avgSpeed.value,
    maxSpeed: maxSpeed.value,
    totalAscent: totalAscent.value,
    trackPoints: trackPoints.value
  };

  try {
    await saveRidingRecord(record);
    uni.showToast({ title: '保存成功', icon: 'success' });

    // 跳转到分析页面
    uni.navigateTo({
      url: `/pages/analysis/analysis?id=${record.id}`
    });
  } catch (error) {
    console.error('保存失败:', error);
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
};
```

### 示例2：历史记录页面

```javascript
// pages/history/history.vue

import { getAllRecords, deleteRidingRecord } from '@/utils/storage.js';

// 加载记录列表
const loadRecords = () => {
  const records = getAllRecords();
  recordList.value = records;
};

// 删除记录
const deleteRecord = async (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: async (res) => {
      if (res.confirm) {
        await deleteRidingRecord(id);
        loadRecords(); // 重新加载
        uni.showToast({ title: '删除成功', icon: 'success' });
      }
    }
  });
};

onShow(() => {
  loadRecords();
});
```

### 示例3：设置页面

```javascript
// pages/settings/settings.vue

import { saveSetting, getSetting } from '@/utils/storage.js';

// 读取设置
const loadSettings = () => {
  speedThreshold.value = getSetting('speedThreshold', 40);
  theme.value = getSetting('theme', 'light');
  fallDetectionEnabled.value = getSetting('fallDetectionEnabled', true);
};

// 保存设置
const saveSettings = () => {
  saveSetting('speedThreshold', speedThreshold.value);
  saveSetting('theme', theme.value);
  saveSetting('fallDetectionEnabled', fallDetectionEnabled.value);

  uni.showToast({ title: '保存成功', icon: 'success' });
};

onLoad(() => {
  loadSettings();
});
```

## 注意事项

### 1. 异步操作

以下函数是异步的，需要使用 `await`：

```javascript
// ✅ 正确
await saveRidingRecord(record);
await deleteRidingRecord(id);
await clearAllRecords();

// ⚠️ 不推荐（无法捕获错误）
saveRidingRecord(record);
```

### 2. WASM 文件路径

确保 `sql-wasm.wasm` 文件在 `static/sqlite/` 目录下，否则数据库无法初始化。

### 3. 数据持久化

- 数据库文件保存在：`wx.env.USER_DATA_PATH/cyclosafe.db`
- 每次数据操作后会自动保存到文件系统
- 关闭应用后数据不会丢失

### 4. 错误处理

建议添加 try-catch 处理错误：

```javascript
try {
  await saveRidingRecord(record);
  uni.showToast({ title: '保存成功', icon: 'success' });
} catch (error) {
  console.error('保存失败:', error);
  uni.showToast({ title: '保存失败', icon: 'none' });
}
```

### 5. 性能优化

- **批量操作**：使用事务提升性能
- **索引**：已在 `start_time` 等字段创建索引
- **分页查询**：大量数据时使用 `limit` 和 `offset`

```javascript
// 使用分页查询
const repo = getRidingRecordRepository();
const page1 = repo.getAllRecords({ limit: 10, offset: 0 });   // 第1页
const page2 = repo.getAllRecords({ limit: 10, offset: 10 });  // 第2页
```

## 调试工具

### 查看数据库统计

```javascript
import { getDatabaseStats } from '@/db/database.js';

const stats = getDatabaseStats();
console.log(stats);
// {
//   totalRecords: 15,
//   totalTrackPoints: 1520,
//   totalSettings: 8
// }
```

### 清空所有数据（测试用）

```javascript
import { clearAllData } from '@/db/database.js';

await clearAllData();
console.log('数据已清空');
```

## 备份与恢复

### 导出数据库

```javascript
import { getSQLiteInstance } from '@/utils/sqlite-wrapper.js';

const db = getSQLiteInstance();
const data = db.exportDatabase();  // 返回 Uint8Array

// 可以保存到文件或上传到服务器
```

### 导入数据库

```javascript
import { getSQLiteInstance } from '@/utils/sqlite-wrapper.js';

const db = getSQLiteInstance();
db.importDatabase(data);  // data 为 Uint8Array
```

## 故障排查

### 问题1：数据库初始化失败

**现象**：控制台报错 "数据库未初始化"

**原因**：WASM文件未正确加载

**解决**：
1. 检查 `static/sqlite/sql-wasm.wasm` 文件是否存在
2. 检查文件路径配置是否正确
3. 查看控制台详细错误信息

### 问题2：保存失败

**现象**：调用 `saveRidingRecord()` 返回 false

**原因**：数据格式不正确或必填字段缺失

**解决**：
1. 检查记录对象是否包含所有必填字段
2. 检查字段类型是否正确
3. 查看控制台错误日志

### 问题3：查询速度慢

**现象**：`getAllRecords()` 执行缓慢

**原因**：数据量大且未使用分页

**解决**：
1. 使用分页查询（limit/offset）
2. 使用时间范围过滤（startDate/endDate）
3. 考虑添加额外索引

## 数据库扩展

### 添加新表

在 `db/database.js` 的 `createTables()` 函数中添加：

```javascript
db.run(`
  CREATE TABLE IF NOT EXISTS your_new_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);
```

### 创建新 Repository

参考 `RidingRecordRepository.js` 创建新的仓储类。

### 数据库版本升级

1. 修改 `DATABASE_VERSION` 常量
2. 在 `migrateDatabase()` 函数中添加升级逻辑

```javascript
if (fromVersion < 2 && toVersion >= 2) {
  // 版本2的升级逻辑
  db.run('ALTER TABLE riding_records ADD COLUMN new_field TEXT');
}
```

## 总结

SQLite存储方案的优势：

✅ **大容量**：支持数百MB数据
✅ **高性能**：索引查询，SQL优化
✅ **结构化**：关系型数据库，支持复杂查询
✅ **易维护**：Repository模式，职责清晰
✅ **可扩展**：灵活的Schema设计

如有问题，请查看控制台日志或联系开发团队。
