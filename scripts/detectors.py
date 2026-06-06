from __future__ import annotations

import json
import subprocess
import uuid
from pathlib import Path

from .llm_client import chat, extract_fenced
from .models import DetectResponse, LLMConfig, Vulnerability
from .solidity_parser import parse_structure


def _risk(value: object) -> str:
    text = str(value or "Unknown").strip().lower()
    if text in {"critical", "high"}:
        return "High"
    if text == "medium":
        return "Medium"
    if text == "low":
        return "Low"
    if text in {"informational", "info"}:
        return "Informational"
    return "Unknown"


def run_slither(project_id: str, project_root: Path) -> DetectResponse:
    target = project_root / "src" if (project_root / "src").exists() else project_root
    cmd = ["slither", str(target), "--json", "-"]
    try:
        proc = subprocess.run(cmd, cwd=project_root, capture_output=True, text=True, timeout=120)
    except FileNotFoundError:
        return DetectResponse(project_id=project_id, tool="slither", error="slither is not installed")
    except subprocess.TimeoutExpired:
        return DetectResponse(project_id=project_id, tool="slither", error="slither timed out")

    output = proc.stdout or proc.stderr
    try:
        raw = json.loads(output)
    except Exception:
        raw = {"stdout": proc.stdout, "stderr": proc.stderr, "returncode": proc.returncode}

    vulnerabilities: list[Vulnerability] = []
    detectors = raw.get("results", {}).get("detectors", []) if isinstance(raw, dict) else []
    for item in detectors:
        impact = item.get("impact") or "Unknown"
        elements = item.get("elements") or []
        first = elements[0] if elements else {}
        source_mapping = first.get("source_mapping") or {}
        vulnerabilities.append(
            Vulnerability(
                id=item.get("check") or uuid.uuid4().hex[:8],
                title=item.get("check") or item.get("description", "Slither finding").split("\n", 1)[0],
                description=item.get("description", "").strip(),
                risk=_risk(impact),
                contract=first.get("name"),
                function=first.get("type"),
                location=source_mapping.get("filename_relative"),
                raw_output=item,
            )
        )

    return DetectResponse(project_id=project_id, tool="slither", vulnerabilities=vulnerabilities, raw_output=raw)


def run_llm_audit(project_id: str, project_root: Path, llm: LLMConfig | None) -> DetectResponse:
    if llm is None:
        return DetectResponse(project_id=project_id, tool="llm", error="llm config is required for LLM audit")
    structure = parse_structure(project_id, project_root)
    snippets = []
    for contract in structure.contracts[:8]:
        for fn in contract.functions[:12]:
            snippets.append(f"## {contract.name}.{fn.name} ({fn.file}:{fn.start_line})\n{fn.source}")
    prompt = [
        {
            "role": "system",
            "content": (
                "You are a Solidity security auditor. Return only JSON with a top-level "
                "'vulnerabilities' array. Each item must include title, description, risk "
                "(High/Medium/Low/Informational), contract, function, and location."
            ),
        },
        {"role": "user", "content": "\n\n".join(snippets)[:50000]},
    ]
    try:
        text = chat(llm, prompt)
        raw_json = extract_fenced(text, "json")
        raw = json.loads(raw_json)
    except Exception as exc:
        return DetectResponse(project_id=project_id, tool="llm", error=str(exc))

    vulnerabilities = []
    for item in raw.get("vulnerabilities", []):
        vulnerabilities.append(
            Vulnerability(
                id=item.get("id") or uuid.uuid4().hex[:8],
                title=item.get("title", "LLM finding"),
                description=item.get("description", ""),
                risk=_risk(item.get("risk")),
                contract=item.get("contract"),
                function=item.get("function"),
                location=item.get("location"),
                raw_output=item,
            )
        )
    return DetectResponse(project_id=project_id, tool="llm", vulnerabilities=vulnerabilities, raw_output=raw)
