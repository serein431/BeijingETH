from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


def forge_available() -> bool:
    return shutil.which("forge") is not None


def prepare_run_dir(project_root: Path, run_dir: Path) -> None:
    if run_dir.exists():
        shutil.rmtree(run_dir)
    ignore = shutil.ignore_patterns(
        ".git",
        "node_modules",
        "out",
        "cache",
        "test",
        "preprocessed",
        "generation_repair_log.json",
        "forge_run_output.txt",
        "audit_report.pdf",
    )
    shutil.copytree(project_root, run_dir, ignore=ignore)
    (run_dir / "test").mkdir(exist_ok=True)


def run_forge_test(project_dir: Path, timeout: int = 180) -> str:
    proc = subprocess.run(
        ["forge", "test", "-vvvv"],
        cwd=project_dir,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    return (proc.stdout or "") + (proc.stderr or "")


def classify_forge_output(output: str) -> tuple[bool, str]:
    if "Compiler run successful" in output and "Suite result: ok" in output:
        if "Vulnerability not Exist" in output or "Vulnerability not Exists" in output:
            return True, "not_exists"
        if "Vulnerability Exists" in output or "Vulnerability Exist" in output:
            return True, "exists"
        return True, "unknown"
    return False, "failed"
