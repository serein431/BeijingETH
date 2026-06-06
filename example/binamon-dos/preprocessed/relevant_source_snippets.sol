    function transferFrom(address owner, address receiver, uint256 numTokens) public override launchRestrict(owner, receiver, numTokens) returns (bool) {
        require(numTokens <= balances[owner]);    
        require(boosterBuyingAllowed[owner] == msg.sender || numTokens <= allowed[owner][msg.sender]);
    
        balances[owner] = balances[owner].sub(numTokens);
        if (boosterBuyingAllowed[owner] != msg.sender) {
            allowed[owner][msg.sender] = allowed[owner][msg.sender].sub(numTokens);
            balances[receiver] = balances[receiver].add(numTokens);
            emit Transfer(owner, receiver, numTokens);
        } else {
            _totalSupply = _totalSupply.sub(numTokens);
            emit Transfer(owner, address(0), numTokens);
        }
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    function transfer(address receiver, uint256 numTokens) public override launchRestrict(msg.sender, receiver, numTokens) returns (bool) {
        require(numTokens > 0, "Transfer amount must be greater than zero");
        require(numTokens <= balances[msg.sender]);
        balances[msg.sender] = balances[msg.sender].sub(numTokens);
        balances[receiver] = balances[receiver].add(numTokens);
        emit Transfer(msg.sender, receiver, numTokens);
        return true;
    }

    modifier launchRestrict(address sender, address recipient, uint256 amount) {
        if (state == State.Locked) {
            require(sender == owner(), "Tokens are locked");
        }
        if (state == State.Restricted) {
            require(amount <= maxRestrictionAmount, "BNRG: amount greater than max limit in restricted mode");
            require(lastTx[sender].add(60) <= block.timestamp && lastTx[recipient].add(60) <= block.timestamp, "BMON: only one tx/min in restricted mode");
            lastTx[sender] = block.timestamp;
            lastTx[recipient] = block.timestamp;
        }
        if (state == State.Unlocked) {
            if (isBlacklisted[recipient]) {
                require(lastTx[recipient] + 30 days <= block.timestamp, "BNRG: only one tx/month in banned mode");
                lastTx[recipient] = block.timestamp;
            } else if (isBlacklisted[sender]) {
                require(lastTx[sender] + 30 days <= block.timestamp, "BNRG: only one tx/month in banned mode");
                lastTx[sender] = block.timestamp;
            }
        }
        _;
    }

    function transfer(address recipient, uint256 amount) external returns (bool);

