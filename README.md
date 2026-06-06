# Smart Audit — AI-Powered Solidity Security Auditor

An end-to-end smart contract security audit platform. Upload a Solidity project (or pick a built-in example), and watch the AI analyze vulnerabilities in real-time with streaming output and an animated pipeline visualization.

## Architectures

```
┌──────────┬─────────────────────────┬────────────────────┐
│ Sidebar  │   Stream Panel (Left)   │  Flow Panel (Right) │
│          │                         │                     │
│          │  Streaming LLM analysis │  Pipeline nodes:    │
│          │  with markdown render   │  Parse → Slither →  │
│          │  + typing cursor        │  LLM Audit → PoC   │
│          │                         │  Gen → Forge Test   │
│          ├─────────────────────────┤  → Verdict          │
│          │  Upload / Example       │                     │
└──────────┴─────────────────────────┴────────────────────┘
```

- **Backend**: FastAPI + OpenAI-compatible LLM (claude_sonnet4_5) + Slither + Foundry
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + TypeScript

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- [Foundry](https://book.getfoundry.sh/) (optional, for real PoC execution)

### 1. Environment

Copy `.env.example` or create `.env` in the project root:

```env
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://your-llm-endpoint/v1
OPENAI_MODEL=claude_sonnet4_5
```

### 2. Backend

```bash
pip install -r requirements.txt
uvicorn scripts.app:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Audit Pipeline

| Phase | Description |
|-------|-------------|
| **Parse** | Extract contracts, functions, and structure from Solidity source |
| **Slither** | Static analysis via Slither (skipped if not installed) |
| **LLM Audit** | Streaming AI security audit with vulnerability detection |
| **PoC Generation** | AI generates Foundry test to verify top vulnerability |
| **Forge Test** | Compile & execute PoC with auto-repair loop (up to 3 rounds) |
| **Verdict** | `exists` / `not_exists` / `failed` |

All phases stream SSE events to the frontend in real-time.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/examples` | List built-in example cases |
| POST | `/api/projects` | Upload .zip Solidity project |
| POST | `/api/projects/example/{case_id}` | Create project from example |
| GET | `/api/projects/{id}/structure` | Parse contract structure |
| GET | `/api/projects/{id}/audit/stream` | **SSE** full audit pipeline |
| GET | `/api/examples/{case_id}/stream` | **SSE** replay example audit |
| POST | `/api/projects/{id}/detect` | Run Slither or LLM detection |
| POST | `/api/projects/{id}/verify` | Start PoC verification job |
| GET | `/api/jobs/{id}` | Get job status |

## Demo Data

Two curated cases in `example/`:

- **cleverminu-approve-race** — ERC20 approve race condition (double-spend)
- **binamon-dos** — Denial of service vulnerability

## Project Structure

```
├── scripts/             # Backend (FastAPI)
│   ├── app.py           # API routes + SSE endpoints
│   ├── pipeline.py      # Streaming audit orchestrator
│   ├── llm_client.py    # OpenAI-compatible LLM client (sync + stream)
│   ├── detectors.py     # Slither + LLM vulnerability detection
│   ├── poc_agent.py     # PoC generation with repair loop
│   ├── foundry_runner.py# Forge test execution
│   ├── solidity_parser.py# Regex-based Solidity parser
│   ├── slither_cfg.py   # Slither-based CFG extraction
│   ├── project_store.py # Project upload/storage
│   ├── models.py        # Pydantic models
│   └── config.py        # Environment config
├── frontend/            # Frontend (React + Vite)
│   └── src/
│       ├── App.tsx
│       ├── hooks/useAuditStream.ts  # SSE streaming hook
│       └── components/
│           ├── StreamPanel.tsx      # Streaming LLM output
│           ├── FlowPanel.tsx        # Pipeline visualization
│           ├── UploadArea.tsx       # Upload + example selection
│           └── Sidebar.tsx          # Navigation
├── example/             # Built-in audit cases
└── requirements.txt
```
