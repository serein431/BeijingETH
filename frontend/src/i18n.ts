import type { Language, PhaseStatus } from "./types";

export type TranslationKey =
  | "nav.projects"
  | "nav.analysis"
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
  | "home.enter"
  | "home.viewAnalysis"
  | "analysis.open"
  | "analysis.kicker"
  | "analysis.description"
  | "mode.discovery.title"
  | "mode.discovery.kicker"
  | "mode.discovery.text"
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
  | "home.workflow.reportTitle"
  | "home.workflow.reportText"
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
  | "home.value.report"
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
  | "stream.discoveryComplete"
  | "flow.pipeline"
  | "flow.verdict"
  | "flow.findings"
  | "flow.testResult"
  | "flow.pocGenerated"
  | "flow.linesOfFoundryTest";

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    "nav.projects": "Projects",
    "nav.analysis": "Structure",
    "nav.history": "History",
    "nav.settings": "Settings",
    "language.label": "Language",
    "language.english": "EN",
    "language.chinese": "中",
    "upload.eyebrow": "AI Agent x Blockchain Security",
    "upload.title": "AI Agent Smart Contract Automated Audit and Verification",
    "upload.subtitle":
      "Combine AI Agent workflows with blockchain security analysis to automate vulnerability discovery and verification. Built for developers and auditors, it connects modular audit tools and turns natural-language vulnerability descriptions into executable PoCs for real execution validation.",
    "upload.uploading": "Uploading...",
    "upload.drop": "Drop a .zip Solidity project here",
    "upload.browse": "or click to browse files",
    "upload.hint": "Upload a ZIP package to start project analysis",
    "upload.cardLabel": "Upload Project",
    "upload.cardSub": "Supports runnable Solidity / Foundry projects (ZIP)",
    "upload.live": "Live",
    "home.enter": "Start Audit",
    "home.viewAnalysis": "Open Structure",
    "analysis.open": "View project functions and call graph",
    "analysis.kicker": "Code intelligence",
    "analysis.description": "Inspect parsed contracts, function source, and the generated control-flow graph for the uploaded project.",
    "mode.discovery.title": "Automatic Vulnerability Discovery",
    "mode.discovery.kicker": "Start from source code",
    "mode.discovery.text": "For complete Solidity / Foundry projects, automatically parse code structure, call modular vulnerability discovery tools, and output an audit report.",
    "mode.verify.title": "Verify Existing Vulnerability Conclusions",
    "mode.verify.kicker": "Start from a report",
    "mode.verify.text": "Input a natural-language vulnerability description. The AI Agent generates an executable PoC and runs it in Foundry to solve the hard-to-verify report problem.",
    "report.label": "Finding to verify",
    "report.placeholder": "Paste the vulnerability description or audit report excerpt here...",
    "report.helper": "This finding is used as reviewer context before the verification stage starts.",
    "home.metric.modeLabel": "Mode",
    "home.metric.modeValue": "Smart audit workspace",
    "home.metric.stackLabel": "Capability",
    "home.metric.stackValue": "Discovery + Verification dual Agent",
    "home.metric.outputLabel": "Output",
    "home.metric.outputValue": "Audit report + PoC + verdict",
    "home.workflow.title": "Automated Loop from Discovery to Verification",
    "home.workflow.parseTitle": "1. Understand Project",
    "home.workflow.parseText": "Automatically parse project structure and key functions so developers and auditors can quickly understand the code.",
    "home.workflow.detectTitle": "2. Discover Vulnerabilities",
    "home.workflow.detectText": "Modularly connect static analysis tools and LLM Agents to discover potential vulnerabilities and generate structured security conclusions.",
    "home.workflow.reportTitle": "3. Report",
    "home.workflow.reportText": "Show risk level, description, and related contract/function without starting PoC verification.",
    "home.workflow.verifyTitle": "3. Verify Vulnerabilities",
    "home.workflow.verifyText": "Turn natural-language vulnerability descriptions into Foundry PoCs, execute compile and test validation, then output executable evidence and exploit conclusions.",
    "home.verifyWorkflow.projectTitle": "1. Upload project",
    "home.verifyWorkflow.projectText": "Provide the Solidity codebase so the Agent can import contracts and build a runnable test.",
    "home.verifyWorkflow.reportTitle": "2. Paste finding",
    "home.verifyWorkflow.reportText": "Bring a vulnerability description from another audit report or your own review.",
    "home.verifyWorkflow.proofTitle": "3. Prove it",
    "home.verifyWorkflow.proofText": "Turn the report text into a Foundry PoC and replay compile/test evidence.",
    "home.value.scan": "Open-source framework with flexible audit-tool adapters",
    "home.value.llm": "AI Agent driven vulnerability discovery and verification",
    "home.value.foundry": "Natural-language descriptions generate executable PoCs",
    "home.value.report": "Clean report output for manual review",
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
    "stream.discoveryComplete": "DISCOVERY COMPLETE",
    "flow.pipeline": "Pipeline",
    "flow.verdict": "Verdict",
    "flow.findings": "Findings",
    "flow.testResult": "Test Result",
    "flow.pocGenerated": "PoC Generated",
    "flow.linesOfFoundryTest": "lines of Foundry test code",
  },
  zh: {
    "nav.projects": "项目",
    "nav.analysis": "结构分析",
    "nav.history": "历史",
    "nav.settings": "设置",
    "language.label": "语言",
    "language.english": "EN",
    "language.chinese": "中",
    "upload.eyebrow": "AI Agent × Blockchain Security",
    "upload.title": "AI Agent 智能合约自动审计与验证",
    "upload.subtitle":
      "结合 AI Agent 与区块链安全分析，支持漏洞发现与漏洞验证双流程自动化。面向开发者与审计人员，模块化接入审计工具，并将自然语言漏洞描述自动转化为可执行 PoC，在真实链上环境验证",
    "upload.uploading": "上传中...",
    "upload.drop": "将 .zip Solidity 项目拖到这里",
    "upload.browse": "或点击选择文件",
    "upload.hint": "上传 ZIP 包后开始项目分析",
    "upload.cardLabel": "上传项目",
    "upload.cardSub": "支持可运行的 Solidity / Foundry 项目（ZIP）",
    "upload.live": "实时",
    "home.enter": "开始审计",
    "home.viewAnalysis": "打开结构",
    "analysis.open": "查看项目函数与调用图",
    "analysis.kicker": "代码理解",
    "analysis.description": "查看上传项目解析出的合约列表、函数源码和控制流图，承接“理解项目”这一步。",
    "mode.discovery.title": "自动发现漏洞",
    "mode.discovery.kicker": "从源码开始",
    "mode.discovery.text": "面向完整 Solidity / Foundry 项目，自动解析代码结构，模块化调用漏洞挖掘工具，输出审计报告；",
    "mode.verify.title": "验证已有漏洞结论",
    "mode.verify.kicker": "从报告开始",
    "mode.verify.text": "输入自然语言漏洞描述，AI Agent 自动生成可执行 PoC，并在 Foundry 环境中运行验证，解决“有结论、难验证”的核心痛点。",
    "report.label": "待验证漏洞",
    "report.placeholder": "在这里粘贴漏洞描述或审计报告片段...",
    "report.helper": "系统会把它作为审计上下文，并进入验证阶段。",
    "home.metric.modeLabel": "模式",
    "home.metric.modeValue": "智能审计工作台",
    "home.metric.stackLabel": "能力",
    "home.metric.stackValue": "漏洞发现 + 漏洞验证双 Agent",
    "home.metric.outputLabel": "产物",
    "home.metric.outputValue": "审计报告 + 可执行 PoC + 验证结论",
    "home.workflow.title": "漏洞发现到验证的自动化闭环",
    "home.workflow.parseTitle": "1. 理解项目",
    "home.workflow.parseText": "自动解析项目结构与关键函数，帮助开发者和审计人员快速建立代码理解。",
    "home.workflow.detectTitle": "2. 发现漏洞",
    "home.workflow.detectText": "模块化接入静态分析工具与 LLM Agent，自动挖掘潜在漏洞并生成结构化安全结论。",
    "home.workflow.reportTitle": "3. 输出报告",
    "home.workflow.reportText": "展示风险等级、漏洞描述和相关合约/函数，不自动进入 PoC 验证。",
    "home.workflow.verifyTitle": "3. 验证漏洞",
    "home.workflow.verifyText": "将自然语言漏洞描述自动转化为 Foundry PoC，执行编译与测试验证，输出最终可执行证据与利用结论。",
    "home.verifyWorkflow.projectTitle": "1. 上传项目",
    "home.verifyWorkflow.projectText": "提供 Solidity 代码库，让 Agent 可以导入合约并构造可运行测试。",
    "home.verifyWorkflow.reportTitle": "2. 粘贴发现",
    "home.verifyWorkflow.reportText": "把外部审计报告或人工审查中的漏洞描述带进来。",
    "home.verifyWorkflow.proofTitle": "3. 证明漏洞",
    "home.verifyWorkflow.proofText": "把报告文本转成 Foundry PoC，并回放编译/测试证据。",
    "home.value.scan": "开源框架，灵活接入审计工具",
    "home.value.llm": "AI Agent 驱动漏洞发现与验证",
    "home.value.foundry": "自然语言描述自动生成可执行 PoC",
    "home.value.report": "输出适合人工复核的漏洞列表",
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
    "stream.discoveryComplete": "发现完成",
    "flow.pipeline": "流程",
    "flow.verdict": "结论",
    "flow.findings": "发现项",
    "flow.testResult": "测试结果",
    "flow.pocGenerated": "PoC 已生成",
    "flow.linesOfFoundryTest": "行 Foundry 测试代码",
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
  "Loading uploaded project...": "正在加载上传项目...",
  "Uploaded project loaded": "上传项目已加载",
  "Static analysis complete": "静态分析完成",
  "LLM audit complete": "AI 审计完成",
  "Discovery complete": "漏洞发现完成",
  "Verification not requested": "未请求漏洞验证",
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
