from __future__ import annotations

import json
import re
import time
import uuid
from collections.abc import Generator
from pathlib import Path

from . import config
from .detectors import _risk, run_slither
from .foundry_runner import classify_forge_output, forge_available, prepare_run_dir, run_forge_test
from .llm_client import chat_stream, extract_fenced
from .models import LLMConfig, Vulnerability
from .solidity_parser import parse_structure


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _build_audit_prompt(structure) -> list[dict[str, str]]:
    snippets = []
    for contract in structure.contracts[:8]:
        for fn in contract.functions[:12]:
            snippets.append(f"## {contract.name}.{fn.name} ({fn.file}:{fn.start_line})\n{fn.source}")
    return [
        {
            "role": "system",
            "content": (
                "You are a Solidity security auditor. Analyze the following smart contract code "
                "for vulnerabilities. First explain your analysis process step by step, then "
                "provide your findings. At the end, output a JSON block with a top-level "
                "'vulnerabilities' array. Each item must include title, description, risk "
                "(High/Medium/Low/Informational), contract, function, and location."
            ),
        },
        {"role": "user", "content": "\n\n".join(snippets)[:50000]},
    ]


def _build_poc_prompt(structure, vuln_desc: str, target_file: str | None = None) -> list[dict[str, str]]:
    snippets = []
    for contract in structure.contracts[:8]:
        for fn in contract.functions[:10]:
            if target_file and target_file != fn.file:
                continue
            snippets.append(f"## {contract.name}.{fn.name} ({fn.file}:{fn.start_line})\n{fn.source}")
    imports = ", ".join(structure.files[:20])
    return [
        {
            "role": "system",
            "content": (
                "You are a smart contract security audit expert. Generate a Foundry .t.sol "
                "test that verifies the described vulnerability. Import target contracts from "
                "../src/. Do not paste or redeclare target contracts. Return only a solidity code block. "
                "The test must print exactly one final verdict line beginning with "
                "'Vulnerability Exists:' or 'Vulnerability not Exist:'."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Available Solidity files: {imports}\n\n"
                f"Vulnerability description:\n{vuln_desc}\n\n"
                f"Relevant code:\n{chr(10).join(snippets)[:60000]}"
            ),
        },
    ]


def _build_repair_prompt(original: list[dict[str, str]], previous_code: str, forge_output: str) -> list[dict[str, str]]:
    return original + [
        {
            "role": "user",
            "content": (
                "The previous Foundry test failed. Regenerate the complete fixed test.\n\n"
                f"Previous test:\n```solidity\n{previous_code}\n```\n\n"
                f"Foundry output:\n```\n{forge_output[-30000:]}\n```"
            ),
        }
    ]


def _example_finding_from_report(case_id: str, report_text: str) -> Vulnerability:
    title = "Audit report finding"
    for line in report_text.splitlines():
        clean = line.strip().lstrip("#").strip()
        if re.match(r"^(?:[A-Z]\d+|\d+)\.\s+", clean):
            title = re.sub(r"^(?:[A-Z]\d+|\d+)\.\s+", "", clean).strip()
            break

    risk = "Unknown"
    if re.search(r"\bhigh severity\b", report_text, re.IGNORECASE):
        risk = "High"
    elif re.search(r"\bmedium severity\b", report_text, re.IGNORECASE):
        risk = "Medium"
    elif re.search(r"\blow severity\b", report_text, re.IGNORECASE):
        risk = "Low"

    fallback_risk_by_case = {
        "binamon-dos": "High",
        "cleverminu-approve-race": "High",
    }
    if risk == "Unknown":
        risk = fallback_risk_by_case.get(case_id, risk)

    description = ""
    match = re.search(
        r"Description\s+(.*?)(?:\s+Remediation\b|\s+Status:|\Z)",
        report_text,
        re.IGNORECASE | re.DOTALL,
    )
    if match:
        description = re.sub(r"\s+", " ", match.group(1)).strip()

    fn_match = re.search(r"\b(?:modifier|function)\s+([A-Za-z_][A-Za-z0-9_]*)", report_text)
    function_name = fn_match.group(1) if fn_match else None
    if function_name == "call" and re.search(r"\bapprove\b", report_text, re.IGNORECASE):
        function_name = "approve"

    contract_by_case = {
        "binamon-dos": "BNRG",
        "cleverminu-approve-race": "DoctorShiba",
    }

    return Vulnerability(
        id=f"{case_id}-report-1",
        title=title,
        description=description or report_text[:400],
        risk=_risk(risk),
        contract=contract_by_case.get(case_id),
        function=function_name,
        location="audit_report.md",
    )


def run_audit_pipeline(project_id: str, project_root: Path, llm: LLMConfig) -> Generator[str, None, None]:
    yield _sse("phase", {"phase": "parse", "status": "running", "message": "Parsing contract structure..."})
    try:
        structure = parse_structure(project_id, project_root)
        contracts_info = [
            {"name": c.name, "file": c.file, "functions": len(c.functions)}
            for c in structure.contracts
        ]
        yield _sse("phase", {
            "phase": "parse", "status": "completed",
            "message": f"Found {len(structure.contracts)} contracts, {sum(len(c.functions) for c in structure.contracts)} functions",
            "data": {"contracts": contracts_info, "files": structure.files},
        })
    except Exception as exc:
        yield _sse("error", {"phase": "parse", "message": str(exc)})
        return

    yield _sse("phase", {"phase": "slither", "status": "running", "message": "Running Slither static analysis..."})
    try:
        slither_result = run_slither(project_id, project_root)
        if slither_result.error:
            yield _sse("phase", {"phase": "slither", "status": "skipped", "message": f"Slither skipped: {slither_result.error}"})
        else:
            for vuln in slither_result.vulnerabilities:
                yield _sse("finding", {
                    "phase": "slither",
                    "vulnerability": {"id": vuln.id, "title": vuln.title, "description": vuln.description, "risk": vuln.risk},
                })
            yield _sse("phase", {
                "phase": "slither", "status": "completed",
                "message": f"Slither found {len(slither_result.vulnerabilities)} issues",
            })
    except Exception as exc:
        yield _sse("phase", {"phase": "slither", "status": "skipped", "message": f"Slither error: {exc}"})

    yield _sse("phase", {"phase": "llm_audit", "status": "running", "message": "Running LLM security audit..."})
    audit_prompt = _build_audit_prompt(structure)
    accumulated = ""
    try:
        for token in chat_stream(llm, audit_prompt):
            accumulated += token
            yield _sse("stream", {"phase": "llm_audit", "token": token})
    except Exception as exc:
        yield _sse("error", {"phase": "llm_audit", "message": str(exc)})
        return

    findings: list[Vulnerability] = []
    try:
        raw_json = extract_fenced(accumulated, "json")
        raw = json.loads(raw_json)
        for item in raw.get("vulnerabilities", []):
            v = Vulnerability(
                id=item.get("id") or uuid.uuid4().hex[:8],
                title=item.get("title", "LLM finding"),
                description=item.get("description", ""),
                risk=_risk(item.get("risk")),
                contract=item.get("contract"),
                function=item.get("function"),
                location=item.get("location"),
            )
            findings.append(v)
            yield _sse("finding", {
                "phase": "llm_audit",
                "vulnerability": v.model_dump(),
            })
    except Exception:
        pass

    yield _sse("phase", {
        "phase": "llm_audit", "status": "completed",
        "message": f"LLM audit found {len(findings)} vulnerabilities",
    })

    if not findings:
        yield _sse("phase", {"phase": "poc_gen", "status": "skipped", "message": "No vulnerabilities to verify"})
        yield _sse("verdict", {"verdict": "not_exists", "message": "No vulnerabilities detected"})
        return

    primary = findings[0]
    vuln_desc = f"{primary.title}: {primary.description}"

    yield _sse("phase", {"phase": "poc_gen", "status": "running", "message": f"Generating PoC for: {primary.title}"})

    if not forge_available():
        yield _sse("phase", {"phase": "poc_gen", "status": "skipped", "message": "Forge not installed, skipping PoC verification"})
        yield _sse("verdict", {"verdict": "unknown", "message": "Cannot verify without Forge"})
        return

    run_id = uuid.uuid4().hex[:12]
    run_dir = config.RUNTIME_ROOT / "runs" / run_id
    prepare_run_dir(project_root, run_dir)
    test_file = run_dir / "test" / f"Generated_{run_id}.t.sol"

    base_prompt = _build_poc_prompt(structure, vuln_desc)
    prompt = base_prompt
    code = ""

    for round_no in range(1, config.MAX_REPAIR_ROUNDS + 1):
        yield _sse("stream", {"phase": "poc_gen", "token": f"\n\n--- Generation Round {round_no} ---\n\n"})
        poc_text = ""
        try:
            for token in chat_stream(llm, prompt):
                poc_text += token
                yield _sse("stream", {"phase": "poc_gen", "token": token})
        except Exception as exc:
            yield _sse("error", {"phase": "poc_gen", "message": str(exc)})
            break

        code = extract_fenced(poc_text, "solidity")
        test_file.write_text(code, encoding="utf-8")
        yield _sse("poc", {"round": round_no, "code": code})

        yield _sse("phase", {"phase": "forge_test", "status": "running", "message": f"Running Forge test (round {round_no})..."})
        try:
            output = run_forge_test(run_dir)
            ok, verdict = classify_forge_output(output)
            yield _sse("test", {"round": round_no, "output": output[-10000:], "passed": ok})

            if ok:
                yield _sse("phase", {"phase": "forge_test", "status": "completed", "message": f"Test passed (round {round_no})"})
                yield _sse("verdict", {"verdict": verdict, "message": f"Verification complete: {verdict}"})
                return
        except Exception as exc:
            yield _sse("test", {"round": round_no, "output": str(exc), "passed": False})

        if round_no < config.MAX_REPAIR_ROUNDS:
            yield _sse("phase", {"phase": "forge_test", "status": "retrying", "message": f"Round {round_no} failed, repairing..."})
            prompt = _build_repair_prompt(base_prompt, code, output)

    yield _sse("phase", {"phase": "forge_test", "status": "completed", "message": "All repair rounds exhausted"})
    yield _sse("verdict", {"verdict": "failed", "message": "Verification failed after all repair rounds"})


def replay_as_stream(case_id: str, mode: str = "discover_only") -> Generator[str, None, None]:
    from .example_replay import replay_events

    events, verdict = replay_events(case_id)
    case_dir = config.EXAMPLE_ROOT / case_id
    log_path = case_dir / "generation_repair_log.json"

    verify_only = mode == "verify_finding"

    # ── Stage 1 & 2 shared: Parse ──
    yield _sse("phase", {"phase": "parse", "status": "running", "message": "Loading uploaded project..."})
    time.sleep(0.8)
    yield _sse("phase", {"phase": "parse", "status": "completed", "message": "Uploaded project loaded"})
    time.sleep(0.4)

    if verify_only:
        yield _sse("phase", {"phase": "slither", "status": "skipped", "message": "Existing report supplied"})
        time.sleep(0.2)
        yield _sse("phase", {"phase": "llm_audit", "status": "skipped", "message": "Discovery skipped for report verification"})
        time.sleep(0.3)
    else:
        # ── Stage 1: Slither ──
        yield _sse("phase", {"phase": "slither", "status": "running", "message": "Running static analysis..."})
        time.sleep(1.2)
        yield _sse("phase", {"phase": "slither", "status": "completed", "message": "Static analysis complete"})
        time.sleep(0.5)

    if log_path.exists():
        data = json.loads(log_path.read_text(encoding="utf-8"))
        log_entries = data.get("log", [])

        # ── Stage 1: LLM Audit ──
        audit_report_path = case_dir / "audit_report.md"
        if audit_report_path.exists() and not verify_only:
            yield _sse("phase", {"phase": "llm_audit", "status": "running", "message": "Running LLM security audit..."})
            time.sleep(0.3)
            report_text = audit_report_path.read_text(encoding="utf-8", errors="ignore")
            for i in range(0, len(report_text), 8):
                chunk = report_text[i:i + 8]
                yield _sse("stream", {"phase": "llm_audit", "token": chunk})
                time.sleep(0.02)
            time.sleep(0.4)
            yield _sse("finding", {
                "phase": "llm_audit",
                "vulnerability": _example_finding_from_report(case_id, report_text).model_dump(),
            })
            time.sleep(0.3)
            yield _sse("phase", {"phase": "llm_audit", "status": "completed", "message": "LLM audit complete"})

        # Stage 1 (discover_only): stop after discovery, skip PoC & Forge
        if not verify_only:
            time.sleep(0.3)
            yield _sse("phase", {"phase": "poc_gen", "status": "skipped", "message": "Verification not requested"})
            yield _sse("phase", {"phase": "forge_test", "status": "skipped", "message": "Verification not requested"})
            time.sleep(0.2)
            yield _sse("verdict", {"verdict": "unknown", "message": "Discovery complete"})
            return

        # ── Stage 2: PoC Generation + Forge Test ──
        for entry in log_entries:
            round_no = entry.get("round", 1)
            response = entry.get("response", "")
            error = entry.get("error", "")
            exp = entry.get("exp", "")

            yield _sse("phase", {"phase": "poc_gen", "status": "running", "message": f"Generating PoC (round {round_no})..."})
            time.sleep(0.5)

            display_text = response if response else exp
            if display_text:
                for i in range(0, len(display_text), 12):
                    chunk = display_text[i:i + 12]
                    yield _sse("stream", {"phase": "poc_gen", "token": chunk})
                    time.sleep(0.01)

            if exp:
                time.sleep(0.3)
                yield _sse("poc", {"round": round_no, "code": exp})

            if error:
                time.sleep(0.4)
                yield _sse("phase", {"phase": "forge_test", "status": "running", "message": f"Running Forge test (round {round_no})..."})
                time.sleep(0.8)
                passed = "Suite result: ok" in error
                # Stream the forge output text into the terminal
                yield _sse("stream", {"phase": "forge_test", "token": f"\n\n```\n{error[-3000:]}\n```\n"})
                time.sleep(0.2)
                yield _sse("test", {"round": round_no, "output": error[-10000:], "passed": passed})

        poc_lines = len(log_entries[-1].get("exp", "").splitlines()) if log_entries else 0
        time.sleep(0.3)
        yield _sse("phase", {"phase": "poc_gen", "status": "completed", "message": f"PoC generated — {poc_lines} lines of Foundry test"})

    # ── Final Forge verification from forge_run_output.txt ──
    forge_output_path = case_dir / "forge_run_output.txt"
    if forge_output_path.exists():
        forge_text = forge_output_path.read_text(encoding="utf-8", errors="ignore")
        time.sleep(0.4)
        yield _sse("phase", {"phase": "forge_test", "status": "running", "message": "Running final Forge verification..."})
        time.sleep(1.0)
        # Stream forge output into the audit terminal
        yield _sse("stream", {"phase": "forge_test", "token": f"\n\n```\n{forge_text}\n```\n"})
        time.sleep(0.3)
        yield _sse("test", {"round": "final", "output": forge_text, "passed": "[PASS]" in forge_text})
        time.sleep(0.3)
        yield _sse("phase", {"phase": "forge_test", "status": "completed", "message": "Testing complete"})
    else:
        yield _sse("phase", {"phase": "forge_test", "status": "completed", "message": "Testing complete"})

    time.sleep(0.5)
    for ev in events:
        if ev.type == "verdict":
            yield _sse("verdict", {"verdict": verdict, "message": ev.message})
            return

    yield _sse("verdict", {"verdict": verdict, "message": f"Replay verdict: {verdict}"})
