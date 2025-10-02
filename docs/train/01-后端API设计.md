# FastAPI 后端 API 设计文档

## API 基本信息

**Base URL:** `http://your-server:8000/api`

**Content-Type:** `application/json`

**认证方式:**
- 公开接口：无需认证
- 管理员接口：需要 API Key（Header: `X-API-Key`）

---

## API 接口列表

### 1. 数据上传接口

#### 1.1 上传训练数据

**接口地址:** `POST /upload/training-data`

**功能说明:** 接收小程序上传的传感器数据，用于模型训练

**请求头:**
```
Content-Type: application/json
```

**请求体:**
```json
{
  "user_id": "user_anonymous_123",
  "label": "fall",
  "source": "simulate",
  "duration": 30000,
  "samples": [
    {
      "timestamp": 1696234567890,
      "acc": {
        "x": 0.52,
        "y": 0.31,
        "z": 9.75
      },
      "gyro": {
        "x": 12.5,
        "y": -6.2,
        "z": 0.8
      }
    },
    {
      "timestamp": 1696234567910,
      "acc": {
        "x": 0.55,
        "y": 0.28,
        "z": 9.82
      },
      "gyro": {
        "x": 11.8,
        "y": -5.9,
        "z": 0.7
      }
    }
    // ... 更多样本（通常1500个，30秒×50Hz）
  ],
  "metadata": {
    "device": "iPhone 12",
    "os": "iOS 15.0",
    "app_version": "1.0.0"
  }
}
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|-----|
| user_id | string | 是 | 匿名用户ID（不要使用真实用户信息） |
| label | string | 是 | 标注：'fall' 或 'normal' |
| source | string | 是 | 数据来源：'simulate' 或 'riding' |
| duration | integer | 是 | 采集时长（毫秒） |
| samples | array | 是 | 传感器数据数组 |
| samples[].timestamp | integer | 是 | Unix时间戳（毫秒） |
| samples[].acc | object | 是 | 加速度计数据 |
| samples[].acc.x | float | 是 | X轴加速度（m/s²） |
| samples[].acc.y | float | 是 | Y轴加速度（m/s²） |
| samples[].acc.z | float | 是 | Z轴加速度（m/s²） |
| samples[].gyro | object | 是 | 陀螺仪数据 |
| samples[].gyro.x | float | 是 | X轴角速度（°/s） |
| samples[].gyro.y | float | 是 | Y轴角速度（°/s） |
| samples[].gyro.z | float | 是 | Z轴角速度（°/s） |
| metadata | object | 否 | 元数据（设备信息等） |

**成功响应:** `200 OK`
```json
{
  "success": true,
  "message": "数据上传成功",
  "data": {
    "sample_id": 12345,
    "sample_count": 1500,
    "created_at": "2025-10-02T14:30:00Z"
  }
}
```

**错误响应:**

`400 Bad Request` - 请求参数错误
```json
{
  "success": false,
  "error": "INVALID_PARAM",
  "message": "label 字段必须是 'fall' 或 'normal'"
}
```

`413 Payload Too Large` - 数据过大
```json
{
  "success": false,
  "error": "PAYLOAD_TOO_LARGE",
  "message": "数据大小不能超过10MB"
}
```

`500 Internal Server Error` - 服务器错误
```json
{
  "success": false,
  "error": "DATABASE_ERROR",
  "message": "数据库写入失败"
}
```

**请求示例（Python）:**
```python
import requests

data = {
    "user_id": "user_123",
    "label": "fall",
    "source": "simulate",
    "duration": 30000,
    "samples": [
        {
            "timestamp": 1696234567890,
            "acc": {"x": 0.52, "y": 0.31, "z": 9.75},
            "gyro": {"x": 12.5, "y": -6.2, "z": 0.8}
        }
        # ... 更多样本
    ]
}

response = requests.post(
    "http://localhost:8000/api/upload/training-data",
    json=data
)

print(response.json())
```

**请求示例（小程序）:**
```javascript
const uploadData = async (collectedData) => {
  const response = await uni.request({
    url: 'http://your-server:8000/api/upload/training-data',
    method: 'POST',
    data: collectedData,
    header: {
      'Content-Type': 'application/json'
    }
  });

  if (response.statusCode === 200) {
    console.log('上传成功', response.data);
  } else {
    console.error('上传失败', response.data);
  }
};
```

**性能指标:**
- 单次上传大小限制：10MB
- 响应时间目标：< 2秒
- 并发支持：100 req/s

**频率限制:**
- 每个IP：100次/小时
- 每个user_id：50次/天

---

### 2. 数据查询接口（管理员）

#### 2.1 获取数据统计

**接口地址:** `GET /data/stats`

**功能说明:** 获取训练数据的统计信息

**请求头:**
```
X-API-Key: your-admin-api-key
```

**请求参数:** 无

**成功响应:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total_samples": 1523,
    "fall_samples": 152,
    "normal_samples": 1371,
    "by_source": {
      "simulate": 152,
      "riding": 1371
    },
    "total_data_points": 2284500,
    "date_range": {
      "earliest": "2025-09-01T00:00:00Z",
      "latest": "2025-10-02T14:30:00Z"
    },
    "storage_size_mb": 87.5
  }
}
```

**错误响应:**

`401 Unauthorized` - 未授权
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "需要提供有效的API Key"
}
```

---

#### 2.2 查询数据列表

**接口地址:** `GET /data/list`

**功能说明:** 分页查询训练样本列表

**请求头:**
```
X-API-Key: your-admin-api-key
```

**请求参数（Query）:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|-----|------|------|--------|-----|
| page | integer | 否 | 1 | 页码 |
| page_size | integer | 否 | 20 | 每页数量（最大100） |
| label | string | 否 | - | 过滤标注：'fall' / 'normal' |
| source | string | 否 | - | 过滤来源：'simulate' / 'riding' |
| start_date | string | 否 | - | 开始日期（ISO格式） |
| end_date | string | 否 | - | 结束日期（ISO格式） |

**请求示例:**
```
GET /api/data/list?page=1&page_size=20&label=fall&source=simulate
```

**成功响应:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 12345,
        "user_id": "user_123",
        "label": "fall",
        "source": "simulate",
        "duration": 30000,
        "sample_count": 1500,
        "uploaded_at": "2025-10-02T14:30:00Z",
        "processed": false
      },
      // ... 更多项
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 152,
      "total_pages": 8
    }
  }
}
```

---

#### 2.3 获取单个样本详情

**接口地址:** `GET /data/sample/{sample_id}`

**功能说明:** 获取指定样本的详细信息

**请求头:**
```
X-API-Key: your-admin-api-key
```

**路径参数:**
- `sample_id`: 样本ID（整数）

**成功响应:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "user_id": "user_123",
    "label": "fall",
    "source": "simulate",
    "duration": 30000,
    "sample_count": 1500,
    "uploaded_at": "2025-10-02T14:30:00Z",
    "processed": false,
    "metadata": {
      "device": "iPhone 12",
      "os": "iOS 15.0"
    },
    "sensor_data": [
      {
        "timestamp": 1696234567890,
        "acc_x": 0.52,
        "acc_y": 0.31,
        "acc_z": 9.75,
        "gyro_x": 12.5,
        "gyro_y": -6.2,
        "gyro_z": 0.8
      }
      // ... 更多数据点
    ]
  }
}
```

**错误响应:**

`404 Not Found` - 样本不存在
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "样本ID不存在"
}
```

---

#### 2.4 删除样本

**接口地址:** `DELETE /data/sample/{sample_id}`

**功能说明:** 删除指定样本（级联删除所有传感器数据）

**请求头:**
```
X-API-Key: your-admin-api-key
```

**路径参数:**
- `sample_id`: 样本ID（整数）

**成功响应:** `200 OK`
```json
{
  "success": true,
  "message": "样本已删除",
  "data": {
    "sample_id": 12345,
    "deleted_data_points": 1500
  }
}
```

---

### 3. 训练管理接口（管理员）

#### 3.1 启动训练任务

**接口地址:** `POST /training/start`

**功能说明:** 启动一个新的模型训练任务（异步）

**请求头:**
```
X-API-Key: your-admin-api-key
Content-Type: application/json
```

**请求体:**
```json
{
  "algorithm": "random_forest",
  "config": {
    "n_estimators": 100,
    "max_depth": 20,
    "test_size": 0.2,
    "random_state": 42
  },
  "data_filter": {
    "min_samples": 100,
    "exclude_sources": []
  }
}
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|-----|
| algorithm | string | 是 | 算法名称：'random_forest' / 'xgboost' / 'svm' |
| config | object | 否 | 算法超参数配置 |
| data_filter | object | 否 | 数据过滤条件 |

**成功响应:** `200 OK`
```json
{
  "success": true,
  "message": "训练任务已启动",
  "data": {
    "job_id": 789,
    "status": "pending",
    "algorithm": "random_forest",
    "train_samples": 1050,
    "val_samples": 263,
    "estimated_time": "5分钟",
    "created_at": "2025-10-02T15:00:00Z"
  }
}
```

**错误响应:**

`400 Bad Request` - 数据不足
```json
{
  "success": false,
  "error": "INSUFFICIENT_DATA",
  "message": "训练数据不足，至少需要100个样本"
}
```

`409 Conflict` - 已有训练任务在运行
```json
{
  "success": false,
  "error": "TRAINING_IN_PROGRESS",
  "message": "已有训练任务正在运行，请稍后再试"
}
```

---

#### 3.2 查询训练状态

**接口地址:** `GET /training/status/{job_id}`

**功能说明:** 查询训练任务的状态和进度

**请求头:**
```
X-API-Key: your-admin-api-key
```

**路径参数:**
- `job_id`: 任务ID（整数）

**成功响应:** `200 OK`

*训练中:*
```json
{
  "success": true,
  "data": {
    "job_id": 789,
    "status": "running",
    "algorithm": "random_forest",
    "progress": 65,
    "current_step": "特征提取",
    "started_at": "2025-10-02T15:00:00Z",
    "estimated_remaining": "2分钟"
  }
}
```

*训练完成:*
```json
{
  "success": true,
  "data": {
    "job_id": 789,
    "status": "completed",
    "algorithm": "random_forest",
    "train_samples": 1050,
    "val_samples": 263,
    "metrics": {
      "accuracy": 0.923,
      "precision": 0.885,
      "recall": 0.912,
      "f1_score": 0.898
    },
    "model_path": "/models/fall_detection_v1.pkl",
    "started_at": "2025-10-02T15:00:00Z",
    "completed_at": "2025-10-02T15:04:32Z",
    "duration_seconds": 272
  }
}
```

*训练失败:*
```json
{
  "success": true,
  "data": {
    "job_id": 789,
    "status": "failed",
    "algorithm": "random_forest",
    "error_message": "特征提取失败：数据格式错误",
    "started_at": "2025-10-02T15:00:00Z",
    "failed_at": "2025-10-02T15:01:15Z"
  }
}
```

---

#### 3.3 获取训练历史

**接口地址:** `GET /training/history`

**功能说明:** 获取所有训练任务的历史记录

**请求头:**
```
X-API-Key: your-admin-api-key
```

**请求参数（Query）:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|-----|------|------|--------|-----|
| page | integer | 否 | 1 | 页码 |
| page_size | integer | 否 | 10 | 每页数量 |
| status | string | 否 | - | 过滤状态：'pending' / 'running' / 'completed' / 'failed' |

**成功响应:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "job_id": 789,
        "status": "completed",
        "algorithm": "random_forest",
        "accuracy": 0.923,
        "created_at": "2025-10-02T15:00:00Z",
        "completed_at": "2025-10-02T15:04:32Z"
      },
      {
        "job_id": 788,
        "status": "completed",
        "algorithm": "xgboost",
        "accuracy": 0.935,
        "created_at": "2025-10-01T10:00:00Z",
        "completed_at": "2025-10-01T10:08:15Z"
      }
      // ... 更多记录
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total_items": 25,
      "total_pages": 3
    }
  }
}
```

---

### 4. 模型管理接口

#### 4.1 下载最新模型

**接口地址:** `GET /model/download`

**功能说明:** 下载最新训练完成的TensorFlow.js模型

**请求头:** 无（公开接口）

**成功响应:** `200 OK`

**响应类型:** `application/json`

**响应体:**
```json
{
  "success": true,
  "data": {
    "model_version": "v1.2.3",
    "job_id": 789,
    "trained_at": "2025-10-02T15:04:32Z",
    "metrics": {
      "accuracy": 0.923,
      "f1_score": 0.898
    },
    "model_url": "https://your-cdn.com/models/fall_detection_v1.2.3/model.json",
    "model_size_mb": 1.8,
    "checksum": "sha256:abc123..."
  }
}
```

**使用示例（小程序）:**
```javascript
const loadModel = async () => {
  const response = await uni.request({
    url: 'http://your-server:8000/api/model/download',
    method: 'GET'
  });

  if (response.statusCode === 200) {
    const modelInfo = response.data.data;
    // 加载TensorFlow.js模型
    const model = await tf.loadLayersModel(modelInfo.model_url);
    console.log('模型加载成功');
  }
};
```

---

#### 4.2 模型版本列表

**接口地址:** `GET /model/list`

**功能说明:** 获取所有可用模型的版本列表

**请求头:**
```
X-API-Key: your-admin-api-key
```

**成功响应:** `200 OK`
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "version": "v1.2.3",
        "job_id": 789,
        "algorithm": "random_forest",
        "accuracy": 0.923,
        "trained_at": "2025-10-02T15:04:32Z",
        "is_active": true,
        "download_count": 1523
      },
      {
        "version": "v1.2.2",
        "job_id": 788,
        "algorithm": "xgboost",
        "accuracy": 0.935,
        "trained_at": "2025-10-01T10:08:15Z",
        "is_active": false,
        "download_count": 856
      }
      // ... 更多版本
    ]
  }
}
```

---

### 5. 健康检查接口

#### 5.1 服务健康检查

**接口地址:** `GET /health`

**功能说明:** 检查API服务是否正常运行

**请求头:** 无

**成功响应:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2025-10-02T15:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "storage": "healthy"
  }
}
```

**错误响应:** `503 Service Unavailable`
```json
{
  "status": "unhealthy",
  "timestamp": "2025-10-02T15:30:00Z",
  "services": {
    "database": "unhealthy",
    "storage": "healthy"
  },
  "error": "数据库连接失败"
}
```

---

## 错误码说明

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|-----|
| INVALID_PARAM | 400 | 请求参数错误 |
| UNAUTHORIZED | 401 | 未授权（API Key无效） |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突（如训练任务已在运行） |
| PAYLOAD_TOO_LARGE | 413 | 请求数据过大 |
| TOO_MANY_REQUESTS | 429 | 请求频率超限 |
| DATABASE_ERROR | 500 | 数据库错误 |
| TRAINING_ERROR | 500 | 训练过程错误 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 频率限制

### 公开接口
- `/api/upload/training-data`
  - 每IP: 100次/小时
  - 每user_id: 50次/天

- `/api/model/download`
  - 每IP: 20次/小时

### 管理员接口
- 所有管理员接口：1000次/小时

**超限响应:** `429 Too Many Requests`
```json
{
  "success": false,
  "error": "TOO_MANY_REQUESTS",
  "message": "请求频率超限，请稍后再试",
  "retry_after": 3600
}
```

---

## 认证方式

### API Key认证

管理员接口需要在请求头中携带API Key：

```
X-API-Key: your-admin-api-key-here
```

**生成API Key:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**配置API Key:**
在后端 `.env` 文件中设置：
```
ADMIN_API_KEY=your-generated-api-key
```

---

## 开发环境

### 启动后端服务

```bash
# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 运行数据库迁移
python migrate.py

# 启动服务
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 访问API文档

启动服务后，访问以下地址查看自动生成的API文档：

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 测试接口

### 使用curl测试

**上传数据:**
```bash
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
```

**查询统计（需要API Key）:**
```bash
curl -X GET http://localhost:8000/api/data/stats \
  -H "X-API-Key: your-api-key"
```

---

## 性能优化

### 数据库优化
- 对 `timestamp`, `label`, `source` 字段建立索引
- 使用连接池（最大连接数：100）
- 批量插入sensor_data（每次1000条）

### API优化
- 启用GZIP压缩（响应体>1KB时）
- 使用异步IO（`async/await`）
- 实现结果缓存（Redis）

---

## 安全建议

1. ✅ 使用HTTPS（生产环境）
2. ✅ 实施频率限制
3. ✅ 验证请求数据大小
4. ✅ 使用强API Key（32字节以上）
5. ✅ 定期轮换API Key
6. ✅ 记录所有管理员操作日志
7. ✅ 实施SQL注入防护（使用ORM）
8. ✅ 实施XSS防护（响应头配置）

---

## 版本历史

### v1.0.0 (2025-10-02)
- ✅ 完成所有API设计
- ✅ 定义请求/响应格式
- ✅ 定义错误码
- ✅ 定义认证方式

---

## 相关文档

- [00-系统架构说明.md](./00-系统架构说明.md)
- [02-数据库设计.md](./02-数据库设计.md)
- [03-小程序数据采集.md](./03-小程序数据采集.md)
