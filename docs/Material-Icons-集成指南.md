# Material Icons 集成指南

## 📦 字体文件下载

由于版权和文件大小原因，需要手动下载 Material Icons 字体文件。

### 方式一：从 Google Fonts 下载（推荐）

1. 访问：https://fonts.google.com/icons
2. 下载 Material Icons 字体包
3. 解压后找到以下文件：
   - `MaterialIcons-Regular.woff2`
   - `MaterialIcons-Regular.woff`
   - `MaterialIcons-Regular.ttf`

### 方式二：从 GitHub 下载

1. 访问：https://github.com/google/material-design-icons
2. 下载字体文件：`iconfont/MaterialIcons-Regular.*`

### 方式三：使用 CDN（备选方案）

如果无法下载字体文件，可以使用在线 CDN：

```css
/* 在 static/css/material-icons.css 中替换为： */
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
```

**注意**：CDN 方式需要网络连接，可能影响小程序性能。

---

## 📂 文件放置位置

将下载的字体文件放置到项目中：

```
static/
  └── fonts/
      ├── MaterialIcons-Regular.woff2  ← 放置这里
      ├── MaterialIcons-Regular.woff   ← 放置这里
      └── MaterialIcons-Regular.ttf    ← 放置这里
```

---

## ✅ 验证安装

1. 确保字体文件已放置在 `static/fonts/` 目录
2. 样式文件 `static/css/material-icons.css` 已自动创建
3. 在 `App.vue` 中已全局引入（自动配置）
4. 使用 `<m-icon>` 组件测试

---

## 🎨 使用方式

### 方式一：使用封装组件（推荐）

```vue
<template>
  <m-icon name="home" />
  <m-icon name="directions_bike" size="lg" />
  <m-icon name="settings" color="#3B82F6" />
</template>
```

### 方式二：直接使用 CSS 类

```vue
<template>
  <text class="material-icons">home</text>
  <text class="material-icons md-lg">directions_bike</text>
</template>
```

---

## 📚 常用图标名称

根据项目需求，以下是常用图标：

| 功能 | 图标名称 | 示例 |
|------|---------|------|
| 首页 | `home` | 🏠 |
| 骑行 | `directions_bike` | 🚴 |
| 历史记录 | `history` | 📊 |
| 设置 | `settings` | ⚙️ |
| 地图 | `map` | 🗺️ |
| 速度 | `speed` | ⚡ |
| 定位 | `my_location` | 📍 |
| 暂停 | `pause` | ⏸️ |
| 停止 | `stop` | ⏹️ |
| 播放 | `play_arrow` | ▶️ |
| 搜索 | `search` | 🔍 |
| 删除 | `delete` | 🗑️ |
| 返回 | `arrow_back` | ← |
| 时间 | `schedule` | ⏱️ |
| 距离 | `straighten` | 📏 |
| 电池 | `battery_full` | 🔋 |

---

## 🔗 图标搜索

查找更多图标名称：
- 官方图标库：https://fonts.google.com/icons
- 图标名称列表：https://material.io/resources/icons/

---

## ⚠️ 注意事项

1. **字体文件大小**：MaterialIcons-Regular.woff2 约 50KB，请确保包含在项目中
2. **微信小程序限制**：字体文件会计入小程序包大小，建议使用 woff2 格式（最小）
3. **图标名称**：使用下划线（`_`）而非短横线（`-`），如 `directions_bike` 而非 `directions-bike`
4. **性能优化**：如果只使用少量图标，可考虑使用 SVG 或图片代替

---

## 🛠️ 故障排查

### 问题：图标显示为方框 □

**原因**：字体文件未正确加载

**解决方案**：
1. 检查字体文件是否存在于 `static/fonts/` 目录
2. 检查文件名是否正确（区分大小写）
3. 清除缓存后重新运行项目

### 问题：图标显示为文字

**原因**：样式未正确应用

**解决方案**：
1. 确认 `material-icons.css` 已在 `App.vue` 中引入
2. 确认使用了正确的 class 名称 `material-icons`
3. 检查是否有样式冲突

---

## 📄 完成标志

当你看到以下内容时，说明集成成功：

- [x] `static/fonts/` 目录中有 3 个字体文件
- [x] `static/css/material-icons.css` 文件存在
- [x] `App.vue` 中引入了字体样式
- [x] `<m-icon>` 组件可以正常显示图标
- [x] 图标显示清晰，无锯齿

---

**创建时间**: 2025-10-02
**更新时间**: 2025-10-02
