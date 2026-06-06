from __future__ import annotations

import json
import os
from typing import List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .config import default_llm_config
from .detectors import run_llm_audit, run_slither
from .example_replay import list_examples, replay_events
from .models import DetectRequest, JobCreated, VerifyRequest
from .pipeline import replay_as_stream, run_audit_pipeline
from .poc_agent import create_replay_job, get_job, start_job
from .project_store import IGNORED_FILES, IGNORED_PARTS, create_from_example, create_from_zip, get_project_root, list_project_files
from .slither_cfg import generate_cfg
from .solidity_parser import parse_structure


app = FastAPI(title="ETH Beijing Smart Audit Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/examples")
def examples():
    return list_examples()


@app.post("/api/projects/example/{case_id}")
def create_example_project(case_id: str):
    try:
        return create_from_example(case_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/projects")
async def upload_project(file: UploadFile = File(...)):
    content = await file.read()
    if not file.filename or not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Upload a .zip Solidity project")
    try:
        return create_from_zip(file.filename, content)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/projects/{project_id}/structure")
def structure(project_id: str):
    try:
        root = get_project_root(project_id)
        result = parse_structure(project_id, root)
        result.files = list_project_files(root)
        return result
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/projects/{project_id}/cfg")
def cfg(project_id: str, source_file: str | None = None):
    try:
        root = get_project_root(project_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    if source_file:
        target = (root / source_file).resolve()
        rel_parts = target.relative_to(root.resolve()).parts if root.resolve() in target.parents else ()
        if (
            root.resolve() not in target.parents
            or not target.exists()
            or target.suffix != ".sol"
            or target.name in IGNORED_FILES
            or any(part in IGNORED_PARTS for part in rel_parts)
        ):
            raise HTTPException(status_code=400, detail="source_file must be a Solidity source file inside the project input")
    else:
        candidates = sorted((root / "src").rglob("*.sol")) if (root / "src").exists() else sorted(root.rglob("*.sol"))
        candidates = [path for path in candidates if "test" not in path.parts and "preprocessed" not in path.parts]
        if not candidates:
            raise HTTPException(status_code=404, detail="No Solidity source file found")
        target = candidates[0]

    try:
        return generate_cfg(target, root)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"{type(exc).__name__}: {exc}") from exc


@app.post("/api/projects/{project_id}/detect")
def detect(project_id: str, request: DetectRequest):
    try:
        root = get_project_root(project_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if request.tool == "slither":
        return run_slither(project_id, root)
    return run_llm_audit(project_id, root, request.llm)


@app.post("/api/projects/{project_id}/verify", response_model=JobCreated)
def verify(project_id: str, request: VerifyRequest):
    try:
        root = get_project_root(project_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    job = start_job(project_id, root, request)
    return JobCreated(job_id=job.job_id, status=job.status)


@app.post("/api/examples/{case_id}/replay", response_model=JobCreated)
def replay(case_id: str):
    try:
        events, verdict = replay_events(case_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    job = create_replay_job(case_id, events, verdict)
    return JobCreated(job_id=job.job_id, status=job.status)


@app.get("/api/jobs/{job_id}")
def job(job_id: str):
    try:
        return get_job(job_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown job: {job_id}") from exc


@app.get("/api/jobs/{job_id}/events")
def job_events(job_id: str):
    try:
        return get_job(job_id).events
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown job: {job_id}") from exc


@app.get("/api/projects/{project_id}/audit/stream")
def audit_stream(project_id: str):
    try:
        root = get_project_root(project_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    try:
        llm = default_llm_config()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return StreamingResponse(
        run_audit_pipeline(project_id, root, llm),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/examples/{case_id}/stream")
def example_stream(case_id: str, mode: str = "discover_only"):
    from .config import EXAMPLE_ROOT
    case_dir = (EXAMPLE_ROOT / case_id).resolve()
    if not case_dir.exists():
        raise HTTPException(status_code=404, detail=f"Unknown example: {case_id}")
    return StreamingResponse(
        replay_as_stream(case_id, mode),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str


class AuditContext(BaseModel):
    findings: Optional[List[dict]] = None
    phases: Optional[List[dict]] = None
    streamText: Optional[str] = None  # last 2000 chars of audit log
    projectName: Optional[str] = None


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[AuditContext] = None


def build_system_prompt(context: Optional[AuditContext]) -> str:
    base = (
        "You are an AI smart contract security auditor assistant. "
        "The user has just completed an audit of a Solidity contract. "
        "Help the user understand vulnerabilities, suggest remediations, explain attack paths, "
        "and provide security best practices. Respond in the same language the user uses.\n"
        "Be concise but thorough. Use code blocks for Solidity examples."
    )

    if not context:
        return base

    parts: List[str] = [base, "\n\n## Audit Context\n"]

    if context.projectName:
        parts.append(f"- Project: {context.projectName}\n")

    if context.findings:
        parts.append(f"- Vulnerabilities Found: {len(context.findings)}\n")
        parts.append("### Findings:\n")
        for f in context.findings[:10]:
            risk = f.get("risk", "?")
            title = f.get("title", "Unknown")
            description = (f.get("description", "") or "")[:200]
            parts.append(f"- [{risk}] {title}: {description}\n")

    if context.phases:
        phases_summary = ", ".join(
            [f"{p.get('label', '?')}({p.get('status', '?')})" for p in context.phases]
        )
        parts.append(f"\n### Pipeline Status: {phases_summary}\n")

    if context.streamText:
        text = context.streamText[-2000:]
        parts.append(f"\n### Audit Log (last portion):\n```\n{text}\n```\n")

    return "".join(parts)


@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise HTTPException(status_code=500, detail="openai package is not installed") from exc

    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL")
    model = os.getenv("OPENAI_MODEL", "claude_sonnet4_5")

    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")

    client = OpenAI(api_key=api_key, base_url=base_url) if base_url else OpenAI(api_key=api_key)

    system_prompt = build_system_prompt(request.context)
    messages: List[dict] = [{"role": "system", "content": system_prompt}]
    messages.extend([{"role": m.role, "content": m.content} for m in request.messages])

    def event_stream():
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
                temperature=0.7,
                max_tokens=2048,
            )
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    yield f"data: {json.dumps({'token': token})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:  # noqa: BLE001
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
