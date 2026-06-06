# Backend API Curl Testing Guide

This guide is for frontend integration testing with the backend service.

## 1. Start Backend

Run this in the remote server terminal:

```bash
conda activate ethbeijing
python -m pip install -r requirements.txt
uvicorn scripts.app:app --host 127.0.0.1 --port 8000
```

If you use VSCode Remote SSH, forward port `8000` in the VSCode Ports panel.

In another terminal:

```bash
BASE=http://127.0.0.1:8000
```

## 2. Health Check

```bash
curl $BASE/api/health
```

Expected:

```json
{"status":"ok"}
```

## 3. List Demo Cases

```bash
curl -s $BASE/api/examples | python -m json.tool
```

Expected cases:

- `binamon-dos`
- `cleverminu-approve-race`

## 4. Create Demo Project

```bash
PROJECT_ID=$(curl -s -X POST $BASE/api/projects/example/binamon-dos \
  | python -c "import sys,json; print(json.load(sys.stdin)['project_id'])")

echo $PROJECT_ID
```

The demo project only contains real input files:

- `src/BNRG.sol`
- `audit_report.md`

It does not include saved PoC tests, replay logs, or preprocessing results.

## 5. Get Code Structure

```bash
curl -s "$BASE/api/projects/$PROJECT_ID/structure" | python -m json.tool
```

The response includes:

- Solidity files
- Contracts
- Functions
- Function signatures
- Function source code
- Source line ranges

## 6. Get Slither CFG

```bash
curl -s "$BASE/api/projects/$PROJECT_ID/cfg?source_file=src/BNRG.sol" \
  | python -m json.tool
```

Print one function body:

```bash
curl -s "$BASE/api/projects/$PROJECT_ID/cfg?source_file=src/BNRG.sol" \
  | python -c "import sys,json; d=json.load(sys.stdin); print(d['call_graph']['BNRG.transferFrom(address,address,uint256)']['source_code'])"
```

The CFG response includes:

- `contracts`
- `public_state_variables`
- `call_graph`
- `source_code` for each function
- `calls`
- `called_by`
- Slither-selected `solc_version`

## 7. Run Slither Detection

```bash
curl -s -X POST "$BASE/api/projects/$PROJECT_ID/detect" \
  -H "Content-Type: application/json" \
  -d '{"tool":"slither"}' \
  | python -m json.tool
```

This does not require an LLM key.

## 8. Run LLM Audit

The frontend must collect `api_key`, `model`, and optionally `base_url` from the user.
The backend does not read local OpenAI environment variables.

```bash
curl -s -X POST "$BASE/api/projects/$PROJECT_ID/detect" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "llm",
    "llm": {
      "api_key": "USER_INPUT_API_KEY",
      "model": "USER_INPUT_MODEL",
      "base_url": "USER_INPUT_BASE_URL"
    }
  }' \
  | python -m json.tool
```

For OpenAI official API, `base_url` can be:

```text
https://api.openai.com/v1
```

For DeepSeek, Qwen, or another OpenAI-compatible gateway, use that gateway URL.

## 9. Start PoC Verification

Use the vulnerability description selected by the user from `audit_report.md`.

Example with the first part of the demo report:

```bash
DESC=$(python - <<'PY'
from pathlib import Path
print(Path("example/binamon-dos/audit_report.md").read_text()[:1500])
PY
)
```

Start verification:

```bash
JOB_ID=$(curl -s -X POST "$BASE/api/projects/$PROJECT_ID/verify" \
  -H "Content-Type: application/json" \
  -d "$(python - <<PY
import json
description = '''$DESC'''
print(json.dumps({
  "description": description,
  "target_file": "src/BNRG.sol",
  "target_function": "transferFrom",
  "llm": {
    "api_key": "USER_INPUT_API_KEY",
    "model": "USER_INPUT_MODEL",
    "base_url": "USER_INPUT_BASE_URL"
  }
}))
PY
)" | python -c "import sys,json; print(json.load(sys.stdin)['job_id'])")

echo $JOB_ID
```

Query job status:

```bash
curl -s "$BASE/api/jobs/$JOB_ID" | python -m json.tool
```

Query job events:

```bash
curl -s "$BASE/api/jobs/$JOB_ID/events" | python -m json.tool
```

Event types include:

- `generating_poc`
- `compile`
- `test`
- `verdict`
- `error`

Real verification requires Foundry `forge`. If `forge` is not installed, the job
will return an environment error.

## 10. Replay Demo Without Forge

Replay is only for frontend demo integration when `forge` is unavailable. It reads
saved example logs and does not represent real verification input.

```bash
REPLAY_JOB_ID=$(curl -s -X POST "$BASE/api/examples/binamon-dos/replay" \
  | python -c "import sys,json; print(json.load(sys.stdin)['job_id'])")

curl -s "$BASE/api/jobs/$REPLAY_JOB_ID" | python -m json.tool
```

## 11. Test Second Demo Case

```bash
PROJECT_ID=$(curl -s -X POST $BASE/api/projects/example/cleverminu-approve-race \
  | python -c "import sys,json; print(json.load(sys.stdin)['project_id'])")

curl -s "$BASE/api/projects/$PROJECT_ID/cfg?source_file=src/DoctorShiba.sol" \
  | python -c "import sys,json; d=json.load(sys.stdin); print(d['call_graph']['DoctorShiba.transferFrom(address,address,uint256)']['source_code'])"
```

## Notes For Frontend

- Normal project input is source code plus a vulnerability description selected by the user.
- Do not send saved PoC tests or replay logs as normal project input.
- For LLM features, always send `llm.api_key`, `llm.model`, and optional `llm.base_url`.
- Slither detection and CFG extraction do not require LLM credentials.
- Job APIs are polling-based for now; call `/api/jobs/{job_id}/events` repeatedly to update the UI log.

