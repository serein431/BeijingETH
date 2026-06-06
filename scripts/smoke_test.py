from __future__ import annotations

from pathlib import Path
import json

from .example_replay import list_examples, replay_events
from .pipeline import replay_as_stream
from .solidity_parser import parse_structure


def _collect_event_names(chunks: list[str]) -> list[str]:
    names: list[str] = []
    for chunk in chunks:
        for line in chunk.splitlines():
            if line.startswith("event: "):
                names.append(line.removeprefix("event: ").strip())
    return names


def _collect_sse_payloads(chunks: list[str], event_name: str) -> list[dict]:
    payloads: list[dict] = []
    current_event = ""
    current_data = ""
    for chunk in chunks:
        for line in chunk.splitlines():
            if line.startswith("event: "):
                current_event = line.removeprefix("event: ").strip()
            elif line.startswith("data: "):
                current_data = line.removeprefix("data: ").strip()
            elif line == "" and current_event == event_name and current_data:
                payloads.append(json.loads(current_data))
                current_event = ""
                current_data = ""
    return payloads


def main() -> None:
    cases = {case.case_id for case in list_examples()}
    assert {"binamon-dos", "cleverminu-approve-race"}.issubset(cases), cases

    expected_contracts = {
        "binamon-dos": "BNRG",
        "cleverminu-approve-race": "DoctorShiba",
    }
    for case_id, expected_contract in expected_contracts.items():
        structure = parse_structure(case_id, Path("example") / case_id)
        contract_names = {contract.name for contract in structure.contracts}
        assert expected_contract in contract_names, contract_names
        assert sum(len(contract.functions) for contract in structure.contracts) > 0

        events, verdict = replay_events(case_id)
        assert events, case_id
        assert verdict == "exists", (case_id, verdict)

    discovery_chunks = list(replay_as_stream("binamon-dos", "discover_only"))
    discovery_events = _collect_event_names(discovery_chunks)
    assert "finding" in discovery_events, discovery_events
    assert "poc" not in discovery_events, discovery_events
    assert "test" not in discovery_events, discovery_events
    assert "Discovery complete" in "".join(discovery_chunks)
    discovery_findings = _collect_sse_payloads(discovery_chunks, "finding")
    assert discovery_findings, discovery_findings
    assert discovery_findings[0]["vulnerability"]["risk"] == "High"

    approve_chunks = list(replay_as_stream("cleverminu-approve-race", "discover_only"))
    approve_findings = _collect_sse_payloads(approve_chunks, "finding")
    assert approve_findings, approve_findings
    approve_vulnerability = approve_findings[0]["vulnerability"]
    assert approve_vulnerability["title"] == "Approve race condition"
    assert approve_vulnerability["risk"] == "High"
    assert approve_vulnerability["function"] == "approve"

    verification_chunks = list(replay_as_stream("binamon-dos", "verify_finding"))
    verification_events = _collect_event_names(verification_chunks)
    assert "poc" in verification_events, verification_events
    assert "test" in verification_events, verification_events
    assert "Discovery skipped for report verification" in "".join(verification_chunks)

    print("smoke tests passed")


if __name__ == "__main__":
    main()
