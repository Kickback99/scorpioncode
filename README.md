# scorpioncode

**一个分享编程知识和学习笔记的平台。**

<div align="center">

<p>
  <a href="https://github.com/Kickback99/scorpioncode/stargazers">
    <img src="https://img.shields.io/github/stars/Kickback99/scorpioncode?style=for-the-badge&logo=github&labelColor=1f2328&color=181717" alt="Stars">
  </a>
  <a href="https://github.com/Kickback99/scorpioncode/network/members">
    <img src="https://img.shields.io/github/forks/Kickback99/scorpioncode?style=for-the-badge&logo=github&labelColor=1f2328&color=181717" alt="Forks">
  </a>
  <img src="https://img.shields.io/badge/Cases-2-2ea44f?style=for-the-badge" alt="Cases">
  <img src="https://img.shields.io/badge/Original-Scorpion%20Code-ff7e33?style=for-the-badge" alt="Original">
  <a href="https://github.com/sponsors/Kickback99">
    <img src="https://img.shields.io/badge/Sponsor-GitHub-ec4a89?style=for-the-badge" alt="Sponsor">
  </a>
</p>

</div>

## 项目简介

蝎子编程（scorpioncode）是一个分享编程知识和学习笔记的平台，包含 **用户端**（面向访客的浏览与内容展示）和 **管理端**（面向管理者的内容与数据管理）。

本项目由两部分组成：

| 模块      | 说明                                          | 源码 |
|-----------|-----------------------------------------------|------|
| `admin`   | 管理端（Vue 3 + Vite + Element Plus）         | 开源 |
| `client`  | 用户端（Vue 3 + Vite + Vuetify）              | 开源 |
| `server`  | 后端（Spring Boot 3.1.2，两个 JAR 包）        | 闭源（仅提供二进制） |
| `database`| MySQL 数据库脚本                               | 提供 |

后端以两个自包含 JAR 包的形式提供，同时承载 API 接口与已构建的前端页面。配置好 MySQL 和 Redis 后即可直接启动，无需额外构建。

## 技术栈

- **前端**：Vue 3、Vite、Vue Router、Pinia、Axios；管理端采用 Element Plus，用户端采用 Vuetify
- **后端**：Spring Boot 3.1.2、Java 17、MySQL、Redis、Websocket
- **构建/开发**：Node.js 18+

## 运行环境要求

- **Java 17+**（仅需 JRE）——运行后端 JAR 包
- **MySQL 8.0+**
- **Redis 5.0+**
- **Node.js 18+**——仅在自行构建或开发前端时需要

## 快速开始（开箱即用）

### 1. 初始化数据库

```bash
mysql -u root -p < database/scorpioncode.sql
```

执行后将创建 `scorpioncode` 数据库及所需的数据表。

### 2. 配置后端

打开 [`server/application.yml`](server/application.yml)，填写 **MySQL** 和 **Redis** 的连接信息：

```yaml
scorpion:
  mysql:
    url: jdbc:mysql://localhost:3306/scorpioncode?characterEncoding=utf-8&useSSL=false
    username: root
    password: your-password

  redis:
    host: localhost
    port: 6379
    password: your-password
```

> MySQL 和 Redis 为必填项，OSS、邮件等配置为可选。

### 3. 启动服务

使用自带的启动脚本，或直接运行 JAR 包：

```bash
# Windows
server\start.bat

# Linux / macOS
cd server && ./start.sh
```

也可以分别手动启动：

```bash
java -jar server/scorpioncode-admin.jar    # 管理端后端，端口 8800
java -jar server/scorpioncode-client.jar   # 用户端后端，端口 8900
```

### 4. 浏览器访问

| 服务     | 地址                        |
|----------|-----------------------------|
| 管理端   | http://localhost:8800       |
| 用户端   | http://localhost:8900       |

## 认证模式

后端通过 [`server/application.yml`](server/application.yml) 中的 `auth` 配置认证方式，支持 `jwt` 和 `cookie` 两种模式：

| 模式           | 后端配置（`application.yml`） | 前端启动命令      |
|----------------|-------------------------------|-------------------|
| JWT（默认）    | `auth.mode: jwt`              | `npm run dev`     |
| Cookie         | `auth.mode: cookie`           | `npm run dev:cookie` |

- **JWT 模式（默认）**：后端 `auth.mode` 保持 `jwt`，用户端和管理端执行 `npm run dev` 即可。
- **Cookie 模式**：将后端 `auth.mode` 改为 `cookie`，用户端和管理端改为执行 `npm run dev:cookie`（由 HttpOnly Cookie 浏览器管理）。
- 注意：`cookie-secure` 仅在 HTTPS 部署时置为 `true`，HTTP 环境下必须为 `false`，否则浏览器会拒收 Cookie。

## 前端开发（仅前端）

前端为开源项目，可独立构建。开发时前端会代理 API 请求到后端，因此需先启动后端服务（见上文）。

### 管理端

```bash
cd admin
npm install
npm run dev          # 开发服务器，代理到 http://localhost:8800
npm run build:prod   # 生产构建
```

### 用户端

```bash
cd client
npm install
npm run dev          # 开发服务器，代理到 http://localhost:8900
npm run build:prod   # 生产构建
```

后端地址通过各项目下 `.env.*` 文件中的 `VITE_HOST` 配置。

## 目录结构

```
scorpioncode/
├── admin/          # 管理端（Vue 3）
├── client/         # 用户端（Vue 3）
├── server/         # 后端 JAR 包与配置
│   ├── scorpioncode-admin.jar
│   ├── scorpioncode-client.jar
│   ├── application.yml
│   ├── start.bat
│   └── start.sh
└── database/
    └── scorpioncode.sql
```

## 许可声明

> 本项目仅限学习交流，可自由使用、修改、分发，需保留署名并以相同协议开源；不可商用或闭源分发。
