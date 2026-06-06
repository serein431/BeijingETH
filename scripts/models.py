from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


Risk = Literal["High", "Medium", "Low", "Informational", "Unknown"]
Detector = Literal["slither", "llm"]
Verdict = Literal["exists", "not_exists", "failed", "unknown"]


class ProjectSummary(BaseModel):
    project_id: str
    name: str
    status: str
    root: str
    files: list[str] = Field(default_factory=list)


class FunctionInfo(BaseModel):
    name: str
    signature: str
    contract: str | None = None
    file: str
    start_line: int | None = None
    end_line: int | None = None
    source: str


class ContractInfo(BaseModel):
    name: str
    file: str
    functions: list[FunctionInfo] = Field(default_factory=list)


class ProjectStructure(BaseModel):
    project_id: str
    contracts: list[ContractInfo] = Field(default_factory=list)
    files: list[str] = Field(default_factory=list)
    parser: str
    warnings: list[str] = Field(default_factory=list)


class Vulnerability(BaseModel):
    id: str
    title: str
    description: str
    risk: Risk = "Unknown"
    contract: str | None = None
    function: str | None = None
    location: str | None = None
    raw_output: Any | None = None


class LLMConfig(BaseModel):
    api_key: str
    model: str
    base_url: str | None = None


class DetectRequest(BaseModel):
    tool: Detector
    llm: LLMConfig | None = None


class DetectResponse(BaseModel):
    project_id: str
    tool: Detector
    vulnerabilities: list[Vulnerability] = Field(default_factory=list)
    raw_output: Any | None = None
    error: str | None = None


class VerifyRequest(BaseModel):
    description: str
    llm: LLMConfig
    target_file: str | None = None
    target_function: str | None = None


class JobCreated(BaseModel):
    job_id: str
    status: str


class JobEvent(BaseModel):
    index: int
    type: str
    message: str
    data: dict[str, Any] = Field(default_factory=dict)


class JobStatus(BaseModel):
    job_id: str
    status: Literal["queued", "running", "succeeded", "failed"]
    verdict: Verdict = "unknown"
    events: list[JobEvent] = Field(default_factory=list)


class ExampleCase(BaseModel):
    case_id: str
    title: str
    description: str
    final_verdict: str | None = None
