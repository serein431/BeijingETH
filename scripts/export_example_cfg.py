from __future__ import annotations

import json
from pathlib import Path

from .slither_cfg import generate_cfg


CASES = {
    "binamon-dos": "src/BNRG.sol",
    "cleverminu-approve-race": "src/DoctorShiba.sol",
}


def _relative_files(cfg: dict, case_root: Path) -> dict:
    result = dict(cfg)
    result["base_dir"] = str(Path(result["base_dir"]).resolve().relative_to(case_root.resolve()))
    for entry in result["call_graph"].values():
        if entry.get("file"):
            entry["file"] = str(Path(entry["file"]).resolve().relative_to(case_root.resolve()))
    return result


def _function_sources(cfg: dict) -> dict:
    sources = {}
    for key, entry in cfg["call_graph"].items():
        sources[key] = {
            "contract": entry["contract"],
            "function": entry["function"],
            "full_name": entry["full_name"],
            "signature": entry["signature"],
            "file": entry["file"],
            "lines": entry["lines"],
            "source_code": entry["source_code"],
        }
    return sources


def main() -> None:
    for case_id, source_file in CASES.items():
        case_root = Path("example") / case_id
        cfg = generate_cfg(case_root / source_file, case_root)
        cfg = _relative_files(cfg, case_root)

        cfg_path = case_root / "cfg.json"
        sources_path = case_root / "function_sources.json"

        cfg_path.write_text(json.dumps(cfg, indent=2, ensure_ascii=False), encoding="utf-8")
        sources_path.write_text(json.dumps(_function_sources(cfg), indent=2, ensure_ascii=False), encoding="utf-8")

        print(f"{case_id}: wrote {cfg_path} and {sources_path}")


if __name__ == "__main__":
    main()

