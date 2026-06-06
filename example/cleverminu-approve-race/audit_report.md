A5. Approve race condition

 Description

 There exists a race condition for approve which allows the approved address to spend more tokens than expected. For example if Alice has approved Eve to spend n of her tokens, then Alice decides to change Eve's approval to m tokens. Alice submits a function call to approve with the value n for Eve. Eve runs an Ethereum node so knows that Alice is going to change her approval to m. Eve then submits a tranferFrom request sending n of Alice's tokens to herself, but gives it a much higher gas price than Alice's transaction. The transferFrom executes first so gives Eve n tokens and sets Eve's approval to zero. Then Alice's transaction executes and sets Eve's approval to m. Eve then sends those m tokens to herself as well. Thus Eve gets n + m tokens even though she should have gotten at most max(n,m).

 Remediation

 It is advised to use safeIncreaseAllowance and safeDecreaseAllowance such as that from Open Zeppelin instead

 Status

 Resolved

 