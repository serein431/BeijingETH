import type { Language, PhaseStatus } from "./types";

export type TranslationKey =
  | "nav.projects"
  | "nav.history"
  | "nav.settings"
  | "language.label"
  | "language.english"
  | "language.chinese"
  | "upload.title"
  | "upload.subtitle"
  | "upload.eyebrow"
  | "upload.uploading"
  | "upload.drop"
  | "upload.browse"
  | "upload.hint"
  | "upload.cardLabel"
  | "upload.cardSub"
  | "upload.live"
  | "mode.full.title"
  | "mode.full.kicker"
  | "mode.full.text"
  | "mode.verify.title"
  | "mode.verify.kicker"
  | "mode.verify.text"
  | "report.label"
  | "report.placeholder"
  | "report.helper"
  | "home.metric.modeLabel"
  | "home.metric.modeValue"
  | "home.metric.stackLabel"
  | "home.metric.stackValue"
  | "home.metric.outputLabel"
  | "home.metric.outputValue"
  | "home.workflow.title"
  | "home.workflow.parseTitle"
  | "home.workflow.parseText"
  | "home.workflow.detectTitle"
  | "home.workflow.detectText"
  | "home.workflow.verifyTitle"
  | "home.workflow.verifyText"
  | "home.verifyWorkflow.projectTitle"
  | "home.verifyWorkflow.projectText"
  | "home.verifyWorkflow.reportTitle"
  | "home.verifyWorkflow.reportText"
  | "home.verifyWorkflow.proofTitle"
  | "home.verifyWorkflow.proofText"
  | "home.value.scan"
  | "home.value.llm"
  | "home.value.foundry"
  | "badge.vulnerable"
  | "badge.safe"
  | "stream.title"
  | "stream.processing"
  | "stream.stop"
  | "stream.newAudit"
  | "stream.waiting"
  | "stream.verdictExists"
  | "stream.verificationFailed"
  | "stream.notVulnerable"
  | "flow.pipeline"
  | "flow.verdict"
  | "flow.findings";

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    "nav.projects": "Projects",
    "nav.history": "History",
    "nav.settings": "Settings",
    "language.label": "Language",
    "language.english": "EN",
    "language.chinese": "中",
    "upload.eyebrow": "AI Solidity Audit Demo",
    "upload.title": "Smart Contract Audit",
    "upload.subtitle":
      "Turn a suspicious Solidity finding into executable proof. Upload a project and watch the audit close the loop from structure to verdict.",
    "upload.uploading": "Uploading...",
    "upload.drop": "Drop a .zip Solidity project here",
    "upload.browse": "or click to browse files",
    "upload.hint": "Upload a ZIP package to start the live audit replay",
    "upload.cardLabel": "ZIP Intake",
    "upload.cardSub": "Foundry-ready Solidity project",
    "upload.live": "Live",
    "mode.full.title": "Discover & Verify",
    "mode.full.kicker": "Start from source code",
    "mode.full.text": "Run the full demo loop: structure parsing, vulnerability discovery, PoC generation, Forge logs, and verdict.",
    "mode.verify.title": "Verify Existing Report",
    "mode.verify.kicker": "Start from an audit finding",
    "mode.verify.text": "Paste a finding from another report, upload the project, then jump straight into PoC validation.",
    "report.label": "Finding to verify",
    "report.placeholder": "Paste the vulnerability description or audit report excerpt here...",
    "report.helper": "Demo mode uses this as reviewer context and replays the verification stage.",
    "home.metric.modeLabel": "Mode",
    "home.metric.modeValue": "Replay demo",
    "home.metric.stackLabel": "Stack",
    "home.metric.stackValue": "Slither + LLM + Foundry",
    "home.metric.outputLabel": "Output",
    "home.metric.outputValue": "Evidence pack",
    "home.workflow.title": "Audit loop",
    "home.workflow.parseTitle": "1. Understand",
    "home.workflow.parseText": "Parse contracts, functions, and source snippets so the reviewer sees the project shape first.",
    "home.workflow.detectTitle": "2. Discover",
    "home.workflow.detectText": "Surface suspicious issues with static tooling and semantic LLM review.",
    "home.workflow.verifyTitle": "3. Verify",
    "home.workflow.verifyText": "Generate a Foundry PoC, replay compile/test logs, and produce a final vulnerability verdict.",
    "home.verifyWorkflow.projectTitle": "1. Upload project",
    "home.verifyWorkflow.projectText": "Provide the Solidity codebase so the Agent can import contracts and build a runnable test.",
    "home.verifyWorkflow.reportTitle": "2. Paste finding",
    "home.verifyWorkflow.reportText": "Bring a vulnerability description from another audit report or your own review.",
    "home.verifyWorkflow.proofTitle": "3. Prove it",
    "home.verifyWorkflow.proofText": "Turn the report text into a Foundry PoC and replay compile/test evidence.",
    "home.value.scan": "Fast suspicious finding discovery",
    "home.value.llm": "Natural-language exploit reasoning",
    "home.value.foundry": "Executable proof instead of a static report",
    "badge.vulnerable": "VULNERABLE",
    "badge.safe": "SAFE",
    "stream.title": "Audit Analysis",
    "stream.processing": "Processing...",
    "stream.stop": "Stop",
    "stream.newAudit": "New Audit",
    "stream.waiting": "Waiting for audit to start...",
    "stream.verdictExists": "VULNERABILITY EXISTS",
    "stream.verificationFailed": "VERIFICATION FAILED",
    "stream.notVulnerable": "NOT VULNERABLE",
    "flow.pipeline": "Pipeline",
    "flow.verdict": "Verdict",
    "flow.findings": "Findings",
  },
  zh: {
    "nav.projects": "项目",
    "nav.history": "历史",
    "nav.settings": "设置",
    "language.label": "语言",
    "language.english": "EN",
    "language.chinese": "中",
    "upload.eyebrow": "AI Solidity 审计演示",
    "upload.title": "智能合约审计",
    "upload.subtitle":
      "把可疑漏洞变成可执行证据。上传项目后，实时观看从代码结构到最终结论的审计闭环。",
    "upload.uploading": "上传中...",
    "upload.drop": "将 .zip Solidity 项目拖到这里",
    "upload.browse": "或点击选择文件",
    "upload.hint": "上传 ZIP 包后开始实时审计回放",
    "upload.cardLabel": "ZIP 入口",
    "upload.cardSub": "可运行的 Solidity / Foundry 项目",
    "upload.live": "实时",
    "mode.full.title": "发现并验证",
    "mode.full.kicker": "从源码开始",
    "mode.full.text": "演示完整闭环：结构解析、漏洞发现、PoC 生成、Forge 日志和最终结论。",
    "mode.verify.title": "验证已有报告",
    "mode.verify.kicker": "从审计发现开始",
    "mode.verify.text": "粘贴外部报告里的漏洞描述，上传项目后直接进入 PoC 验证阶段。",
    "report.label": "待验证漏洞",
    "report.placeholder": "在这里粘贴漏洞描述或审计报告片段...",
    "report.helper": "演示模式会把它作为审计上下文，并回放验证阶段。",
    "home.metric.modeLabel": "模式",
    "home.metric.modeValue": "演示回放",
    "home.metric.stackLabel": "工具链",
    "home.metric.stackValue": "Slither + LLM + Foundry",
    "home.metric.outputLabel": "产物",
    "home.metric.outputValue": "证据包",
    "home.workflow.title": "审计闭环",
    "home.workflow.parseTitle": "1. 理解项目",
    "home.workflow.parseText": "解析合约、函数和源码片段，先让审计人员看清项目结构。",
    "home.workflow.detectTitle": "2. 发现漏洞",
    "home.workflow.detectText": "结合静态工具和 LLM 语义审计，提取可疑漏洞线索。",
    "home.workflow.verifyTitle": "3. 验证漏洞",
    "home.workflow.verifyText": "生成 Foundry PoC，回放编译/测试日志，并输出最终漏洞结论。",
    "home.verifyWorkflow.projectTitle": "1. 上传项目",
    "home.verifyWorkflow.projectText": "提供 Solidity 代码库，让 Agent 可以导入合约并构造可运行测试。",
    "home.verifyWorkflow.reportTitle": "2. 粘贴发现",
    "home.verifyWorkflow.reportText": "把外部审计报告或人工审查中的漏洞描述带进来。",
    "home.verifyWorkflow.proofTitle": "3. 证明漏洞",
    "home.verifyWorkflow.proofText": "把报告文本转成 Foundry PoC，并回放编译/测试证据。",
    "home.value.scan": "快速发现可疑告警",
    "home.value.llm": "自然语言漏洞推理",
    "home.value.foundry": "用可执行证据替代静态报告",
    "badge.vulnerable": "存在风险",
    "badge.safe": "安全",
    "stream.title": "审计分析",
    "stream.processing": "处理中...",
    "stream.stop": "停止",
    "stream.newAudit": "重新审计",
    "stream.waiting": "等待开始审计...",
    "stream.verdictExists": "确认存在漏洞",
    "stream.verificationFailed": "验证失败",
    "stream.notVulnerable": "未发现漏洞",
    "flow.pipeline": "流程",
    "flow.verdict": "结论",
    "flow.findings": "发现项",
  },
};

const phaseLabels: Record<Language, Record<string, string>> = {
  en: {
    parse: "Parse Structure",
    slither: "Slither Analysis",
    llm_audit: "LLM Audit",
    poc_gen: "PoC Generation",
    forge_test: "Forge Test",
  },
  zh: {
    parse: "解析结构",
    slither: "Slither 静态分析",
    llm_audit: "AI 审计",
    poc_gen: "生成 PoC",
    forge_test: "Forge 测试",
  },
};

const statusLabels: Record<Language, Record<PhaseStatus, string>> = {
  en: {
    pending: "PENDING",
    running: "RUNNING",
    completed: "DONE",
    skipped: "SKIPPED",
    retrying: "RETRYING",
    error: "ERROR",
  },
  zh: {
    pending: "等待",
    running: "运行中",
    completed: "完成",
    skipped: "跳过",
    retrying: "重试",
    error: "错误",
  },
};

const messageTranslations: Record<string, string> = {
  "Parsing contract structure...": "正在解析合约结构...",
  "Running Slither static analysis...": "正在运行 Slither 静态分析...",
  "Running static analysis...": "正在运行静态分析...",
  "Running LLM security audit...": "正在运行 AI 安全审计...",
  "No vulnerabilities to verify": "没有需要验证的漏洞",
  "No vulnerabilities detected": "未检测到漏洞",
  "Forge not installed, skipping PoC verification": "未安装 Forge，已跳过 PoC 验证",
  "Cannot verify without Forge": "缺少 Forge，无法验证",
  "Loading example project...": "正在加载示例项目...",
  "Example project loaded": "示例项目已加载",
  "Static analysis complete": "静态分析完成",
  "LLM audit complete": "AI 审计完成",
  "Testing complete": "测试完成",
  "All repair rounds exhausted": "所有修复轮次已用完",
  "Verification failed after all repair rounds": "所有修复轮次后仍验证失败",
  "Existing report supplied": "已提供已有报告",
  "Discovery skipped for report verification": "报告验证模式已跳过漏洞发现",
};

export function createTranslator(language: Language) {
  return (key: TranslationKey) => translations[language][key];
}

export function getPhaseLabel(language: Language, phaseName: string, fallback: string) {
  return phaseLabels[language][phaseName] || fallback;
}

export function getStatusLabel(language: Language, status: PhaseStatus) {
  return statusLabels[language][status] || statusLabels[language].pending;
}

export function translatePipelineMessage(language: Language, message: string) {
  if (language === "en" || !message) return message;
  if (messageTranslations[message]) return messageTranslations[message];

  const replacements: Array<[RegExp, string]> = [
    [/^Found (\d+) contracts, (\d+) functions$/, "发现 $1 个合约、$2 个函数"],
    [/^Slither found (\d+) issues$/, "Slither 发现 $1 个问题"],
    [/^Slither skipped: (.+)$/, "Slither 已跳过：$1"],
    [/^Slither error: (.+)$/, "Slither 错误：$1"],
    [/^LLM audit found (\d+) vulnerabilities$/, "AI 审计发现 $1 个漏洞"],
    [/^Generating PoC for: (.+)$/, "正在为以下问题生成 PoC：$1"],
    [/^Generating PoC \(round (\d+)\)\.\.\.$/, "正在生成 PoC（第 $1 轮）..."],
    [/^Running Forge test \(round (\d+)\)\.\.\.$/, "正在运行 Forge 测试（第 $1 轮）..."],
    [/^Test passed \(round (\d+)\)$/, "测试通过（第 $1 轮）"],
    [/^Round (\d+) failed, repairing\.\.\.$/, "第 $1 轮失败，正在修复..."],
    [/^Verification complete: (.+)$/, "验证完成：$1"],
    [/^Replay verdict: (.+)$/, "回放结论：$1"],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(message)) return message.replace(pattern, replacement);
  }
  return message;
}

export function translateStreamText(language: Language, text: string) {
  if (language === "en" || !text) return text;

  return text
    .split("\n")
    .map((line) => {
      if (line.startsWith("> ")) {
        return `> ${translatePipelineMessage(language, line.slice(2))}`;
      }
      const verdictMatch = line.match(/^\*\*Verdict: (.+)\*\*$/);
      if (verdictMatch) {
        return `**结论：${translatePipelineMessage(language, verdictMatch[1])}**`;
      }
      const errorMatch = line.match(/^\*\*Error \[(.+)\]: (.+)\*\*$/);
      if (errorMatch) {
        const phase = getPhaseLabel(language, errorMatch[1], errorMatch[1]);
        return `**错误 [${phase}]：${errorMatch[2]}**`;
      }
      if (line.startsWith("--- Generation Round ")) {
        return line.replace(
          /^--- Generation Round (\d+) ---$/,
          "--- 生成轮次 $1 ---"
        );
      }
      return line;
    })
    .join("\n");
}
