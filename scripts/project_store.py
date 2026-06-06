from __future__ import annotations

import shutil
import uuid
import zipfile
from pathlib import Path

from .config import EXAMPLE_ROOT, RUNTIME_ROOT
from .models import ProjectSummary


PROJECTS_ROOT = RUNTIME_ROOT / "projects"
UPLOADS_ROOT = RUNTIME_ROOT / "uploads"
IGNORED_PARTS = {".git", "node_modules", "out", "cache", "test", "preprocessed"}
IGNORED_FILES = {"generation_repair_log.json", "forge_run_output.txt", "audit_report.pdf"}


def _safe_project_name(name: str) -> str:
    clean = "".join(ch if ch.isalnum() or ch in "._-" else "-" for ch in name).strip(".-")
    return clean or "project"


def ensure_runtime() -> None:
    PROJECTS_ROOT.mkdir(parents=True, exist_ok=True)
    UPLOADS_ROOT.mkdir(parents=True, exist_ok=True)


def _project_dir(project_id: str) -> Path:
    return PROJECTS_ROOT / project_id


def list_project_files(root: Path) -> list[str]:
    return sorted(
        str(path.relative_to(root))
        for path in root.rglob("*")
        if path.is_file()
        and path.name not in IGNORED_FILES
        and not any(part in IGNORED_PARTS for part in path.relative_to(root).parts)
    )


def create_from_example(case_id: str) -> ProjectSummary:
    ensure_runtime()
    src = (EXAMPLE_ROOT / case_id).resolve()
    if not src.exists() or not src.is_dir() or EXAMPLE_ROOT.resolve() not in src.parents:
        raise FileNotFoundError(f"Unknown example case: {case_id}")

    project_id = f"example-{_safe_project_name(case_id)}-{uuid.uuid4().hex[:8]}"
    dst = _project_dir(project_id)
    dst.mkdir(parents=True, exist_ok=False)
    if (src / "src").exists():
        shutil.copytree(src / "src", dst / "src")
    if (src / "audit_report.md").exists():
        shutil.copy2(src / "audit_report.md", dst / "audit_report.md")
    return ProjectSummary(
        project_id=project_id,
        name=case_id,
        status="ready",
        root=str(dst),
        files=list_project_files(dst),
    )


def create_from_zip(filename: str, content: bytes) -> ProjectSummary:
    ensure_runtime()
    project_id = f"upload-{uuid.uuid4().hex[:12]}"
    dst = _project_dir(project_id)
    dst.mkdir(parents=True, exist_ok=False)

    archive_path = UPLOADS_ROOT / f"{project_id}-{_safe_project_name(filename)}"
    archive_path.write_bytes(content)
    try:
        with zipfile.ZipFile(archive_path) as zf:
            for info in zf.infolist():
                target = (dst / info.filename).resolve()
                if dst.resolve() not in target.parents and target != dst.resolve():
                    raise ValueError(f"Unsafe zip entry: {info.filename}")
            zf.extractall(dst)
    except Exception:
        shutil.rmtree(dst, ignore_errors=True)
        raise

    roots = [p for p in dst.iterdir() if p.is_dir()]
    files_at_root = [p for p in dst.iterdir() if p.is_file()]
    if len(roots) == 1 and not files_at_root:
        root = roots[0]
    else:
        root = dst

    return ProjectSummary(
        project_id=project_id,
        name=Path(filename).stem,
        status="ready",
        root=str(root),
        files=list_project_files(root),
    )


def get_project_root(project_id: str) -> Path:
    ensure_runtime()
    base = _project_dir(project_id).resolve()
    if not base.exists():
        raise FileNotFoundError(f"Unknown project: {project_id}")

    children = [p for p in base.iterdir() if p.is_dir()] if base.is_dir() else []
    files_at_root = [p for p in base.iterdir() if p.is_file()] if base.is_dir() else []
    if len(children) == 1 and not files_at_root:
        return children[0]
    return base
