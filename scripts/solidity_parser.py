from __future__ import annotations

import re
from pathlib import Path

from .models import ContractInfo, FunctionInfo, ProjectStructure


CONTRACT_RE = re.compile(r"\b(?:contract|library|interface)\s+([A-Za-z_][A-Za-z0-9_]*)")
FUNCTION_RE = re.compile(r"\b(function|constructor|modifier)\s*([A-Za-z_][A-Za-z0-9_]*)?\s*\([^;{]*[;{]", re.S)


def solidity_files(project_root: Path) -> list[Path]:
    ignored = {"node_modules", "out", "cache", "lib", "test", "script", "scripts", "preprocessed"}
    preferred_roots = [project_root / "src", project_root / "contracts"]
    files: list[Path] = []
    for root in preferred_roots:
        if root.exists():
            files.extend(path for path in root.rglob("*.sol") if not any(part in ignored for part in path.relative_to(project_root).parts))
    if not files:
        files = [
            path
            for path in project_root.rglob("*.sol")
            if not any(part in ignored for part in path.relative_to(project_root).parts)
        ]
    return sorted(set(files))


def _line_for_offset(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def _matching_brace(text: str, open_idx: int) -> int:
    depth = 0
    in_string: str | None = None
    in_line_comment = False
    in_block_comment = False
    i = open_idx
    while i < len(text):
        ch = text[i]
        nxt = text[i + 1] if i + 1 < len(text) else ""
        if in_line_comment:
            if ch == "\n":
                in_line_comment = False
            i += 1
            continue
        if in_block_comment:
            if ch == "*" and nxt == "/":
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue
        if in_string:
            if ch == "\\":
                i += 2
                continue
            if ch == in_string:
                in_string = None
            i += 1
            continue
        if ch == "/" and nxt == "/":
            in_line_comment = True
            i += 2
            continue
        if ch == "/" and nxt == "*":
            in_block_comment = True
            i += 2
            continue
        if ch in {"'", '"'}:
            in_string = ch
            i += 1
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def _mask_comments(text: str) -> str:
    chars = list(text)
    i = 0
    in_string: str | None = None
    while i < len(chars):
        ch = chars[i]
        nxt = chars[i + 1] if i + 1 < len(chars) else ""
        if in_string:
            if ch == "\\":
                i += 2
                continue
            if ch == in_string:
                in_string = None
            i += 1
            continue
        if ch in {"'", '"'}:
            in_string = ch
            i += 1
            continue
        if ch == "/" and nxt == "/":
            chars[i] = chars[i + 1] = " "
            i += 2
            while i < len(chars) and chars[i] != "\n":
                chars[i] = " "
                i += 1
            continue
        if ch == "/" and nxt == "*":
            chars[i] = chars[i + 1] = " "
            i += 2
            while i < len(chars) - 1:
                if chars[i] == "*" and chars[i + 1] == "/":
                    chars[i] = chars[i + 1] = " "
                    i += 2
                    break
                if chars[i] != "\n":
                    chars[i] = " "
                i += 1
            continue
        i += 1
    return "".join(chars)


def _contract_spans(clean_text: str) -> list[tuple[int, int, str]]:
    spans: list[tuple[int, int, str]] = []
    for match in CONTRACT_RE.finditer(clean_text):
        body_start = clean_text.find("{", match.end())
        if body_start == -1:
            continue
        body_end = _matching_brace(clean_text, body_start)
        if body_end == -1:
            body_end = len(clean_text) - 1
        spans.append((match.start(), body_end, match.group(1)))
    return spans


def _current_contract(spans: list[tuple[int, int, str]], offset: int) -> str | None:
    for start, end, name in spans:
        if start <= offset <= end:
            return name
    return None


def _parse_file(project_root: Path, path: Path) -> list[FunctionInfo]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    clean_text = _mask_comments(text)
    spans = _contract_spans(clean_text)
    rel = str(path.relative_to(project_root))
    functions: list[FunctionInfo] = []
    for match in FUNCTION_RE.finditer(clean_text):
        kind = match.group(1)
        name = match.group(2) or kind
        header_end = match.end()
        body_start = clean_text.find("{", match.start(), header_end)
        if body_start == -1:
            body_end = clean_text.find(";", match.start(), header_end)
        else:
            body_end = _matching_brace(clean_text, body_start)
        if body_end == -1:
            body_end = header_end
        source = text[match.start() : body_end + 1].strip()
        signature = source.split("{", 1)[0].split(";", 1)[0].strip()
        functions.append(
            FunctionInfo(
                name=name,
                signature=" ".join(signature.split()),
                contract=_current_contract(spans, match.start()),
                file=rel,
                start_line=_line_for_offset(text, match.start()),
                end_line=_line_for_offset(text, body_end),
                source=source,
            )
        )
    return functions


def parse_structure(project_id: str, project_root: Path) -> ProjectStructure:
    warnings: list[str] = []
    all_functions: list[FunctionInfo] = []
    files = solidity_files(project_root)
    for path in files:
        try:
            all_functions.extend(_parse_file(project_root, path))
        except Exception as exc:
            warnings.append(f"Failed to parse {path.name}: {type(exc).__name__}: {exc}")

    contracts_by_key: dict[tuple[str, str], ContractInfo] = {}
    for fn in all_functions:
        contract_name = fn.contract or Path(fn.file).stem
        key = (fn.file, contract_name)
        contracts_by_key.setdefault(key, ContractInfo(name=contract_name, file=fn.file, functions=[])).functions.append(fn)

    return ProjectStructure(
        project_id=project_id,
        contracts=list(contracts_by_key.values()),
        files=[str(path.relative_to(project_root)) for path in files],
        parser="regex",
        warnings=warnings,
    )
