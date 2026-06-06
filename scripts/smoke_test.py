from __future__ import annotations

from pathlib import Path

from .example_replay import list_examples, replay_events
from .solidity_parser import parse_structure


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

    print("smoke tests passed")


if __name__ == "__main__":
    main()

