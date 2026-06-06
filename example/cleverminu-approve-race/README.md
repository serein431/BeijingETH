# CleverMinu Approve Race Condition

## Case Summary

- Vulnerability type: ERC20 approve race condition / double spend
- Project source: `src/DoctorShiba.sol`
- Proof of concept: `test/CleverMinu_Smart_Contract_Audit_Report_QuillAudits__4.t.sol`
- Forge result: successful exploit validation
- Final verdict: `Vulnerability Exists: Approve Race Condition allowed double spending`

## Files

- `audit_report.md`: audit report vulnerability description extracted from `results/FORGE/log_check/CleverMinu_Smart_Contract_Audit_Report_QuillAudits__4.txt`
- `audit_report.pdf`: original audit PDF copied from `/mnt/data/LLM4Logic/FORGE-Artifact/dataset/artifacts/CleverMinu_Smart_Contract_Audit_Report_QuillAudits_.pdf`
- `src/DoctorShiba.sol`: vulnerable contract source copied from `results/FORGE/running/CleverMinu_Smart_Contract_Audit_Report_QuillAudits__4/src/DoctorShiba.sol`
- `test/CleverMinu_Smart_Contract_Audit_Report_QuillAudits__4.t.sol`: differential PoC copied from `results/FORGE/running/CleverMinu_Smart_Contract_Audit_Report_QuillAudits__4/test/`
- `forge_run_output.txt`: forge compile and test output copied from `results/FORGE/log_check/CleverMinu_Smart_Contract_Audit_Report_QuillAudits__4.txt`
- `generation_repair_log.json`: generated PoC and compile process copied from `results/FORGE/log/CleverMinu_Smart_Contract_Audit_Report_QuillAudits__4.json`
- `preprocessed/`: decoded pickle input from `datasets/FORGE/preprocessed_data/CleverMinu_Smart_Contract_Audit_Report_QuillAudits__4.pkl`

## Frontend Notes

This case succeeds in one generation round. The PoC records Alice/Eve balances and allowance before the attack, executes the two-step approval race, then verifies Eve gained both the original approval and the replacement approval amount.

The `preprocessed/` directory contains extra generation input that was not covered by the forge result files: relevant source snippets, extracted function signatures, and main contract skeletons.
