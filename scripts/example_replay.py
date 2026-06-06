from __future__ import annotations

import json
import re
from pathlib import Path

from .config import EXAMPLE_ROOT
from .models import ExampleCase, JobEvent


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def _title_from_readme(text: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return "Example"


def _final_verdict(text: str) -> str | None:
    for line in text.splitlines():
        if "Final verdict:" in line:
            return line.split("Final verdict:", 1)[1].strip().strip("`")
    return None


def list_examples() -> list[ExampleCase]:
    cases = []
    if not EXAMPLE_ROOT.exists():
        return cases
    for path in sorted(EXAMPLE_ROOT.iterdir()):
        if not path.is_dir():
            continue
        readme = _read(path / "README.md") if (path / "README.md").exists() else ""
        cases.append(
            ExampleCase(
                case_id=path.name,
                title=_title_from_readme(readme),
                description=readme,
                final_verdict=_final_verdict(readme),
            )
        )
    return cases


def replay_events(case_id: str) -> tuple[list[JobEvent], str]:
    case_dir = (EXAMPLE_ROOT / case_id).resolve()
    if not case_dir.exists() or EXAMPLE_ROOT.resolve() not in case_dir.parents:
        raise FileNotFoundError(f"Unknown example case: {case_id}")

    events: list[JobEvent] = []
    log_path = case_dir / "generation_repair_log.json"
    if log_path.exists():
        data = json.loads(_read(log_path))
        for round_log in data.get("log", []):
            round_no = round_log.get("round")
            events.append(JobEvent(index=len(events), type="generating_poc", message=f"Replayed generation round {round_no}", data={"round": round_no}))
            error = round_log.get("error", "")
            if error:
                event_type = "test" if "Ran " in error or "Suite result" in error else "compile"
                events.append(JobEvent(index=len(events), type=event_type, message=f"Replayed Foundry output for round {round_no}", data={"output": error}))

    forge_output = _read(case_dir / "forge_run_output.txt") if (case_dir / "forge_run_output.txt").exists() else ""
    verdict = "unknown"
    match = re.search(r"Vulnerability (?:Exists|Exist|not Exist|not Exists):[^\n\r]*", forge_output)
    if match:
        verdict = "exists" if "not Exist" not in match.group(0) and "not Exists" not in match.group(0) else "not_exists"
        events.append(JobEvent(index=len(events), type="verdict", message=match.group(0), data={"verdict": verdict}))
    elif forge_output:
        events.append(JobEvent(index=len(events), type="test", message="Replayed final Foundry output", data={"output": forge_output}))

    return events, verdict

