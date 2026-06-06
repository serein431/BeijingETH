# BeijingETH

Backend for a Solidity smart contract audit demo. It supports project upload,
contract/function structure extraction, Slither or LLM-based finding discovery,
and Foundry PoC verification.

## Quick Start

```bash
conda activate ethbeijing
python -m pip install -r requirements.txt
uvicorn scripts.app:app --reload --host 0.0.0.0 --port 8000
```

## Environment

Python:

```bash
Python 3.12.13
```

Python packages:

```bash
pip3 install -r requirements.txt
```

Foundry is required only for real PoC execution. It is not a pip package.
Install it with the official `foundryup` installer:

```bash
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup
```

Verify installation:

```bash
forge --version
cast --version
anvil --version
```

If `forge` is not installed, the backend can still run structure extraction,
CFG extraction, Slither detection, LLM audit, and example replay. Real
`/api/projects/{project_id}/verify` execution requires `forge`.

LLM credentials are supplied by the frontend in each LLM request. The backend
does not read local `OPENAI_API_KEY`, `OPENAI_BASE_URL`, or `OPENAI_MODEL`
environment variables.

## API

- `GET /api/health`
- `GET /api/examples`
- `POST /api/projects/example/{case_id}`
- `POST /api/projects` with a zip file field named `file`
- `GET /api/projects/{project_id}/structure`
- `POST /api/projects/{project_id}/detect` with `{"tool":"slither"}` or `{"tool":"llm","llm":{...}}`
- `POST /api/projects/{project_id}/verify`
- `POST /api/examples/{case_id}/replay`
- `GET /api/jobs/{job_id}`
- `GET /api/jobs/{job_id}/events`

LLM request shape:

```json
{
  "tool": "llm",
  "llm": {
    "api_key": "user-input-key",
    "model": "gpt-4o-mini",
    "base_url": "https://api.openai.com/v1"
  }
}
```

Verification request shape:

```json
{
  "description": "audit report excerpt selected by the user",
  "target_file": "src/BNRG.sol",
  "target_function": "transferFrom",
  "llm": {
    "api_key": "user-input-key",
    "model": "gpt-4o-mini",
    "base_url": "https://api.openai.com/v1"
  }
}
```

## Demo Data

The `example/` directory contains two curated validation cases:

- `binamon-dos`
- `cleverminu-approve-race`

If `forge` is installed, verification jobs run real Foundry tests. If `forge` is
not installed, use `/api/examples/{case_id}/replay` to return the same event
shape from the saved example generation and test logs.
