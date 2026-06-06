# Demo 录制指南

AI Agent 智能合约自动审计与验证 — 录制视频操作手册。

---

## 两个阶段说明

| | 阶段一：漏洞发现 | 阶段二：漏洞验证 |
|---|---|---|
| **模式** | `discover_only`（默认） | `verify_finding` |
| **流程** | Parse → Slither（可点击展开工具列表） → LLM Audit | Parse → PoC Generation → Forge Test → Verdict |
| **目标** | 从源码自动发现漏洞 | 用可执行 PoC 证明已知漏洞 |
| **产物** | 审计报告 + 漏洞发现列表 | PoC 代码 + Forge 测试结果 + 验证结论 |

---

## 环境准备

1. 启动后端：
   ```bash
   cd /path/to/ETH
   uvicorn scripts.app:app --reload --port 8000
   ```
2. 启动前端：
   ```bash
   cd frontend
   npm run dev
   ```
3. 浏览器打开 `http://localhost:5173`

---

## Step 0 — 首页（Landing Page）

**界面：** 复古风格首页，带 3D Macintosh 动画、项目介绍、两种模式卡片。

**操作：**
- 展示页面全貌，简单滚动一下看"漏洞发现到验证的自动化闭环"部分
- 点击 **"开始审计"** 进入主应用

**口述要点：**
- "这是一个 AI Agent 驱动的智能合约自动化审计与验证平台"
- "支持两种模式：自动发现漏洞 和 验证已有漏洞结论"

---

## Step 1 — 操作台（Upload Page）

**界面：** 两栏布局：
- 左侧：两个模式卡片 —— **"自动发现漏洞"**（默认选中）和 **"验证已有漏洞结论"**
- 右侧：拖拽上传 `.zip` Solidity 项目的区域

**操作：**
1. 展示两个模式卡片，指出当前选中的是"自动发现漏洞"
2. 将示例 zip 文件拖入上传区域（或点击选择文件）
3. 上传后自动开始审计流程

---

## 阶段一演示 — 自动发现漏洞（`discover_only`）

> 保持默认的"自动发现漏洞"模式，上传 zip 后进入

上传后界面分为：
- **左侧（Audit Terminal）：** 实时流式输出 — LLM 分析文本、阶段完成信息、漏洞发现卡片
- **右侧（Pipeline 面板）：** 五步流程，带动画进度指示器

### 1.1 — Parse Structure（解析结构）

- **状态：** 转圈 → 绿色对勾（DONE）
- **信息：** "Uploaded project loaded"
- **耗时：** ~1 秒
- 系统解析 Solidity 项目结构，识别合约和函数

### 1.2 — Slither Analysis（静态分析）— 可点击！

- **状态：** 转圈 → 绿色对勾（DONE）
- **信息：** "Static analysis complete"
- **耗时：** ~1.2 秒

**重要演示交互：**
- **点击右侧 Pipeline 面板中的 "Slither Analysis" 步骤**
- 会弹出一个 **ToolsPopover（工具弹窗）**，出现在左侧，显示：
  - **Slither** — 工业级静态分析（绿色圆点，ACTIVE）
  - **LLM Detector** — AI 驱动漏洞检测（ACTIVE）
  - **Mythril** — 符号执行分析（SOON）
  - **Securify v2** — 形式化验证（SOON）
  - **Echidna** — 基于属性的模糊测试（SOON）
- 底部显示 "More tools coming... +3 QUEUED"
- 这展示了模块化工具架构 — 新的分析工具可以灵活接入
- 点击其他区域或按 Escape 关闭弹窗

**口述要点：**
- "Slither 分析步骤可以点击。点击后展示模块化工具架构"
- "目前 Slither 和 LLM 检测器已激活，Mythril、Securify、Echidna 是规划中的工具，展示平台的可扩展性"

### 1.3 — LLM Audit（AI 审计）

- **状态：** 转圈 → 绿色对勾（DONE）
- **信息：** "LLM audit complete"
- **耗时：** 数秒（审计报告文本逐字流入左侧 Terminal）
- 出现 **Finding 卡片**，显示发现的漏洞（例如 "Denial of Service in Transactions [Restricted Mode]"，HIGH 级别）

**口述要点：**
- "LLM Agent 正在实时分析合约代码，审计分析文本流式输出在左侧"
- "发现了一个高危漏洞 — 受限模式下的拒绝服务攻击向量"

### 1.4 — PoC Generation & Forge Test

- 两步都显示 **SKIPPED** — 发现模式不进行漏洞验证

### 1.5 — Verdict（结论）

- **标签：** "DISCOVERY COMPLETE"
- **信息：** "Discovery complete"

**口述要点：**
- "阶段一到此结束。系统通过静态分析和 AI 审计发现了漏洞"
- "如果需要验证这些发现，切换到阶段二"

---

## 阶段二演示 — 漏洞验证（`verify_finding`）

> 点击 **"重新审计"**（New Audit），切换到 **"验证已有漏洞结论"** 模式，可选在文本框中粘贴漏洞描述，然后重新上传 zip

### 2.1 — Parse Structure

- **状态：** 转圈 → 绿色对勾（DONE）
- **信息：** "Uploaded project loaded"

### 2.2 — Slither & LLM Audit

- 两步都显示 **SKIPPED** — 已有报告，无需重新发现

### 2.3 — PoC Generation（生成 PoC）

- **状态：** 转圈 → 绿色对勾（DONE）
- **信息：** "PoC generated — N lines of Foundry test"
- **耗时：** 数秒（生成的 Solidity 测试代码逐字流入 Audit Terminal）
- 可能有多轮尝试（第一轮失败时自动修复重试）
- Pipeline 面板此步骤下方出现 **"PoC Generated"** 信息框
- **Audit Terminal 中显示：**
  - 流式输出的 PoC 代码生成文本
  - `> PoC Generated (Round N) — X lines of Foundry test`

**口述要点：**
- "AI Agent 正在自动生成漏洞利用代码 — 一个 Foundry 测试，用来复现漏洞"
- "可以看到 Solidity 测试代码实时生成，整个过程完全自动化"

### 2.4 — Forge Test（Forge 测试）

- **状态：** 转圈 → 绿色对勾（DONE）
- **信息：** "Testing complete"
- **耗时：** ~1 秒
- **Audit Terminal 中显示：**
  - Forge 测试的完整输出（编译日志、测试结果）
  - `> Forge Test (Final): PASSED — [PASS] test_RestrictedModeDOS()`
- Pipeline 面板此步骤下方出现 **"Test Result"** 信息框，显示测试函数名和 gas 消耗
- 最终 Forge 输出内容：
  ```
  [PASS] test_RestrictedModeDOS() (gas: 214711)
  Vulnerability Exists: Attack successfully prevents victim transactions during cooldown
  ```

**口述要点：**
- "Forge 测试编译执行完成。测试通过，确认漏洞存在"
- "攻击者可以在冷却期内阻止受害者的交易"

### 2.5 — Verdict（结论）

- **标签：** 红色 "VULNERABLE"
- **信息：** "Vulnerability Exists: Attack successfully prevents victim transactions during cooldown"
- Audit Terminal 底部显示 `**Verdict: ...**`

**口述要点：**
- "最终结论：漏洞确认存在，附有可执行的利用证据"
- "从上传源码到生成可执行 PoC 并验证，全程自动化"

---

## Analysis 详情页展示

在 Audit Terminal 顶部点击 **"View project functions and call graph"** 进入 `/analysis` 页面。

### Function Detail（函数详情）标签

- 左侧：函数列表侧边栏，按合约分组，支持搜索
- 右侧上：源码查看器，带行号和语法高亮
- 右侧下：函数元数据 — 签名、文件位置、调用者(called by)、被调用者(calls)、是否为 modifier
- **操作：** 在侧边栏选择不同函数，观察源码和元数据变化

### Call Graph（调用图）标签

- 交互式可视化调用图，展示所有合约函数的依赖关系
- 节点可点击，选中后高亮显示
- 支持缩放、拖拽、小地图导航
- **操作：** 点击不同节点浏览函数依赖

### Vulnerabilities（漏洞）标签

- 顶部：统计面板 — 漏洞总数 + 按严重等级分类（High / Medium / Low / Informational）
- 左侧（~40%）：**AI Security Advisor** 聊天面板，可以就漏洞提问
- 右侧（~60%）：漏洞卡片列表，每张卡片包含：
  - 严重等级彩色标记和置信度
  - 漏洞描述
  - 可展开的代码位置（显示受影响的源码片段）
- **操作：**
  1. 展开一个漏洞卡片查看代码位置
  2. 在 AI Advisor 中提问，例如"这个漏洞如何修复？"

### Execution（执行）标签

- 终端风格的 Forge 测试输出查看器
- 带语法高亮（PASS 绿色、FAIL 红色、文件路径蓝色）
- 顶部显示测试状态标签（PASSED/FAILED）和 gas 消耗
- 支持复制全部输出
- **操作：** 展示测试输出，指出 PASS/FAIL 状态

### Example Selector（示例切换）

- 页面顶部右侧下拉菜单，可切换不同预置审计案例
- **操作：** 切换到另一个案例（如 `cleverminu-approve-race`），观察数据变化

---

## AI Chat（浮动聊天抽屉）

主审计工作台右下角有浮动聊天图标（审计开始后出现）。

**操作：**
1. 点击图标打开 AI 聊天抽屉
2. 提问示例：
   - "用简单的语言解释这个漏洞"
   - "这个 DoS 问题的修复方案是什么？"
   - "攻击者在生产环境中如何利用这个漏洞？"
3. AI 基于审计上下文给出回答

---

## 推荐录制流程

### 方案 A — 完整演示（两个阶段都展示）

| 步骤 | 时长 | 操作内容 |
|------|------|---------|
| 0. 首页 | 10s | 展示页面，点击"开始审计" |
| 1. 操作台（发现模式） | 10s | 展示模式卡片，上传 zip |
| 1.2 Slither 分析 | 8s | **点击展示 ToolsPopover 工具弹窗** |
| 1.3 LLM 审计 | 15s | 观看流式分析输出 |
| 1.5 结论 | 3s | "Discovery complete" |
| — 重新审计 | 5s | 切换到验证模式，重新上传 |
| 2.3 PoC 生成 | 15s | 观看代码生成 + Terminal 输出 |
| 2.4 Forge 测试 | 5s | 查看测试结果和 Forge 输出 |
| 2.5 结论 | 3s | "Vulnerable" 结论 |
| 3. Analysis 页面 | 30s | 浏览四个标签页 |
| 4. AI Chat | 10s | 提一个问题 |
| **合计** | **~2 分钟** | |

### 方案 B — 快速演示（仅阶段二）

| 步骤 | 时长 | 操作内容 |
|------|------|---------|
| 0. 首页 | 5s | 点击"开始审计" |
| 1. 操作台（验证模式） | 10s | 选择验证模式，上传 zip |
| 2.3 PoC 生成 | 15s | 观看代码生成 + Terminal 输出 |
| 2.4 Forge 测试 | 5s | 查看 PASSED 结果 |
| 2.5 结论 | 3s | "Vulnerable" 结论 |
| **合计** | **~40s** | |

---

## 录制技巧

1. **浏览器：** Chrome/Edge 全屏（F11），分辨率 1920x1080
2. **Slither 点击：** 阶段一别忘了点击 Slither Analysis 展示工具弹窗 — 这是关键演示点
3. **Terminal 滚动：** 自动滚动，自然运行即可
4. **语言切换：** 可以用语言按钮切换中/英文展示双语支持
5. **示例数据：** 默认用 `binamon-dos`（Binamon Energy DoS 漏洞），使用预录数据保证演示稳定
6. **节奏：** 流程中已内置延迟，模拟真实运行，无需手动控制速度
