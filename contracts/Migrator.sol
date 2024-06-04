// SPDX-License-Identifier: UNLICENSED
// ALL RIGHTS RESERVED
// Unicrypt by SDDTech reserves all rights on this code. You may NOT copy these contracts.

// An example migration contract, the real one will be NOTHING like this.

pragma solidity ^0.8.0;

import "./TransferHelper.sol";

import "./EnumerableSet.sol";
import "./Ownable.sol";
import "./ReentrancyGuard.sol";

/* import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.0.0/contracts/utils/structs/EnumerableSet.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.0.0/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.0.0/contracts/security/ReentrancyGuard.sol"; */

interface IMigrator {
    function migrate(address token, uint256 amountDeposited, uint256 amountWithdrawn, uint256 startEmission, uint256 endEmission, uint256 lockID, address owner, address condition, uint256 amountInTokens, uint256 option) external returns (bool);
}

contract Migrator is Ownable, ReentrancyGuard, IMigrator {
  using EnumerableSet for EnumerableSet.AddressSet;

  struct TokenLock {
    address tokenAddress; // The token address
    uint256 amountDeposited; // the total amount of tokens deposited
    uint256 amountWithdrawn; // amount of tokens withdrawn
    uint256 startEmission; // date token emission begins
    uint256 endEmission; // the date the tokens can be withdrawn
    uint256 lockID; // lockID nonce per token lock
    address owner; // the owner who can edit or withdraw the lock
    address condition; // address(0) = no condition, otherwise the condition must implement IUnlockCondition
    uint256 option;
  }
  
  mapping(uint256 => TokenLock) public LOCKS; // map lockID nonce to the lock
  uint256 public NONCE = 0; // incremental lock nonce counter

  event onDeposit(uint256 lockID, address token, address locker, uint256 amount, uint256 startEmission, uint256 endEmission);
  event onWithdraw(address lpToken, uint256 amount);
  
  /**
   * @notice whitelisted accounts and contracts who can call the editZeroFeeWhitelist function
   */
  function migrate (address _token, uint256 _amountDeposited, uint256 _amountWithdrawn, uint256 _startEmission, uint256 _endEmission, uint256 _lockID, address _owner, address _condition, uint256 _amountInTokens, uint256 _option) override external returns (bool) {
    // require(msg.sender == TOKEN_VESTING) // need security check like this for production code
    TransferHelper.safeTransferFrom(_token, address(msg.sender), address(this), _amountInTokens);
    
    TokenLock memory token_lock;
    token_lock.tokenAddress = _token;
    token_lock.amountDeposited = _amountDeposited;
    token_lock.amountWithdrawn = _amountWithdrawn;
    token_lock.startEmission = _startEmission;
    token_lock.endEmission = _endEmission;
    token_lock.lockID = NONCE;
    token_lock.owner = _owner;
    token_lock.condition = _condition;
    token_lock.option = _option;
    
    // record the new lock globally
    LOCKS[NONCE] = token_lock;
    NONCE ++;
    return true;
  }
}