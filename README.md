# LinkVault — 我的网页收藏

> 收藏网页 · AI 摘要 · 随时回顾

LinkVault 是一个移动优先的个人网页书签管理器。输入 URL 自动抓取标题、封面和描述，调用 DeepSeek AI 生成中文摘要，按分类和标签组织，数据存储在浏览器本地 IndexedDB。

**🔗 https://linkvault-7gt.pages.dev**

---

## 功能

| 功能 | 说明 |
|------|------|
| 🔗 一键抓取 | 输入 URL 自动解析 og:title / og:image / og:description |
| 🇨🇳 国内网站支持 | 腾讯云 CloudBase 云函数（上海），无云 IP 封锁 |
| 🤖 AI 摘要 | DeepSeek API 生成中文摘要 |
| 🏷 分类管理 | 9 种预设颜色 + 自定义名称 |
| 🔍 搜索筛选 | 标题、描述、标签关键词搜索 + 分类横滑筛选 |
| 🖼 图片配置 | 支持文件上传、URL 输入，base64 存储到 IndexedDB |
| 📱 移动优先 | 下拉刷新、安全区适配、PWA |
| 💾 本地存储 | IndexedDB（Dexie.js），无需注册登录 |

---

## 技术栈

```
前端     React 19 + Vite + Tailwind CSS v4 + React Router v7
存储     Dexie.js (IndexedDB)
图标     Lucide React
部署     Cloudflare Pages（静态前端 + Functions）
抓取     腾讯云 CloudBase 云函数（国内 IP）→ Cloudflare Function（国际 fallback）
AI       DeepSeek API (deepseek-chat)
```

### 抓取架构

```
用户添加链接
    │
    ├─ 1. 腾讯云 CloudBase 云函数（上海，国内 IP）
    │      → 百度 / B站 / 知乎 / DeepSeek 等国内网站
    │      → 无 CORS 限制 + 无云 IP 封锁
    │
    ├─ 2. 浏览器直连 fetch（用户真实 IP）
    │      → CORS 友好站点的 fallback
    │
    └─ 3. Cloudflare Function（国际 IP）
           → GitHub 等国际站点
```

---

## 项目结构

```
linkvault/
├── src/
│   ├── types/index.ts            # IBookmark, ICategory
│   ├── lib/
│   │   ├── db.ts                 # Dexie 数据库 schema
│   │   ├── api.ts                # API 调用（国内 + CF 双路径）
│   │   └── utils.ts              # 工具函数 + 客户端 meta 提取
│   ├── hooks/
│   │   ├── useBookmarks.ts       # 数据查询/CRUD hooks
│   │   └── usePullToRefresh.ts   # 下拉刷新手势
│   ├── components/               # 10+ UI 组件
│   └── pages/                    # 4 个页面
├── functions/api/
│   ├── fetch-meta.js             # CF Function — 服务端 OG 抓取
│   └── summarize.js              # CF Function — DeepSeek 摘要
├── cloudfunctions/fetch-meta/
│   ├── index.js                  # CloudBase 云函数 — 国内 IP 抓取
│   └── package.json
├── cloudbaserc.json              # CloudBase 部署配置
├── server.js                     # Express 本地开发服务器
├── index.html                    # PWA 入口
└── vite.config.ts
```

---

## 本地开发

### 前置条件

- Node.js ≥ 18
- DeepSeek API Key（[platform.deepseek.com](https://platform.deepseek.com)）

### 启动

```bash
cd linkvault
npm install

# 配置 API Key
echo "DEEPSEEK_API_KEY=sk-xxxxxxxx" > .env

# 同时启动前端 :5173 + 后端 :3001
npm start
```

### 构建

```bash
npm run build       # tsc + vite → dist/
npx vite preview    # 预览构建产物
```

---

## 部署

### Cloudflare Pages（静态前端）

```bash
npm run build
npx wrangler pages deploy dist --project-name=linkvault
```

`functions/api/` 目录由 Cloudflare Pages 自动识别为 Functions。

### 腾讯云 CloudBase（国内抓取云函数）

```bash
# 安装 CLI
npm i -g @cloudbase/cli

# 登录
cloudbase login

# 部署云函数
cloudbase fn deploy fetch-meta -e rss-d0g4abivmd539ea4f --force

# 创建 HTTP 访问服务
cloudbase service create -e rss-d0g4abivmd539ea4f -p fetch-meta -f fetch-meta
```

函数代码在 `cloudfunctions/fetch-meta/index.js`，零依赖（Node.js 18 原生 fetch）。

---

## 页面路由

| 路径 | 页面 | 功能 |
|------|------|------|
| `/` | 首页 | 双列卡片 + 搜索 + 分类筛选 + 下拉刷新 |
| `/add` | 添加收藏 | URL 输入 → 抓取预览 → 分类/标签 → AI 摘要 → 保存 |
| `/bookmark/:id` | 收藏详情 | 大封面 + 信息 + 编辑图片 + 重生成摘要 + 删除 |
| `/categories` | 分类管理 | 列表 + Modal（名称 + 9 色选择器）+ 增删改 |

---

## 数据模型

### Bookmark

| 字段 | 类型 | 说明 |
|------|------|------|
| id | `string` | nanoid(12) |
| url | `string` | 原始链接 |
| title | `string` | 网页标题 |
| description | `string` | 网页描述 |
| coverImage | `string` | 封面图（URL 或 base64） |
| summary | `string` | AI 中文摘要 |
| categoryId | `string` | 关联分类 |
| tags | `string[]` | 自由标签 |
| createdAt | `number` | 创建时间戳 |
| updatedAt | `number` | 更新时间戳 |

### Category

| 字段 | 类型 | 说明 |
|------|------|------|
| id | `string` | 唯一标识 |
| name | `string` | 分类名称 |
| color | `string` | hex 颜色 |
| createdAt | `number` | 时间戳 |

存储引擎：IndexedDB（Dexie.js v2 schema），数据库名 `LinkVaultDB`。

---

## 设计规范

### 色彩

| 角色 | 色值 | 用途 |
|------|------|------|
| 背景 | `#FAF9F7` | 暖灰白全局背景 |
| 卡片 | `#FFFFFF` | 卡片、输入框、弹窗 |
| 主色 | `#E17055` | 珊瑚橙 — FAB、按钮、选中态 |
| 深文字 | `#2D2D2D` | 标题、正文 |
| 浅文字 | `#8E8E93` | 辅助信息、占位符 |

### 组件库

- Soft UI Evolution 卡片阴影（WCAG AA）
- 系统字体栈（PingFang SC + Inter）
- CSS `safe-area-inset-bottom` 移动安全区
- 9 色分类胶囊标签
