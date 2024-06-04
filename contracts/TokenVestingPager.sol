// SPDX-License-Identifier: UNLICENSED
// ALL RIGHTS RESERVED
// Unicrypt by SDDTech reserves all rights on this code. You may NOT copy these contracts.

pragma solidity ^0.8.0;

import "./Ownable.sol";
import "./IERC20.sol";

// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.0.0/contracts/access/Ownable.sol";

import "./TokenVesting.sol";

contract TokenVestingPager is Ownable {
  
  struct TokenLock {
    uint256 lockID; // lockID nonce per token lock
    address tokenAddress; // The token address
    uint256 tokensDeposited; // With rebasing or other mechanisms this can change
    uint256 tokensWithdrawn; // With rebasing or other mechanisms this can change
    uint256 sharesDeposited; // amount of shares deposited
    uint256 sharesWithdrawn; // amount of shares withdrawn
    uint256 startEmission; // date token emission begins
    uint256 endEmission; // unlockDate: the date the tokens can be withdrawn
    address owner; // the owner who can edit or withdraw the lock
    address condition; // address(0) = no condition, otherwise the condition must implement IUnlockCondition
  }

  uint256 public MAX_GETTER_LENGTH = 1000; // maximum array size for getter functions
  
  TokenVesting TOKEN_VESTING;

  constructor (TokenVesting _tokenVestingContract) {
    TOKEN_VESTING = _tokenVestingContract;
  }
  
  function setMaxGetterLength(uint256 _length) public onlyOwner {
    MAX_GETTER_LENGTH = _length;
  }
  
  function getNumLockedTokens () external view returns (uint256) {
    return TOKEN_VESTING.getNumLockedTokens();
  }
  
  function getLock (uint256 _lock_id) public view returns (TokenLock memory) {
      (
        uint256 lockID,
        address tokenAddress,
        uint256 tokensDeposited,
        uint256 tokensWithdrawn,
        uint256 sharesDeposited,
        uint256 sharesWithdrawn,
        uint256 startEmission,
        uint256 endEmission,
        address owner,
        address condition
      ) = TOKEN_VESTING.getLock(_lock_id);
      return TokenLock(lockID, tokenAddress, tokensDeposited, tokensWithdrawn, sharesDeposited, sharesWithdrawn, startEmission, endEmission, owner, condition);
  }
  
  /**
   * @notice returns multiple locks
   * @param _lock_ids an array of lock ids to fetch e.g. [0,2,5]
   */
  function getLocks (uint256[] memory _lock_ids) external view returns (TokenLock[] memory) {
    require(_lock_ids.length <= MAX_GETTER_LENGTH, 'MAX GET');
    TokenLock[] memory locks = new TokenLock[](_lock_ids.length);
    for (uint256 i = 0; i < _lock_ids.length; i++) {
        locks[i] = getLock(_lock_ids[i]);
    }
    return locks;
    
  }
  
  function getTokenLocksLength (address _token) external view returns (uint256) {
    return TOKEN_VESTING.getTokenLocksLength(_token);
  }
  
  /**
   * @notice Get a paged response of lock ids e.g. [0, 1, 2] for a specific token
   * @param _token the erc20 token address
   * @param _start the start index
   * @param _count number of items to return, maximal value = MAX_GETTER_LENGTH
   */
  function getTokenLocks (address _token, uint256 _start, uint256 _count) external view returns (uint256[] memory) {
    uint256 tlength = TOKEN_VESTING.getTokenLocksLength(_token);
    uint256 clamp = _start + _count > tlength ? tlength - _start : _count;
    // clamp = clamp > MAX_GETTER_LENGTH ? MAX_GETTER_LENGTH : clamp;
    require(clamp <= MAX_GETTER_LENGTH, 'MAX GET');
    uint256[] memory ids = new uint256[](clamp);
    uint256 counter = 0;
    while (counter < clamp) {
        ids[counter] = TOKEN_VESTING.getTokenLockIDAtIndex(_token, _start + counter);
        counter++;
    }
    return ids;
  }
  
  function getLockedTokens (uint256 _start, uint256 _count) external view returns (address[] memory) {
    uint256 tlength = TOKEN_VESTING.getNumLockedTokens();
    uint256 clamp = _start + _count > tlength ? tlength - _start : _count;
    require(clamp <= MAX_GETTER_LENGTH, 'MAX GET');
    
    address[] memory tokens = new address[](clamp);
    for (uint256 i = 0; i < clamp; i++) {
        tokens[i] = TOKEN_VESTING.getTokenAtIndex(_start + i);
    }
    return tokens;
  }
  
  // user functions
  function getUserLockedTokensLength (address _user) external view returns (uint256) {
    return TOKEN_VESTING.getUserLockedTokensLength(_user);
  }
  
  function getUserLockedTokens (address _user, uint256 _start, uint256 _count) external view returns (address[] memory) {
    uint256 tlength = TOKEN_VESTING.getUserLockedTokensLength(_user);
    uint256 clamp = _start + _count > tlength ? tlength - _start : _count;
    require(clamp <= MAX_GETTER_LENGTH, 'MAX GET');
    
    address[] memory tokens = new address[](clamp);
    for (uint256 i = 0; i < clamp; i++) {
        tokens[i] = TOKEN_VESTING.getUserLockedTokenAtIndex(_user, _start + i);
    }
    return tokens;
  }
  
  function getUserLocksForTokenLength (address _user, address _token) external view returns (uint256) {
    return TOKEN_VESTING.getUserLocksForTokenLength(_user, _token);
  }
  
  /**
   * @notice Get a paged response of lock ids e.g. [0, 1, 2] for a specific token
   * @param _user the users address
   * @param _token the erc20 token address
   * @param _start the start index
   * @param _count number of items to return
   */
  function getUserTokenLocks (address _user, address _token, uint256 _start, uint256 _count) external view returns (uint256[] memory) {
    uint256 tlength = TOKEN_VESTING.getUserLocksForTokenLength(_user, _token);
    uint256 clamp = _start + _count > tlength ? tlength - _start : _count;
    require(clamp <= MAX_GETTER_LENGTH, 'MAX GET');
    uint256[] memory ids = new uint256[](clamp);
    uint256 counter = 0;
    while (counter < clamp) {
        ids[counter] = TOKEN_VESTING.getUserLockIDForTokenAtIndex(_user, _token, _start + counter);
        counter++;
    }
    return ids;
  }
}