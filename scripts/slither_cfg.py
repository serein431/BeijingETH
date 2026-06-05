from __future__ import annotations

import os
import re
import subprocess
from collections import defaultdict
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from slither import Slither
from slither.core.variables.state_variable import StateVariable


PRAGMA_RE = re.compile(r"pragma\s+solidity\s+([^;]+);")
VERSION_RE = re.compile(r"\d+\.\d+\.\d+")


def detect_solc_constraint(sol_file: Path) -> str | None:
    text = sol_file.read_text(encoding="utf-8", errors="ignore")
    match = PRAGMA_RE.search(text)
    return match.group(1).strip() if match else None


def _installed_solc_versions() -> list[str]:
    try:
        proc = subprocess.run(["solc-select", "versions"], capture_output=True, text=True, check=False)
    except FileNotFoundError:
        return []
    versions = []
    for line in proc.stdout.splitlines():
        match = VERSION_RE.search(line)
        if match:
            versions.append(match.group(0))
    return sorted(set(versions), key=lambda v: tuple(int(part) for part in v.split(".")))


def _version_tuple(version: str) -> tuple[int, int, int]:
    return tuple(int(part) for part in version.split("."))  # type: ignore[return-value]


def _satisfies(version: str, constraint: str) -> bool:
    vt = _version_tuple(version)
    parts = constraint.replace("||", " ").split()
    comparators = parts or [constraint]
    ok_any = False
    for comp in comparators:
        comp = comp.strip()
        if not comp:
            continue
        if comp.startswith("^"):
            base = comp[1:]
            if not VERSION_RE.fullmatch(base):
                continue
            lower = _version_tuple(base)
            upper = (lower[0] + 1, 0, 0) if lower[0] > 0 else (0, lower[1] + 1, 0)
            if lower <= vt < upper:
                ok_any = True
            else:
                return False
        elif comp.startswith(">="):
            if vt < _version_tuple(comp[2:]):
                return False
            ok_any = True
        elif comp.startswith("<="):
            if vt > _version_tuple(comp[2:]):
                return False
            ok_any = True
        elif comp.startswith(">"):
            if vt <= _version_tuple(comp[1:]):
                return False
            ok_any = True
        elif comp.startswith("<"):
            if vt >= _version_tuple(comp[1:]):
                return False
            ok_any = True
        elif comp.startswith("="):
            if vt != _version_tuple(comp[1:]):
                return False
            ok_any = True
        elif VERSION_RE.fullmatch(comp):
            if vt != _version_tuple(comp):
                return False
            ok_any = True
    return ok_any


def choose_installed_solc_version(constraint: str | None) -> str | None:
    if not constraint:
        return None
    versions = _installed_solc_versions()
    candidates = [version for version in versions if _satisfies(version, constraint)]
    return candidates[-1] if candidates else None


@contextmanager
def solc_version_env(version: str | None):
    previous = os.environ.get("SOLC_VERSION")
    if version:
        os.environ["SOLC_VERSION"] = version
    try:
        yield
    finally:
        if previous is None:
            os.environ.pop("SOLC_VERSION", None)
        else:
            os.environ["SOLC_VERSION"] = previous


def _source_from_mapping(function: Any, slither: Slither) -> str:
    mapping = function.source_mapping
    if not mapping or not mapping.lines:
        return ""
    source_path = mapping.filename.absolute
    source = slither._raw_source_code[source_path].replace("\r\n", "\n").replace("\r", "\n")
    lines = source.split("\n")
    return "\n".join(lines[line_no - 1] for line_no in mapping.lines if 1 <= line_no <= len(lines)).strip()


def _function_entry(function: Any, contract_name: str, slither: Slither, is_modifier: bool = False) -> dict[str, Any]:
    mapping = function.source_mapping
    lines = list(mapping.lines) if mapping and mapping.lines else []
    return {
        "source_code": _source_from_mapping(function, slither),
        "contract": contract_name,
        "function": function.name,
        "full_name": function.full_name,
        "signature": f"{contract_name}.{function.full_name}",
        "lines": lines,
        "file": str(mapping.filename.absolute) if mapping else None,
        "called_by": [],
        "calls": [],
        "is_modifier": is_modifier,
    }


def generate_cfg(sol_file: str | Path, base_dir: str | Path | None = None) -> dict[str, Any]:
    sol_path = Path(sol_file).resolve()
    base = Path(base_dir).resolve() if base_dir else sol_path.parent
    constraint = detect_solc_constraint(sol_path)
    solc_version = choose_installed_solc_version(constraint)

    with solc_version_env(solc_version):
        slither = Slither(str(sol_path))

    call_graph: dict[str, dict[str, Any]] = {}
    public_state_variables: set[str] = set()

    for contract in slither.contracts:
        for variable in contract.state_variables:
            if variable.visibility == "public":
                public_state_variables.add(f"{contract.name}.{variable.name}")

        for function in contract.functions:
            key = f"{contract.name}.{function.full_name}"
            call_graph[key] = _function_entry(function, contract.name, slither)

        for modifier in contract.modifiers:
            key = f"{contract.name}.{modifier.full_name}"
            call_graph[key] = _function_entry(modifier, contract.name, slither, is_modifier=True)

    edges: dict[str, set[str]] = defaultdict(set)
    reverse_edges: dict[str, set[str]] = defaultdict(set)
    for contract in slither.contracts:
        for function in contract.functions:
            caller = f"{contract.name}.{function.full_name}"
            for internal_call in function.internal_calls:
                target = getattr(internal_call, "function", internal_call)
                target_contract = getattr(target, "contract", None)
                target_contract_name = getattr(target_contract, "name", contract.name)
                target_name = getattr(target, "full_name", None)
                if not target_name:
                    continue
                callee = f"{target_contract_name}.{target_name}"
                if callee in call_graph:
                    edges[caller].add(callee)
                    reverse_edges[callee].add(caller)

            for high_level_call in function.high_level_calls:
                if isinstance(high_level_call[1].function, StateVariable):
                    continue
                target_contract = high_level_call[0].name
                target_name = high_level_call[1].function.full_name
                callee = f"{target_contract}.{target_name}"
                if callee in call_graph:
                    edges[caller].add(callee)
                    reverse_edges[callee].add(caller)

    for key, entry in call_graph.items():
        entry["calls"] = sorted(edges.get(key, set()))
        entry["called_by"] = sorted(reverse_edges.get(key, set()))

    return {
        "solc_constraint": constraint,
        "solc_version": solc_version,
        "base_dir": str(base),
        "contracts": [
            {
                "name": contract.name,
                "functions": [function.name for function in contract.functions],
            }
            for contract in slither.contracts
        ],
        "public_state_variables": sorted(public_state_variables),
        "call_graph": call_graph,
    }

