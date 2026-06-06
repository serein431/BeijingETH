# Repository Guidelines

## Project Structure & Module Organization

This repository contains Smart Audit, an AI-assisted Solidity audit platform.
Backend code lives in `scripts/`: `app.py` exposes FastAPI and SSE routes,
`pipeline.py` orchestrates audit streaming, `detectors.py` wraps Slither and LLM
checks, and `poc_agent.py`/`foundry_runner.py` handle Foundry PoCs. Frontend code
lives in `frontend/src/`, with React components in `components/`, the SSE hook in
`hooks/useAuditStream.ts`, and styles in `styles/index.css`. Built-in Solidity
audit examples are under `example/`.

## Build, Test, and Development Commands

- `pip install -r requirements.txt`: install Python 3.12 backend dependencies.
- `uvicorn scripts.app:app --reload --port 8000`: run the local API server.
- `python -m scripts.smoke_test`: verify example discovery, parsing, and replay
  data without requiring an LLM or Foundry.
- `python scripts/validate_slither_cfg.py`: validate Slither CFG behavior when
  Solidity tooling is installed.
- `cd frontend && npm install`: install frontend dependencies.
- `cd frontend && npm run dev`: start the Vite dev server.
- `cd frontend && npm run build`: run TypeScript build checks and create the
  production frontend bundle.

## Coding Style & Naming Conventions

Use 4-space indentation and type annotations for Python. Keep backend modules
small and task-specific, following the current `scripts/*.py` pattern. FastAPI
route handlers should validate inputs before touching project files. React files
use TypeScript, PascalCase component filenames such as `FlowPanel.tsx`, and
camelCase hooks/functions such as `useAuditStream`. Prefer explicit model types
from `scripts/models.py` and `frontend/src/types.ts` for API contracts.

## Testing Guidelines

Add focused tests or smoke checks near the code path changed. For backend
pipeline or parser changes, update `scripts/smoke_test.py` or add a small
executable test module. For frontend changes, run `npm run build` at minimum.
When changing PoC verification, test replay examples and a real `forge` path if
Foundry is available.

## Commit & Pull Request Guidelines

Recent commits use concise Conventional Commit-style prefixes, for example
`feature: streaming audit frontend + SSE pipeline`, `test: smoke test`, and
`update: env requirements`. Keep that style. Pull requests should describe the
changed audit flow, list commands run, note any LLM/Foundry requirements, and
include screenshots or short recordings for visible frontend changes.

## Security & Configuration Tips

Do not commit API keys or local `.env` files. API credentials should come from
user input or local environment only. Treat uploaded ZIP projects as untrusted
input; preserve path validation and ignored-file filtering when modifying upload,
parsing, or CFG generation logic.
