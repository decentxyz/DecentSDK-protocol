// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';

import './interfaces/IFeeManager.sol';
import './utils/Splits.sol';
import './utils/Version.sol';

import 'hardhat/console.sol';

/// @title template NFT contract
contract FeeManager is IFeeManager, Ownable, Splits, Version(1) {

  uint256 public fee;
  uint256 public commissionBPS;

  address public splitMain;
  address public splitWallet;

  constructor(uint256 _fee, uint256 _commissionBPS) {
    fee = _fee;
    commissionBPS = _commissionBPS;
  }

  function setFees(uint256 _fee, uint256 _commissionBPS) external {
    fee = _fee;
    commissionBPS = _commissionBPS;
  }

  function calculateFee(uint256) external view returns (uint256) {
    return fee;
  }

  function calculateCommission(uint256 amount) external view returns (uint256) {
    return commissionBPS == 0 ? 0 : amount * commissionBPS / 100_00;
  }

  function recipient() external view returns (address) {
    return address(this);
  }

  receive() external payable { }

  function _getSplitMain() internal virtual override returns (address) {
    return splitMain;
  }

  function _getSplitWallet() internal virtual override returns (address) {
    return splitWallet;
  }

  function _setSplitWallet(address _splitWallet) internal virtual override {
    splitWallet = _splitWallet;
  }
}
