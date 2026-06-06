from __future__ import annotations

from pathlib import Path

from .slither_cfg import generate_cfg


CASES = {
    "binamon-dos": {
        "source": Path("example/binamon-dos/src/BNRG.sol"),
        "checks": {
            "BNRG.transfer(address,uint256)": [
                "launchRestrict(msg.sender, receiver, numTokens)",
                "balances[msg.sender] = balances[msg.sender].sub(numTokens);",
                "emit Transfer(msg.sender, receiver, numTokens);",
            ],
            "BNRG.transferFrom(address,address,uint256)": [
                "launchRestrict(owner, receiver, numTokens)",
                "allowed[owner][msg.sender] = allowed[owner][msg.sender].sub(numTokens);",
                "emit Transfer(owner, receiver, numTokens);",
            ],
        },
    },
    "cleverminu-approve-race": {
        "source": Path("example/cleverminu-approve-race/src/DoctorShiba.sol"),
        "checks": {
            "DoctorShiba.approve(address,uint256)": [
                "_approve(_msgSender(), spender, amount);",
                "return true;",
            ],
            "DoctorShiba.transferFrom(address,address,uint256)": [
                "_transfer(sender, recipient, amount);",
                "_approve(sender, _msgSender(), _allowances[sender][_msgSender()].sub(amount",
                "return true;",
            ],
        },
    },
}


def _file_slice(source: Path, lines: list[int]) -> str:
    text = source.read_text(encoding="utf-8", errors="ignore").replace("\r\n", "\n").replace("\r", "\n")
    file_lines = text.split("\n")
    return "\n".join(file_lines[line_no - 1] for line_no in lines if 1 <= line_no <= len(file_lines)).strip()


def main() -> None:
    for case_id, case in CASES.items():
        cfg = generate_cfg(case["source"])
        print(f"{case_id}: solc={cfg['solc_version']} contracts={len(cfg['contracts'])} functions={len(cfg['call_graph'])}")
        for key, expected_snippets in case["checks"].items():
            entry = cfg["call_graph"][key]
            source_code = entry["source_code"]
            expected_from_lines = _file_slice(case["source"], entry["lines"])
            assert source_code == expected_from_lines, f"{key} source mapping mismatch"
            for snippet in expected_snippets:
                assert snippet in source_code, f"{key} missing snippet: {snippet}"
            print(f"  ok {key} lines={entry['lines'][0]}-{entry['lines'][-1]}")

    print("slither cfg validation passed")


if __name__ == "__main__":
    main()
