from __future__ import annotations

import os
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
EXAMPLE_ROOT = REPO_ROOT / "example"
RUNTIME_ROOT = Path(os.getenv("AUDIT_BACKEND_RUNTIME", REPO_ROOT / ".runtime"))

MAX_REPAIR_ROUNDS = int(os.getenv("AUDIT_MAX_REPAIR_ROUNDS", "3"))
