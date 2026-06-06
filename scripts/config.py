from __future__ import annotations

import os
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
EXAMPLE_ROOT = REPO_ROOT / "example"
RUNTIME_ROOT = Path(os.getenv("AUDIT_BACKEND_RUNTIME", REPO_ROOT / ".runtime"))

MAX_REPAIR_ROUNDS = int(os.getenv("AUDIT_MAX_REPAIR_ROUNDS", "3"))

# Load environment variables from the project-level .env file (if present).
try:
    from dotenv import load_dotenv

    load_dotenv(REPO_ROOT / ".env")
except ImportError:  # python-dotenv is optional; env vars may already be exported.
    pass


def default_llm_config():
    """Build an LLMConfig from environment variables.

    Reads OPENAI_API_KEY, OPENAI_BASE_URL and OPENAI_MODEL from the environment
    (typically populated via the project .env file).
    """
    from .models import LLMConfig

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    base_url = os.getenv("OPENAI_BASE_URL", "").strip() or None
    model = os.getenv("OPENAI_MODEL", "").strip()
    if not api_key or not model:
        raise RuntimeError(
            "Missing LLM configuration: set OPENAI_API_KEY and OPENAI_MODEL in .env"
        )
    return LLMConfig(api_key=api_key, model=model, base_url=base_url)
