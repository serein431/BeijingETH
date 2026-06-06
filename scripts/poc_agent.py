from __future__ import annotations

import threading
import uuid
from pathlib import Path

from . import config
from .foundry_runner import classify_forge_output, forge_available, prepare_run_dir, run_forge_test
from .llm_client import chat, extract_fenced
from .models import JobEvent, JobStatus, VerifyRequest
from .solidity_parser import parse_structure


JOBS: dict[str, JobStatus] = {}


def _add(job_id: str, event_type: str, message: str, **data: object) -> None:
    job = JOBS[job_id]
    job.events.append(JobEvent(index=len(job.events), type=event_type, message=message, data=dict(data)))


def _prompt(project_id: str, project_root: Path, request: VerifyRequest) -> list[dict[str, str]]:
    structure = parse_structure(project_id, project_root)
    snippets = []
    for contract in structure.contracts:
        for fn in contract.functions:
            if request.target_function and request.target_function not in {fn.name, fn.signature}:
                continue
            if request.target_file and request.target_file != fn.file:
                continue
            snippets.append(f"## {contract.name}.{fn.name} ({fn.file}:{fn.start_line})\n{fn.source}")
    if not snippets:
        for contract in structure.contracts[:8]:
            for fn in contract.functions[:10]:
                snippets.append(f"## {contract.name}.{fn.name} ({fn.file}:{fn.start_line})\n{fn.source}")
    imports = ", ".join(structure.files[:20])
    return [
        {
            "role": "system",
            "content": (
                "You are a smart contract security audit expert. Generate a Foundry .t.sol "
                "test that verifies the described vulnerability. Import target contracts from "
                "../src/. Do not paste or redeclare target contracts. Return only a solidity code block. "
                "The test must print exactly one final verdict line beginning with "
                "'Vulnerability Exists:' or 'Vulnerability not Exist:'."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Available Solidity files: {imports}\n\n"
                f"Vulnerability description:\n{request.description}\n\n"
                f"Relevant code:\n{chr(10).join(snippets)[:60000]}"
            ),
        },
    ]


def _repair_prompt(original: list[dict[str, str]], previous_code: str, forge_output: str) -> list[dict[str, str]]:
    return original + [
        {
            "role": "user",
            "content": (
                "The previous Foundry test failed. Regenerate the complete fixed test.\n\n"
                f"Previous test:\n```solidity\n{previous_code}\n```\n\n"
                f"Foundry output:\n```\n{forge_output[-30000:]}\n```"
            ),
        }
    ]


def _run_job(job_id: str, project_id: str, project_root: Path, request: VerifyRequest) -> None:
    job = JOBS[job_id]
    job.status = "running"
    try:
        if not forge_available():
            _add(job_id, "error", "forge is not installed; real verification cannot run for uploaded projects")
            job.status = "failed"
            job.verdict = "failed"
            return

        base_prompt = _prompt(project_id, project_root, request)
        prompt = base_prompt
        run_dir = config.RUNTIME_ROOT / "runs" / job_id
        prepare_run_dir(project_root, run_dir)
        test_file = run_dir / "test" / f"Generated_{job_id[:8]}.t.sol"

        for round_no in range(1, config.MAX_REPAIR_ROUNDS + 1):
            _add(job_id, "generating_poc", f"Generating PoC round {round_no}", round=round_no)
            response = chat(request.llm, prompt)
            code = extract_fenced(response, "solidity")
            test_file.write_text(code, encoding="utf-8")
            _add(job_id, "compile", f"Running Foundry round {round_no}", test_file=str(test_file))
            output = run_forge_test(run_dir)
            ok, verdict = classify_forge_output(output)
            _add(job_id, "test", f"Foundry round {round_no} finished", output=output[-50000:], round=round_no)
            if ok:
                job.verdict = verdict  # type: ignore[assignment]
                job.status = "succeeded"
                _add(job_id, "verdict", f"Verification finished with verdict: {verdict}", verdict=verdict)
                return
            prompt = _repair_prompt(base_prompt, code, output)

        job.status = "failed"
        job.verdict = "failed"
        _add(job_id, "verdict", "Verification failed after repair rounds", verdict="failed")
    except Exception as exc:
        job.status = "failed"
        job.verdict = "failed"
        _add(job_id, "error", f"{type(exc).__name__}: {exc}")


def start_job(project_id: str, project_root: Path, request: VerifyRequest) -> JobStatus:
    job_id = uuid.uuid4().hex
    JOBS[job_id] = JobStatus(job_id=job_id, status="queued")
    thread = threading.Thread(target=_run_job, args=(job_id, project_id, project_root, request), daemon=True)
    thread.start()
    return JOBS[job_id]


def get_job(job_id: str) -> JobStatus:
    if job_id not in JOBS:
        raise KeyError(job_id)
    return JOBS[job_id]


def create_replay_job(case_id: str, events: list[JobEvent], verdict: str) -> JobStatus:
    job_id = f"replay-{case_id}-{uuid.uuid4().hex[:8]}"
    status = "succeeded" if verdict != "failed" else "failed"
    JOBS[job_id] = JobStatus(job_id=job_id, status=status, verdict=verdict, events=events)  # type: ignore[arg-type]
    return JOBS[job_id]
