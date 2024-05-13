# BSWLock Contract

The `BSWLock` contract used for locking and unlocking the `BSW` ERC20 token over a period of time. 
The contract provides a mechanism for token distribution over three addresses in chunks or "parts" over a specified period.

## Key Features

- The contract locks a specified amount of `bsw` tokens and releases them over a specified duration of time (in "parts").
- Provides a mechanism to change recipient addresses.
- Ensures specified conditions are met before tokens can be locked or withdrawn.
- Provides a final withdrawal function to retrieve any tokens left after the all lock periods ends.

## Key Variables

- `bsw`: An instance of the IERC20 interface representing the BSW token contract.
- `totalParts`: Defines the number of parts in which the lock period is divided.
- `partDuration`: Defines the duration of each lock part (in seconds).
- `firstReceiverFixedAmount`: The fixed amount that will be transferred to the first receiver per part.
- `firstReceiverPartsLeft`: Remaining number of parts that will be transferred to the first receiver.
- `lockedAmount`: Represents the total amount of tokens locked in the contract by function `lock`.
- `partAmount`: The number of tokens available for each part.
- `lockTimestamp`: The timestamp when the lock period started.
- `withdrawnParts`: The number of parts that have been withdrawn.
- `firstReceiver`, `secondReceiver`, `thirdReceiver`: Addresses of the token receivers.

## Functions
- `setTokenReceivers`: Sets the addresses for the first, second, and third receivers. Only owner can call
- `lock`: Locks a particular amount of `bsw` tokens in the contract.
- `withdraw`: Allows withdrawal of tokens based on the number of parts that are due for release.
- `finalWithdraw`: Makes a final token withdrawal when the lock period ends and all lock periods are over.

## Events
- `LockTokens`: Emits when tokens are locked.
- `WithdrawTokens`: Emits when tokens are withdrawn.
- `SetTokenReceivers`: Emits when the receiver addresses are changed.

The contract needs to be deployed with the first, second and third receiver addresses specified during the contract deployment.