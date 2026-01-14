# 子平真君 AI (Ziping Zhenjun AI)

子平真君是一款结合了高精度命理引擎（zpbz）与 AI Agent（LangGraph）的专业命理分析 Web 应用。它实现了计算逻辑与分析逻辑的严格分离，提供流式对话咨询、交互式八字排盘及长期事实记忆功能。

## 🌟 核心特性

- **高精度排盘**：基于 `zpbz` 引擎，提供包含纳音、十神、藏干、格局、五行能量等在内的深度命理数据。
- **AI 智能咨询**：利用 LangGraph 驱动的 AI Agent，支持 SSE 流式响应，具备古籍 RAG 检索和长期事实记忆。
- **分层记忆架构优化**：
    - **分片注入**：核心 Prompt 精简化，Token 消耗降低 90%，响应速度显著提升。
    - **工具化查询**：AI 按需通过 `query_fortune_details` 工具调取详细流年流月数据。
- **档案管理**：支持多档案管理，高精度出生地经纬度解析，支持中文化日期选择。
- **响应式设计**：适配 PC 与移动端，提供现代化的 UI/UX 体验。

## 🛠 技术栈

- **前端**：React 19, Tailwind CSS 4, Zustand, Vite (Rolldown), Headless UI, Lucide React.
- **后端**：FastAPI, SQLModel (PostgreSQL), Redis, LangGraph, LangChain.
- **存储**：PostgreSQL + pgvector (向量存储), Redis (缓存/限流).
- **部署**：Docker Compose (全环境容器化).

## 📁 项目结构

```text
zpzj/
├── backend/                # FastAPI 后端项目
│   ├── app/                # 应用核心代码
│   ├── .env.example        # 环境变量模板 (全项目配置中心)
│   └── Dockerfile          # 后端镜像定义
├── frontend/               # React 前端项目
│   ├── src/                # 前端源代码
│   └── Dockerfile          # 前端生产/开发镜像定义
├── zpbz/                   # 核心命理计算引擎 (Git Submodule)
├── data/                   # 命理古籍等原始数据 (挂载至容器)
├── nginx/                  # 生产环境 Nginx 配置 (支持 SSE 优化)
├── docker-compose.yml      # 生产环境部署配置
└── docker-compose-dev.yml  # 开发环境部署配置 (含 Cloudflare Tunnel)
```

## 🚀 快速开始

### 1. 环境准备

- 安装 Docker & Docker Compose。
- 在 `backend/` 目录下创建 `.env` 文件（由 `backend/.env.example` 复制）：
  ```bash
  cp backend/.env.example backend/.env
  ```
- **注意**：本项目采用中心化配置，前端与后端的环境变量均在 `backend/.env` 中管理。

### 2. 启动应用 (Docker)

#### 开发模式 (推荐远程/本地开发)
集成 **Cloudflare Tunnel** 且前端开启了 **Preview 模式** 以优化远程访问速度。
```bash
docker compose -f docker-compose-dev.yml up -d --build
```
- **本地访问**：前端 `http://localhost:5173`，后端 `http://localhost:8000`。
- **远程访问**：通过隧道域名访问（需在 `.env` 中配置 `TUNNEL_TOKEN`）。
- **优化**：开发模式前端使用 `npm run build && npm run preview`，解决远程加载慢的问题。

#### 生产模式 (阿里云 ESC / 线上环境)
使用 Nginx 反向代理，支持 SSE 流式输出优化。
```bash
docker compose up -d --build
```
- **访问地址**：`http://your-ip-or-domain`。
- **特性**：所有请求经由 Nginx，后端自动识别 `--proxy-headers`。

## ⚙️ 核心配置说明 (`backend/.env`)

| 变量名 | 说明 |
| :--- | :--- |
| `TUNNEL_TOKEN` | Cloudflare Tunnel 鉴权令牌，用于外网穿透。 |
| `VITE_ALLOWED_HOSTS` | 前端允许访问的域名，解决 Vite 开发服务器 Host 限制。 |
| `VITE_API_BASE_URL` | 前端请求后端的地址，远程访问需填隧道的 API 域名。 |
| `LLM_API_KEY` | DeepSeek 或其他大模型的 API KEY。 |

## 🧪 开发与测试

### 后端测试
```bash
docker compose -f docker-compose-dev.yml exec backend pytest
```

## 📜 许可证

MIT License