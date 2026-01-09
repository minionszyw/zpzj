# 子平真君 TODO 核心任务书 (严谨版)

此文档是基于 `PRD.md` 与 `plan.md` 对账后的最终执行清单。任务描述强制包含技术实现细节与 PRD 引用。

## 1. 交互架构重构 (Mobile-First Alignment)

### [x] T1: 导航与视图容器重构 (Ref: PRD Sec 3)
- **描述**：废弃当前的“顶部 Navbar + 侧边栏” PC 布局，重构为“底部 TabBar + 独立页面容器”移动端架构。
- **原子任务**：
    - [x] **路由重定义**：设置 `/chat`, `/bazi`, `/me` 三个根路由。
    - [x] **Tab 容器实现**：实现 `BottomNavigation` 组件，适配 Safe Area（iOS/Android 底部安全区）。
    - [x] **排盘页独立化**：将 `BaziChart` 从 `ChatPage` 剥离，实现独立的 `BaziPage`。
- **技术标准**：在移动端/窄屏模式下，三个 Tab 必须固定在底部且高度一致。 (Done: 2026-01-09)

### [x] T2: 咨询 Tab - 会话管理逻辑 (Ref: PRD Sec 3.1)
- **描述**：实现会话历史列表，作为咨询 Tab 的首页，解决目前“只能对单一档案咨询”的局限。
- **原子任务**：
    - [x] **会话入口页**：展示 `ChatSession` 列表，支持按 `updated_at` 排序。
    - [x] **会话与档案强绑定**：新建会话时强制弹出档案选择器，绑定后不可更改（满足 PRD 2.4 约束）。
    - [x] **交互手势**：实现列表项的滑动/长按删除（或通过 Lucide 按钮）。
- **技术标准**：点击会话应进入对应的对话窗口，且该窗口必须能自动感知所绑定档案的最新排盘数据。 (Done: 2026-01-09)

## 2. 专业命理可视化增强

### [x] T3: 出生地点高精度解析 (Ref: PRD Sec 2.2)
- **描述**：将硬编码的经纬度改为基于 `latlng.json` 的真实查找，以支撑精准的“真太阳时”计算。
- **原子任务**：
    - [x] **后端 Search 接口**：`LocationService.search` 实现对 `zpbz/data/latlng.json` 的模糊匹配返回（城市, 经度, 纬度）。
    - [x] **前端 SearchBox**：`ArchiveModal` 引入 Debounce 搜索下拉框，用户选择后自动填充 `lat/lng` 隐藏域。
- **技术标准**：档案存储的经纬度误差需控制在 0.01 度以内。 (Done: 2026-01-09)

### [x] T4: 运程交互钻取系统 (Ref: PRD Sec 2.3)
- **描述**：实现大运 -> 流年 -> 流月的深度下钻，这是专业命理应用的核心竞争力。
- **原子任务**：
    - [x] **大运列表渲染**：根据 `BaziResult.fortune` 渲染 10 年一大运的横向/纵向滑块。
    - [x] **流年钻取**：点击大运，平滑展示该大运下的 10 个流年。
    - [x] **流月展开**：点击流年，采用 Drawer（抽屉）或 Modal 展示 12 个流月的干支及运势评分。
- **技术标准**：钻取深度必须达到“月”级，干支数据必须 100% 取自 `zpbz` 引擎，严禁 LLM 生成。 (Done: 2026-01-09)

## 3. AI Agent 记忆与分析深度 (Ref: Plan 3.2 & PRD 2.4)

### [x] T5: 分层记忆架构 - 短期窗口与自动摘要
- **描述**：实现 PRD 要求的第三层记忆逻辑，避免 Token 溢出并保持上下文连贯。
- **原子任务**：
    - [x] **Sliding Window**：后端根据 `User.settings.depth` 截取最近 N 轮对话。
    - [x] **Summarize Node**：在 LangGraph 中增加 `summarize` 节点，当对话超过 N+2 轮时，自动触发摘要生成并更新 `ChatSession.last_summary`。
    - [x] **System Prompt 注入**：将 `last_summary` 注入 Agent 的初始 Context。
- **技术标准**：LLM 接收的历史消息长度恒定，首字响应延迟（TTFT）不因对话轮数增加而线性增长。 (Done: 2026-01-09)

### [x] T6: 回答模式 (Response Mode) 逻辑闭环
- **描述**：实现普通/专业模式的差异化提示词策略。
- **原子任务**：
    - [x] **设置项持久化**：在“我的”页面实现 `response_mode` 切换，同步至后端 `users` 表。
    - [x] **Agent 动态引导**：`respond_node` 判断模式。专业模式强制开启 `RAGNode` 并注入“必须引用古籍原文”的约束；普通模式增加“侧重心理疏导”的约束。
- **技术标准**：专业模式下，回复内容中《渊海子平》原文引用占比应 > 20%。 (Done: 2026-01-09)

## 4. 细节与工程质量 (Done 为已完成)

- [x] **D1: SSE 流式渲染与 Markdown 支持**：已实现逐字输出与代码块高亮。
- [x] **D2: 计算与分析分离架构**：后端已完成 `zpbz` 引擎的 FastAPI 封装与 Agent 接口分离。
- [x] **D3: 基础事实记忆管理**：已实现 MemoryFact 的 CRUD UI。
- [x] **B1: 历法大小写容错**：`ArchiveListPage` 需统一使用 `toLowerCase()` 处理历法匹配。 (Done: 2026-01-09)
- [x] **B2: 后端 PYTHONPATH 稳定性**：在 Dockerfile 中通过 `ENV PYTHONPATH` 固化路径。 (Done: 2026-01-09)
