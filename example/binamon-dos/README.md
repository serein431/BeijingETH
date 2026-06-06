# Binamon Restricted Mode DoS

## Case Summary

- Vulnerability type: Denial of Service in restricted transaction mode
- Project source: `src/BNRG.sol`
- Proof of concept: `test/Binamon_Energy_Smart_Contract_Audit_Report_QuillAudits_0.t.sol`
- Forge result: successful exploit validation
- Final verdict: `Vulnerability Exists: Attack successfully prevents victim transactions during cooldown`

## Files

- `audit_report.md`: audit report vulnerability description extracted from `results/FORGE/log_check/Binamon Energy Smart Contract Audit Report - QuillAudits_0.txt`
- `audit_report.pdf`: original audit PDF copied from `/mnt/data/LLM4Logic/FORGE-Artifact/dataset/artifacts/Binamon Energy Smart Contract Audit Report - QuillAudits.pdf`
- `src/BNRG.sol`: vulnerable contract source copied from `results/FORGE/running/Binamon Energy Smart Contract Audit Report - QuillAudits_0/src/BNRG.sol`
- `test/Binamon_Energy_Smart_Contract_Audit_Report_QuillAudits_0.t.sol`: differential PoC copied from `results/FORGE/running/Binamon Energy Smart Contract Audit Report - QuillAudits_0/test/`
- `forge_run_output.txt`: forge compile and test output copied from `results/FORGE/log_check/Binamon Energy Smart Contract Audit Report - QuillAudits_0.txt`
- `generation_repair_log.json`: generated PoC and repair/compile process copied from `results/FORGE/log/Binamon Energy Smart Contract Audit Report - QuillAudits_0.json`
- `preprocessed/`: decoded pickle input from `datasets/FORGE/preprocessed_data/Binamon Energy Smart Contract Audit Report - QuillAudits_0.pkl`

## Frontend Notes

This case has two generation rounds. Round 1 produced a failing test because the baseline transfer put the victim into cooldown before the attack. Round 2 fixed the timeline by waiting for cooldown reset before executing the attacker-controlled zero-value `transferFrom`.

The `preprocessed/` directory contains extra generation input that was not covered by the forge result files: relevant source snippets, extracted function signatures, and main contract skeletons.
