#### High severity issues

###### 1. Denial of Service in Transactions [Restricted Mode]

   modifier launchRestrict(address sender, address recipient, uint256 amount) {     if (state == State.Locked) { require(sender == owner(), "Tokens are locked");     }     if (state == State.Restricted) { require(amount <= maxRestrictionAmount, "BNRG: amount greater than max limit in restricted mode"); require(lastTx[sender].add(60) <= block.timestamp && lastTx[recipient].add(60) <= block.timestamp, "BMON: only one tx/min in restricted mode"); lastTx[sender] = block.timestamp; lastTx[recipient] = block.timestamp;     }     if (state == State.Unlocked) { if (isBlacklisted[recipient]) { require(lastTx[recipient] + 30 days <= block.timestamp, "BNRG: only one tx/ month in banned mode"); lastTx[recipient] = block.timestamp; } else if (isBlacklisted[sender]) { require(lastTx[sender] + 30 days <= block.timestamp, "BNRG: only one tx/ month in banned mode"); lastTx[sender] = block.timestamp; }     }     _;   }

 Description The Binamon Team had implemented a modifier to prevent bots and also to limit the number of transactions that a user can do per minute or per month. This feature can have a critical impact in the smart contract and block all the transactions that a user can do. An attacker can exploit this by calling the function transfer of TransferFrom using the address of the Victim as a receiver and an owner with numToken equal to 0, the modifier will be triggered, and the address of the victim will be added to lastTx, when the legit user wants to call the transfer function the modifier will prevent him. A script can be done to block all the addresses each minute, thus launching a denial service attack on the contract.

 Remediation The modifier launchRestrict should only be based on the msg.sender to prevent the caller of the function, not the receiver or the sender.

 Status: Acknowledged by the Auditee

 05


-----

