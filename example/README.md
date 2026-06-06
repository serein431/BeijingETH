# Example Case Index

This directory contains curated smart contract audit validation examples for frontend integration.

## Cases

- `binamon-dos/`: restricted-mode cooldown denial of service in `BNRG.sol`
- `cleverminu-approve-race/`: ERC20 approve race condition in `DoctorShiba.sol`

## Common File Layout

- `README.md`: case summary and file mapping
- `audit_report.md`: audit report content only
- `audit_report.pdf`: original audit report PDF
- `src/`: vulnerable project source code
- `test/`: Forge PoC test
- `forge_run_output.txt`: successful Forge compile/test output and exploit logs
- `generation_repair_log.json`: original generation, repair, and compile/test process from `results/FORGE/log`
- `preprocessed/`: decoded pickle input from `datasets/FORGE/preprocessed_data`
