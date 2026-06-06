"""Quick connectivity check for the configured OpenAI-compatible LLM endpoint.

Run from the project root:
    python -m scripts.llm_smoke
"""
from __future__ import annotations

from .config import default_llm_config
from .llm_client import chat


def main() -> None:
    llm = default_llm_config()
    print(f"[smoke] base_url={llm.base_url} model={llm.model}")
    reply = chat(
        llm,
        [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello"},
        ],
    )
    print("[smoke] reply:", reply)


if __name__ == "__main__":
    main()
