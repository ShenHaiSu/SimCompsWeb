# SimCompsWeb 全栈项目

## 项目简介

这是一个基于 TypeScript 的全栈项目，包含前端和后端两部分。旨在提供一个高效、可扩展的 Web 解决方案。

## 技术栈

### 前端

- Vue.js
- TypeScript
- Vite

### 后端

- TypeScript
- Bun

## 项目结构

```
SimCompsWeb/
├── backEnd/             # 后端服务目录
│   ├── composable/      # 可组合函数目录
│   ├── dbSet/           # 数据库文件目录
│   ├── fileSet/         # 文件集合目录
│   ├── frontEndDist/    # 前端构建产物目录
│   ├── middleware/      # 中间件目录
│   ├── router/          # 路由定义目录
│   ├── schema/          # SQLite数据表模板文件夹
│   ├── util/            # 工具函数目录
│   ├── index.ts         # 后端入口文件
│   ├── routerEntry.ts   # 分支路由入口文件
│   └── ...
└── frontEnd/            # 前端应用目录
    ├── src/             # 源代码
    │   ├── main.ts      # 前端入口文件
    │   ├── App.vue      # 根组件
    │   ├── router/      # 路由定义
    │   ├── stores/      # 状态管理
    │   ├── views/       # 页面组件
    │   ├── components/  # 可复用组件
    │   └── assets/      # 静态资源
    └── ...
```

## 安装与运行

请确保你的环境中已安装 Node.js 和 Bun。

### 1. 克隆项目

```bash
git clone <仓库地址>
cd SimCompsWeb
```

### 2. 后端设置

进入后端目录并安装依赖，然后启动服务：

```bash
cd backEnd
bun install
bun dev # 或者根据实际启动命令调整
```

### 3. 前端设置

打开新的终端，进入前端目录并安装依赖，然后启动开发服务器：

```bash
cd frontEnd
pnpm install # 或者 npm install / yarn install
pnpm dev # 或者 npm run dev / yarn dev
```

## 待完成列表

### 后端

- 后端基础建设

### 前端

- 前端基础建设


## 已完成列表

- 2025 年 9 月 23 日
  - 项目基本结构搭建 (前端/后端分离)
