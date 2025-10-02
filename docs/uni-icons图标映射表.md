# uni-icons 图标映射表

## 📝 说明

由于微信小程序不支持字体的 ligatures（连字）特性，无法使用 Material Icons。
项目已切换到 **uni-icons**（uniapp 官方图标库）。

`m-icon` 组件已更新，提供 Material Icons 到 uni-icons 的自动映射。

---

## 🎯 使用方式

### 方式一：使用 m-icon 组件（推荐）

```vue
<template>
  <!-- 使用 Material Icons 风格的名称 -->
  <m-icon name="directions_bike" :size="48" color="#3B82F6" />
  <m-icon name="settings" :size="60" color="#ffffff" />
  <m-icon name="history" :size="24" />
</template>
```

### 方式二：直接使用 uni-icons

```vue
<template>
  <uni-icons type="location-filled" :size="48" color="#3B82F6"></uni-icons>
  <uni-icons type="gear-filled" :size="60" color="#ffffff"></uni-icons>
  <uni-icons type="bars" :size="24"></uni-icons>
</template>
```

---

## 📋 图标映射表

### 导航类

| Material Icons | uni-icons | 说明 |
|---------------|-----------|------|
| `home` | `home-filled` | 首页 |
| `arrow_back` | `back` | 返回 |
| `arrow_forward` | `forward` | 前进 |
| `menu` | `bars` | 菜单 |
| `close` | `closeempty` | 关闭 |
| `search` | `search` | 搜索 |

### 功能类

| Material Icons | uni-icons | 说明 |
|---------------|-----------|------|
| `directions_bike` | `location-filled` | 骑行/定位 |
| `settings` | `gear-filled` | 设置 |
| `history` | `bars` | 历史记录 |
| `location` | `location` | 定位 |
| `map` | `map-filled` | 地图 |

### 操作类

| Material Icons | uni-icons | 说明 |
|---------------|-----------|------|
| `delete` | `trash` | 删除 |
| `edit` | `compose` | 编辑 |
| `add` | `plus` | 添加 |
| `remove` | `minus` | 移除 |
| `check` | `checkmarkempty` | 勾选 |

### 媒体类

| Material Icons | uni-icons | 说明 |
|---------------|-----------|------|
| `play_arrow` | `play-filled` | 播放 |
| `pause` | `pause-filled` | 暂停 |
| `stop` | `stop-filled` | 停止 |
| `refresh` | `refresh` | 刷新 |

### 时间类

| Material Icons | uni-icons | 说明 |
|---------------|-----------|------|
| `schedule` | `clock` | 时间 |
| `timer` | `clock` | 计时器 |
| `alarm` | `notification` | 闹钟 |

### 其他

| Material Icons | uni-icons | 说明 |
|---------------|-----------|------|
| `star` | `star-filled` | 星标 |
| `favorite` | `heart-filled` | 喜欢 |
| `person` | `contact-filled` | 个人 |
| `speed` | `forward` | 速度 |

---

## 🎨 uni-icons 完整图标列表

### 常用图标

```
home, home-filled
gear, gear-filled
location, location-filled
map, map-filled
bars, list
search
plus, plus-filled
minus, minus-filled
close, closeempty
checkmarkempty, checkbox-filled
star, star-filled
heart, heart-filled
contact, contact-filled
phone, phone-filled
email, email-filled
chat, chat-filled
notification, notification-filled
clock
calendar
folder, folder-add
download, upload
refresh, redo, undo
compose, trash
eye, eye-slash
locked, unlocked
settings
more, more-filled
forward, back
play-filled, pause-filled, stop-filled
mic, mic-filled
camera, camera-filled
image, images
videocam, videocam-filled
```

---

## 📖 参考资料

- [uni-icons 官方文档](https://uniapp.dcloud.net.cn/component/uniui/uni-icons.html)
- [uni-icons 图标列表](https://hellouniapp.dcloud.net.cn/pages/extUI/icons/icons)

---

## 💡 添加新映射

如需添加新的图标映射，编辑 `components/m-icon/m-icon.vue` 中的 `ICON_MAP` 对象：

```javascript
const ICON_MAP = {
  // 添加新映射
  'your_material_icon': 'corresponding_uni_icon',
  // ...
};
```

---

**最后更新**: 2025-10-02
