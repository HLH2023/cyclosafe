# HBuilderX 使用指南

## 问题说明

本项目是 **uniapp 项目**，推荐使用 **HBuilderX** 开发，而不是使用 npm 安装依赖。

uniapp 相关的依赖（如 `@dcloudio/uni-app`）是 HBuilderX 内置的，无需单独安装。

## 正确的使用方式

### 方式一：HBuilderX（强烈推荐）✨

#### 1. 下载安装 HBuilderX

- 官网：https://www.dcloud.io/hbuilderx.html
- 下载"标准版"（免费）
- 支持 Windows、Mac、Linux

#### 2. 导入项目

1. 打开 HBuilderX
2. 点击 `文件` → `导入` → `从本地目录导入`
3. 选择项目目录：`/home/hlh/dev/school-homework/mobileHomework`
4. 点击确定

#### 3. 配置微信开发者工具路径

1. HBuilderX 菜单：`工具` → `设置` → `运行配置`
2. 找到"微信开发者工具路径"
3. 填入你的微信开发者工具安装路径

#### 4. 运行项目

1. 在 HBuilderX 中右键点击项目
2. 选择 `运行` → `运行到小程序模拟器` → `微信开发者工具`
3. HBuilderX 会自动编译并打开微信开发者工具

### 方式二：微信开发者工具直接导入

#### 1. 使用 HBuilderX 构建项目

在 HBuilderX 中：
1. 右键项目
2. `发行` → `小程序-微信`
3. 会在 `unpackage/dist/build/mp-weixin` 生成编译后的文件

#### 2. 在微信开发者工具中导入

1. 打开微信开发者工具
2. 新建项目 → 导入项目
3. 选择目录：`项目目录/unpackage/dist/build/mp-weixin`
4. 填入AppID：`wx6a2f44346c272a9a`
5. 确定

## 项目结构说明

```
mobileHomework/
├── src/                    # 源代码（开发时编辑这里）
│   ├── pages/
│   ├── components/
│   ├── utils/
│   └── ...
│
├── unpackage/              # 编译输出（自动生成）
│   └── dist/
│       ├── dev/            # 开发环境编译
│       └── build/          # 生产环境编译
│
├── manifest.json
├── pages.json
└── package.json
```

## 不需要安装的依赖

以下依赖由 HBuilderX 内置提供，**无需手动安装**：

- ❌ `@dcloudio/uni-app`
- ❌ `@dcloudio/uni-mp-weixin`
- ❌ `@dcloudio/uni-ui`
- ❌ `vue`
- ❌ `vite`

## 可选的第三方库

如果你想使用第三方库（如 Day.js），可以这样安装：

```bash
npm install dayjs
```

然后在代码中直接引入：

```javascript
import dayjs from 'dayjs';
```

## 图表库 uCharts 的使用

### 方式一：插件市场导入（推荐）

1. 访问：https://ext.dcloud.net.cn/plugin?id=271
2. 点击"使用 HBuilderX 导入插件"
3. 在 HBuilderX 中确认导入
4. 插件会自动安装到 `uni_modules` 目录

### 方式二：手动下载

1. 下载 uCharts：https://www.ucharts.cn/
2. 解压后将文件放入 `src/components/ucharts/`
3. 在页面中引入使用

## 常见问题

### Q: 为什么 npm install 会报错？

**A**: uniapp 项目不需要 npm install。HBuilderX 会自动处理所有 uniapp 相关的依赖。

### Q: 如何安装第三方库？

**A**: 只有非 uniapp 相关的第三方库才需要 npm 安装，如：
```bash
npm install dayjs
```

### Q: 项目能不能用 VSCode 开发？

**A**: 可以，但：
- 推荐用 HBuilderX（更好的 uniapp 支持）
- 如果用 VSCode，需要安装 "uni-app" 扩展
- 运行和编译仍然需要 HBuilderX

### Q: 如何真机调试？

**A**: 在 HBuilderX 中：
1. 运行项目到微信开发者工具
2. 在微信开发者工具中点击"真机调试"
3. 扫码在手机上打开

## 快速开始步骤

1. ✅ 下载安装 HBuilderX
2. ✅ 在 HBuilderX 中导入项目
3. ✅ 配置微信开发者工具路径
4. ✅ 运行到微信开发者工具
5. ✅ 真机调试测试GPS功能

---

**推荐方式**：使用 HBuilderX，一站式开发体验！
