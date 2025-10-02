# 摔倒检测机器学习训练系统

## 📚 文档导航

本目录包含完整的机器学习训练系统文档，用于构建基于FastAPI的训练后端和小程序数据采集系统。

### 核心文档

| 文档 | 说明 | 状态 |
|-----|-----|------|
| [00-系统架构说明.md](./00-系统架构说明.md) | 系统整体架构、组件说明、数据流转 | ✅ 完成 |
| [01-后端API设计.md](./01-后端API设计.md) | FastAPI接口规范、请求/响应格式 | ✅ 完成 |
| [02-数据库设计.md](./02-数据库设计.md) | MySQL表结构、索引、SQL脚本 | ✅ 完成 |
| [03-小程序数据采集实现.md](./03-小程序数据采集实现.md) | DataCollector实现、使用示例 | ✅ 完成 |
| [04-完整实施指南.md](./04-完整实施指南.md) | ⭐ 完整代码+步骤（推荐从这里开始） | ✅ 完成 |

---

## 🚀 快速开始

### 1. 阅读文档（推荐顺序）

**新手入门:**
1. **先读:** `04-完整实施指南.md` - 包含所有核心代码
2. **再读:** `00-系统架构说明.md` - 理解整体设计

**详细参考:**
3. `01-后端API设计.md` - API接口规范
4. `02-数据库设计.md` - 数据库表结构
5. `03-小程序数据采集实现.md` - 小程序实现

### 2. 环境准备

**后端环境:**
- Python 3.10+
- MySQL 8.0+
- pip 23.0+

**小程序环境:**
- 微信开发者工具
- Node.js 16+（可选）

### 3. 实施步骤

```bash
# 步骤1：数据库初始化
mysql -u root -p
CREATE DATABASE fall_detection_training;
USE fall_detection_training;
# 执行 02-数据库设计.md 中的建表SQL

# 步骤2：安装Python依赖
cd backend
pip install -r requirements.txt

# 步骤3：配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接

# 步骤4：启动FastAPI服务
python main.py

# 步骤5：在小程序中配置API地址
# 修改 services/dataCollector.js 中的 API_BASE_URL

# 步骤6：开始收集数据
# 在小程序中使用"模拟摔倒"功能

# 步骤7：训练模型（收集足够数据后）
cd backend/training
python train_model.py
```

---

## 📂 项目结构

```
backend/                           # Python后端
├── main.py                       # ✅ FastAPI应用入口
├── config.py                     # ✅ 配置文件
├── models.py                     # ✅ 数据库模型
├── database.py                   # ✅ 数据库连接
├── api/
│   ├── upload.py                # ✅ 数据上传API
│   ├── training.py              # 🔄 训练管理API
│   └── data.py                  # 🔄 数据查询API
├── training/
│   ├── feature_extraction.py   # ✅ 特征提取
│   ├── train_model.py           # ✅ 模型训练
│   └── export_model.py          # 🔄 模型导出
├── requirements.txt             # ✅ Python依赖
└── .env                         # ⚠️ 需要创建

miniprogram/                      # 小程序前端
├── services/
│   └── dataCollector.js         # ✅ 数据收集器
├── pages/
│   ├── simulate/                # ✅ 模拟摔倒页面
│   │   └── simulate.vue
│   └── riding/                  # 🔄 骑行页面（需改进）
│       └── riding.vue

docs/train/                       # 📚 文档目录
├── 00-系统架构说明.md
├── 01-后端API设计.md
├── 02-数据库设计.md
├── 03-小程序数据采集实现.md
├── 04-完整实施指南.md
└── README.md                    # 本文件
```

**图例:**
- ✅ 已完成
- 🔄 待实现
- ⚠️ 需要配置

---

## 🎯 功能特性

### 后端功能
- ✅ FastAPI RESTful API
- ✅ MySQL数据存储
- ✅ 数据上传接口
- ✅ 数据统计查询
- ✅ 特征工程（64维特征）
- ✅ Random Forest训练
- 🔄 训练任务管理
- 🔄 模型版本管理
- 🔄 TensorFlow.js导出

### 小程序功能
- ✅ 数据收集器（DataCollector）
- ✅ 模拟摔倒页面
- ✅ 实时数据采集（50Hz）
- ✅ 数据标注功能
- ✅ 数据上传功能
- 🔄 骑行数据采集
- 🔄 ML模型集成

---

## 💾 数据库表

### 核心表

| 表名 | 说明 | 记录数估算 |
|-----|-----|----------|
| training_samples | 样本元数据 | 1000+ |
| sensor_data | 传感器数据 | 1,500,000+ |
| training_jobs | 训练任务 | 10+ |
| model_versions | 模型版本 | 5+ |

详见：`02-数据库设计.md`

---

## 🔌 API接口

### 公开接口

| 方法 | 路径 | 功能 |
|-----|-----|-----|
| POST | `/api/upload/training-data` | 上传训练数据 |
| GET | `/api/model/download` | 下载最新模型 |
| GET | `/api/health` | 健康检查 |

### 管理员接口（需API Key）

| 方法 | 路径 | 功能 |
|-----|-----|-----|
| GET | `/api/data/stats` | 获取数据统计 |
| GET | `/api/data/list` | 查询数据列表 |
| POST | `/api/training/start` | 启动训练任务 |
| GET | `/api/training/status/{id}` | 查询训练状态 |

详见：`01-后端API设计.md`

---

## 🧪 测试指南

### 后端测试

```bash
# 测试健康检查
curl http://localhost:8000/api/health

# 测试上传数据
curl -X POST http://localhost:8000/api/upload/training-data \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "label": "fall",
    "source": "simulate",
    "duration": 30000,
    "samples": [
      {
        "timestamp": 1696234567890,
        "acc": {"x": 0.52, "y": 0.31, "z": 9.75},
        "gyro": {"x": 12.5, "y": -6.2, "z": 0.8}
      }
    ]
  }'

# 测试统计接口（需要API Key）
curl -X GET http://localhost:8000/api/data/stats \
  -H "X-API-Key: your-admin-api-key"
```

### 小程序测试

1. **测试数据收集器:**
   - 进入"模拟摔倒"页面
   - 点击"开始采集"
   - 观察数据点数量增长
   - 30秒后检查是否自动停止

2. **测试数据上传:**
   - 完成采集后选择标注
   - 观察网络请求
   - 检查后端数据库是否有新记录

---

## 📊 数据收集指南

### 目标数据量

| 类型 | 目标数量 | 建议来源 |
|-----|---------|---------|
| 摔倒样本 | 100+ | 模拟摔倒页面 |
| 正常样本 | 1000+ | 骑行页面 |
| 样本比例 | 1:10 | 不平衡数据集处理 |

### 收集建议

**摔倒样本（模拟）:**
- ✅ 将手机放在厚垫子/枕头上
- ✅ 从约1米高度自由落下
- ✅ 模拟不同方向的摔倒（前/后/左/右）
- ⚠️ 注意安全，不要损坏手机

**正常样本（骑行）:**
- ✅ 正常骑行
- ✅ 转弯、加速、减速
- ✅ 过减速带
- ✅ 各种路况

---

## 🤖 模型训练

### 训练流程

```python
# 1. 从数据库加载数据
trainer = ModelTrainer(db_url='mysql+pymysql://root:password@localhost/fall_detection_training')
X, y = trainer.load_data_from_db()

# 2. 训练模型
metrics = trainer.train(X, y, test_size=0.2)

# 3. 保存模型
trainer.save_model('./models/fall_detection_rf.pkl')

# 4. 查看评估指标
print(f"准确率: {metrics['accuracy']:.3f}")
print(f"F1分数: {metrics['f1_score']:.3f}")
```

### 性能指标目标

| 指标 | 目标值 | 说明 |
|-----|-------|-----|
| 准确率 | > 90% | 整体分类准确性 |
| 精确率 | > 85% | 预测为摔倒的准确性 |
| 召回率 | > 90% | 真实摔倒被检测到的比例 |
| F1分数 | > 88% | 精确率和召回率的调和平均 |

---

## 🔧 常见问题

### Q1: 后端启动失败？
**A:** 检查以下几点：
1. MySQL是否正在运行
2. 数据库配置是否正确（`.env` 文件）
3. Python依赖是否安装完整
4. 端口8000是否被占用

### Q2: 小程序上传失败？
**A:** 检查以下几点：
1. API地址是否正确（`dataCollector.js`）
2. 后端服务是否运行
3. 网络连接是否正常
4. 查看浏览器/开发者工具的网络日志

### Q3: 训练时内存不足？
**A:** 尝试以下方法：
1. 减少`window_size`（如改为50）
2. 减少`overlap`（如改为25）
3. 分批训练（每次加载部分数据）
4. 使用更少的特征

### Q4: 模型准确率低？
**A:** 尝试以下改进：
1. 收集更多样本
2. 改进特征工程（添加更多特征）
3. 尝试其他算法（XGBoost、SVM）
4. 调整超参数
5. 数据增强（旋转、缩放）

---

## 📈 性能指标

### 系统性能

| 指标 | 目标值 | 当前值 |
|-----|-------|--------|
| API响应时间 | < 2s | 🔄 待测试 |
| 数据上传成功率 | > 99% | 🔄 待测试 |
| 训练1000样本耗时 | < 5min | 🔄 待测试 |
| 模型大小 | < 2MB | 🔄 待测试 |

---

## 🛣️ Roadmap

### Phase 1: 数据收集（当前阶段）
- ✅ 后端API实现
- ✅ 数据库设计
- ✅ 小程序数据收集器
- ✅ 模拟摔倒页面
- 🔄 骑行数据采集

### Phase 2: 模型训练
- ✅ 特征工程实现
- ✅ Random Forest训练
- 🔄 模型评估和优化
- 🔄 超参数调优

### Phase 3: 模型部署
- 🔄 TensorFlow.js转换
- 🔄 小程序模型集成
- 🔄 A/B测试
- 🔄 性能优化

### Phase 4: 持续改进
- 🔄 收集真实使用数据
- 🔄 模型迭代优化
- 🔄 深度学习模型（CNN-LSTM）
- 🔄 在线学习

---

## 👥 贡献指南

欢迎贡献！可以通过以下方式参与：

1. **数据贡献**：使用小程序收集更多样本
2. **代码贡献**：改进算法和实现
3. **文档贡献**：完善文档和教程
4. **问题反馈**：报告Bug和提出建议

---

## 📄 许可证

MIT License

---

## 📮 联系方式

如有问题或建议，请提交Issue或Pull Request。

---

**最后更新:** 2025-10-02

**版本:** v1.0.0

**状态:** 🔄 开发中
