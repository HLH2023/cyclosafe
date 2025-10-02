# SQLite 数据访问层

## 快速开始（3步）

### 1. 复制 WASM 文件

```bash
mkdir -p static/sqlite
cp node_modules/sql.js/dist/sql-wasm.wasm static/sqlite/
```

### 2. 在 App.vue 中初始化

```javascript
import { setupDatabase } from '@/db/database.js';

export default {
  async onLaunch() {
    await setupDatabase();
    console.log('✅ 数据库初始化成功');
  }
};
```

### 3. 使用数据API

```javascript
import { saveRidingRecord, getAllRecords } from '@/utils/storage.js';

// 保存记录
await saveRidingRecord({
  id: 'uuid-xxx',
  startTime: Date.now(),
  endTime: Date.now() + 3600000,
  duration: 3600,
  distance: 10.5,
  avgSpeed: 15.2,
  maxSpeed: 28.5,
  trackPoints: [...]
});

// 获取所有记录
const records = getAllRecords();
```

## 文档

- 📘 [完整使用指南](../docs/SQLite使用指南.md)
- 🚀 [初始化示例](../docs/数据库初始化示例.md)

## 目录结构

```
db/
├── README.md                    # 本文件
├── database.js                  # 数据库初始化和Schema
└── repositories/                # 数据仓储层
    ├── index.js                 # 统一导出
    ├── RidingRecordRepository.js  # 骑行记录仓储
    └── SettingsRepository.js      # 设置仓储
```

## 数据库表

- **riding_records** - 骑行记录（id, distance, speed等）
- **track_points** - GPS轨迹点（关联骑行记录）
- **settings** - 应用设置（键值对）

## API 概览

### 骑行记录

```javascript
import {
  saveRidingRecord,      // 保存记录（异步）
  getRidingRecord,       // 获取单条记录
  getAllRecords,         // 获取所有记录
  deleteRidingRecord,    // 删除记录（异步）
  clearAllRecords,       // 清空所有记录（异步）
  getStatistics          // 获取统计数据
} from '@/utils/storage.js';
```

### 设置

```javascript
import {
  saveSetting,           // 保存设置
  getSetting             // 获取设置
} from '@/utils/storage.js';
```

## 高级用法

直接使用 Repository 进行复杂查询：

```javascript
import { getRidingRecordRepository } from '@/db/repositories/index.js';

const repo = getRidingRecordRepository();

// 分页查询最近30天的记录
const records = repo.getAllRecords({
  limit: 10,
  offset: 0,
  startDate: Date.now() - 30 * 24 * 3600 * 1000,
  endDate: Date.now()
});
```

## 常见问题

**Q: 数据库初始化失败？**
A: 检查 `static/sqlite/sql-wasm.wasm` 文件是否存在

**Q: 保存失败？**
A: 检查必填字段是否完整（id, startTime, endTime等）

**Q: 数据会丢失吗？**
A: 不会，数据保存在 `wx.env.USER_DATA_PATH/cyclosafe.db`

## 帮助

查看完整文档：`docs/SQLite使用指南.md`
