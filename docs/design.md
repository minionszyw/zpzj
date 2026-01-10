# 子平真君 - 前端重构技术规格书 (Frontend Refactoring Specification)

## 1. 设计愿景 (Design Vision)

本项目将重构为**"水墨雅致 (Oriental Ink)"**风格。结合传统文化的沉稳与现代 Web 的交互体验，打造高端命理咨询应用。

**核心原则**：
*   **视觉**: 雅致（衬线体/留白）、水墨（黑白灰层次/朱砂点缀）。
*   **交互**: 移动端拟物（折页书册），桌面端专业（仪表盘）。
*   **体验**: 仪式感（加载文案）、专业性（真太阳时/五行正色）。

## 2. 技术实现规范 (Technical Implementation)

### 2.1 Tailwind 配置 (Tailwind Configuration)

在 `frontend/src/index.css` (Tailwind 4) 中定义以下主题变量。

#### 色彩变量 (CSS Variables)
需支持 `light` (默认) 和 `dark` 模式。

```css
@theme {
  /* 基础色板 */
  --color-ink-900: #1C1C1C; /* 浓墨 */
  --color-ink-700: #404040;
  --color-ink-500: #737373;
  --color-ink-300: #A3A3A3;
  --color-ink-100: #E5E5E5; /* 极淡墨/边框 */
  
  /* 纸张背景 */
  --color-paper-light: #FDFBF7; /* 宣纸/米白 */
  --color-paper-dark: #1C1C1C;  /* 碑拓/黑底 */

  /* 语义色 */
  --color-brand-primary: var(--color-ink-900);
  --color-brand-secondary: var(--color-ink-500);
  --color-brand-accent: #BC3D32; /* 朱砂红 - 强调/印章 */
  --color-brand-gold: #B89354;   /* 鎏金 - 高亮/贵气 */
  
  /* 五行正色 (用于排盘) */
  --color-wuxing-gold: #EAB308;  /* 金 - 槐黄/金 */
  --color-wuxing-wood: #15803D;  /* 木 - 石青/绿 */
  --color-wuxing-water: #0F172A; /* 水 - 墨黑/深蓝 */
  --color-wuxing-fire: #B91C1C;  /* 火 - 朱红/赤 */
  --color-wuxing-earth: #A16207; /* 土 - 赭石/褐 */
}
```

### 2.2 排版系统 (Typography)

利用系统字体栈，确保无需下载即可获得原生的高级感。

```css
:root {
  /* 标题/强调 - 衬线体 */
  --font-serif: "Songti SC", "Noto Serif SC", "STSong", "SimSun", serif;
  /* 正文/UI - 无衬线体 */
  --font-sans: "PingFang SC", "Microsoft YaHei", "Inter", sans-serif;
  /* 排盘 - 等宽/楷体 */
  --font-mono: "Kaiti SC", "STKaiti", "Courier New", monospace;
}
```

*   **标题 (H1-H3)**: 使用 `font-serif`，字重 `600`。
*   **正文**: 使用 `font-sans`，行高 `1.75`。
*   **排盘**: 使用 `font-mono`，确保天干地支垂直对齐。

## 3. 界面模块规格 (UI Specifications)

### 3.1 公共组件 (Common Components)

新建 `frontend/src/components/ui/` 目录存放基础组件。

*   **Button (`Button.tsx`)**:
    *   **Primary**: 实心墨色背景 (`bg-ink-900`) + 白字。Hover 时轻微上浮。
    *   **Outline**: 墨色边框 (`border-ink-900`) + 墨色字。
    *   **Ghost**: 透明背景，Hover 显示浅灰底 (`bg-ink-100/10`)。
    *   *形状*: 圆角 `rounded-md` (4px-6px)，拒绝大圆角。

*   **Card (`Card.tsx`)**:
    *   背景: `bg-white` (Light) / `bg-stone-900` (Dark)。
    *   边框: 极细边框 `border border-ink-100`。
    *   阴影: `shadow-sm` (极淡)。

*   **Input (`Input.tsx`)**:
    *   样式: 下划线风格 (`border-b border-ink-200`) 或 极细全框。
    *   状态: Focus 时边框变为 `brand-accent` (朱砂红)。

### 3.2 布局 (Layout)

*   **文件**: 修改 `frontend/src/components/Layout.tsx`。
*   **桌面端**:
    *   左侧固定 Sidebar (宽 240px)，背景色略深于主内容区。
    *   Logo 使用竖排文字或印章 SVG。
*   **移动端**:
    *   底部 TabBar：背景半透明磨砂 (`backdrop-blur-md`)。
    *   图标使用线性风格 (Lucide React)，激活态使用实心或朱砂色。

### 3.3 核心业务页 (Business Pages)

#### A. 八字排盘 (`BaziPage.tsx`)
*   **布局**: 紧凑平铺 (Compact)。
*   **组件**:
    *   **原局展示**: 制作 `BaziGrid` 组件，使用 CSS Grid 布局。
    *   **吸顶头**: 移动端滚动时，天干层 (`Year/Month/Day/Hour`) `sticky top-0` 吸顶。
    *   **五行着色**: 文字或背景色必须使用 `--color-wuxing-*` 变量。
*   **信息层级**: 日主 (Day Master) 需加粗或加底纹强调。

#### B. 智能咨询 (`ChatWindow.tsx`)
*   **消息气泡**:
    *   **User**: `bg-ink-900 text-white`. 头像显示在右侧。
    *   **AI**: `border border-ink-200 bg-paper-light`. 头像显示在左侧 (使用“真君”Logo)。
*   **加载状态**: 使用文字动画 ("推演中..." -> "查阅古籍..." -> "分析神煞...") 替代单纯的 Spinner。
*   **阅读体验**: 正文文字颜色 `--color-ink-900`，字号 `text-base`，禁止低对比度灰色。

#### C. 档案管理 (`ArchiveModal.tsx`)
*   **输入增强**: 添加“真太阳时”开关。
    *   开启后：显示经纬度输入框 (或城市选择器)，并在提交时自动校正时间。
    *   文案提示：“八字排盘需使用真太阳时以确保精准”。

## 4. 执行任务清单 (Actionable Checklist)

### 阶段一：基础建设 (Foundation)
- [x] **配置**: 更新 `frontend/src/index.css`，写入 CSS 变量和 Tailwind Theme 配置。
- [x] **组件**: 创建 `src/components/ui/Button.tsx` (包含多种变体)。
- [x] **组件**: 创建 `src/components/ui/Card.tsx`。
- [x] **组件**: 创建 `src/components/ui/Input.tsx`。
- [x] **布局**: 重构 `src/components/Layout.tsx` 为响应式 (Sidebar/TabBar 切换)。

### 阶段二：排盘重构 (Bazi Engine)
- [x] **样式**: 重写 `BaziChart.tsx`，实现“命书”风格网格布局。
- [x] **功能**: 实现移动端“原局吸顶”效果。
- [x] **视觉**: 应用五行正色系统。
- [x] **组件**: 重构 `FortuneSection.tsx` 适配新风格。
- [x] **页面**: 重构 `BaziPage.tsx` 整合新组件。

### 阶段三：咨询体验 (Chat Experience)
- [x] **组件**: 封装 `MessageBubble` 组件，支持头像和不同变体。
- [x] **交互**: 实现“文字轮播”Loading 效果。
- [x] **样式**: 优化 Markdown 渲染样式 (Typography 插件配置)。

### 阶段四：档案与细节 (Polishing)
- [x] **表单**: 改造档案录入弹窗，增加真太阳时逻辑。
- [x] **动画**: 为列表添加 `Framer Motion` 或 CSS 进场动画。
- [ ] **检查**: 全面走查深色模式适配。
