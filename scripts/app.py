from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile

from .detectors import run_llm_audit, run_slither
from .example_replay import list_examples, replay_events
from .models import DetectRequest, JobCreated, VerifyRequest
from .poc_agent import create_replay_job, get_job, start_job
from .project_store import IGNORED_FILES, IGNORED_PARTS, create_from_example, create_from_zip, get_project_root, list_project_files
from .slither_cfg import generate_cfg
from .solidity_parser import parse_structure


app = FastAPI(title="ETH Beijing Smart Audit Backend", version="0.1.0")


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
    return run_llm_audit(project_id, root)


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
