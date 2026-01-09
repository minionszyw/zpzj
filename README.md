# 子平真君 AI (Ziping Zhenjun AI)

子平真君是一款结合了高精度命理引擎（zpbz）与 AI Agent（LangGraph）的专业命理分析 Web 应用。它实现了计算逻辑与分析逻辑的严格分离，提供流式对话咨询、交互式八字排盘及长期事实记忆功能。

## 🌟 核心特性

- **高精度排盘**：基于 `zpbz` 引擎，提供包含纳音、十神、藏干、格局、五行能量等在内的深度命理数据。
- **AI 智能咨询**：利用 LangGraph 驱动的 AI Agent，支持 SSE 流式响应，具备古籍 RAG 检索和长期事实记忆。
- **档案管理**：支持多档案管理，高精度出生地经纬度解析。
- **响应式设计**：适配 PC 与移动端，提供现代化的 UI/UX 体验。

## 🛠 技术栈

- **前端**：React 19, Tailwind CSS 4, Zustand, Vite, Headless UI, Lucide React.
- **后端**：FastAPI, SQLModel (PostgreSQL), Redis, LangGraph, LangChain.
- **存储**：PostgreSQL + pgvector (向量存储), Redis (缓存/限流).
- **部署**：Docker Compose.

## 📁 项目结构

```text
zpzj/
├── backend/                # FastAPI 后端项目
│   ├── app/                # 应用核心代码
│   ├── tests/              # 后端测试用例
│   └── Dockerfile          # 后端镜像定义
├── frontend/               # React 前端项目
│   ├── src/                # 前端源代码
│   └── package.json        # 前端依赖
├── zpbz/                   # 核心命理计算引擎 (Git Submodule)
├── data/                   # 命理古籍等原始数据
└── docker-compose.yml      # 全栈容器化定义
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd zpzj
```

### 2. 环境配置

#### 后端配置
在 `backend/` 目录下创建 `.env` 文件（可参考 `.env.example`）：
```bash
cp backend/.env.example backend/.env
```
并填写您的 `LLM_API_KEY` (DeepSeek) 和 `SMTP` 配置。

#### 前端配置
在 `frontend/` 目录下创建 `.env` 文件：
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. 启动应用 (Docker)

确保您已安装 Docker 和 Docker Compose，然后在根目录执行：

```bash
docker-compose up -d --build
```

- 前端地址：`http://localhost:5173`
- 后端 API 地址：`http://localhost:8000`
- API 文档：`http://localhost:8000/docs`

## 🧪 开发与测试

### 后端测试
```bash
cd backend
pytest
```

### 前端开发
```bash
cd frontend
npm install
npm run dev
```

## 📜 许可证

MIT License
