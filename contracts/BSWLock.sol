// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.24;

import "./IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


/// @title Contract to lock dev team BSW tokens
contract BSWLock is Ownable {

    /// @notice BSW token ERC20 interface
    IERC20 constant public bsw = IERC20(0x965F527D9159dCe6288a2219DB51fc6Eef120dD1);
    /// @notice How many parts is the lock period divided into
    uint public constant totalParts = 36;
    /// @notice period of each lock part
    uint public constant partDuration = 30 days;
    /// @notice fixed amount for payment to first receiver
    uint public constant firstReceiverFixedAmount = 1e6 ether;
    /// @notice how many periods the first recipient will accept the tokens
    uint public firstReceiverPartsLeft = 10;
    /// @notice unlock tokens amount for each period
    uint public partAmount;
    /// @notice timestamp when lock period started
    uint public lockTimestamp;
    /// @notice how many parts have been withdrawn
    uint public withdrawnParts;
    /// @notice first address of token receiver (1e6 tokens each period for 10 times)
    address public firstReceiver;
    /// @notice second address of token receiver 50% of the rest
    address public secondReceiver;
    /// @notice third address of token receiver 50% of the rest
    address public thirdReceiver;

    /// @notice emit when tokens locked
    /// @param amount amount locked tokens
    event LockTokens(uint amount);
    /// @notice emit when withdraw tokens
    /// @param  amount how many tokens withdrawn
    event WithdrawTokens(uint amount);
    /// @notice emit when receivers changed
    event SetTokenReceivers(address _firstReceiver, address _secondReceiver, address _thirdReceiver);

    /// @notice Constructor for the BSWLock contract.
    /// @param _firstReceiver Address of the first token receiver
    /// @param _secondReceiver Address of the second token receiver
    /// @param _thirdReceiver Address of the third token receiver
    constructor(address _firstReceiver, address _secondReceiver, address _thirdReceiver) Ownable(msg.sender) {
        setTokenReceivers(_firstReceiver, _secondReceiver, _thirdReceiver);
    }

   /// @notice Sets the token receivers for the contract
   /// The function replaces the current token receivers with the ones provided in the arguments
   /// @param _firstReceiver Wallet address for initial token receiver
   /// @param _secondReceiver Wallet address for secondary receiver
   /// @param _thirdReceiver Wallet address for third receiver
   /// @dev Function can be called only by the contract owner
    function setTokenReceivers(address _firstReceiver, address _secondReceiver, address _thirdReceiver) public onlyOwner {
        require(_firstReceiver != address(0) && _secondReceiver != address(0) && _thirdReceiver != address(0), "Receiver addresses can't be zero");
        firstReceiver = _firstReceiver;
        secondReceiver = _secondReceiver;
        thirdReceiver = _thirdReceiver;
        emit SetTokenReceivers(_firstReceiver, _secondReceiver, _thirdReceiver);
    }

    /// @notice function to lock tokens
    /// @param amount amount of locked tokens
    function lock(uint amount) external {
        if(lockTimestamp == 0){
            lockTimestamp = block.timestamp;
        }
        require(lockTimestamp + partDuration > block.timestamp, "Lock: Cant lock tokens after first period ended");
        bsw.transferFrom(msg.sender, address(this), amount);
        partAmount = bsw.balanceOf(address(this)) / totalParts;
        require(partAmount >= firstReceiverFixedAmount, "Lock: Low amount");
        emit LockTokens(amount);
    }

    /// @notice withdraw unlocked tokens
    function withdraw() external {
        require(lockTimestamp > 0, "Withdraw: Not locked yet");
        require(withdrawnParts < totalParts,"Withdraw: All parts withdrawn");
        partAmount = bsw.balanceOf(address(this))/(totalParts - withdrawnParts);
        uint partsCount = (block.timestamp - lockTimestamp) / partDuration;
        require(partsCount > withdrawnParts, "Withdraw: lock period is not over yet");
        uint partsToWithdraw = partsCount < totalParts ? partsCount - withdrawnParts : totalParts - withdrawnParts;
        withdrawnParts = partsCount > totalParts ? totalParts : partsCount;
        uint _firstReceiverPartsToWithdraw = firstReceiverPartsLeft >= partsToWithdraw ?
            partsToWithdraw :
            firstReceiverPartsLeft;
        firstReceiverPartsLeft -= _firstReceiverPartsToWithdraw;
        uint _firstReceiverWithdrawAmount = _firstReceiverPartsToWithdraw * firstReceiverFixedAmount;
        if(_firstReceiverWithdrawAmount > 0){
            bsw.transfer(firstReceiver, _firstReceiverWithdrawAmount);
        }
        uint amount = (partsToWithdraw * partAmount - _firstReceiverWithdrawAmount)/2;
        bsw.transfer(secondReceiver, amount);
        bsw.transfer(thirdReceiver, amount);

        emit WithdrawTokens(_firstReceiverWithdrawAmount + amount + amount);
    }

    /// @notice final withdraw tokens when end lock period and all vesting periods
    /// @param token ERC20 token contract for withdraw
    function finalWithdraw(IERC20 token) external {
        require(block.timestamp >= lockTimestamp + totalParts * partDuration, "finalWithdraw: All periods have not yet passed");
        uint amount = token.balanceOf(address(this));
        token.transfer(secondReceiver, amount);
        emit WithdrawTokens(amount);
    }
}
