// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';

import './interfaces/IFeeManager.sol';
import './utils/Splits.sol';
import './utils/Version.sol';

/// @title template NFT contract
contract FeeManager is IFeeManager, Ownable, Splits, Version(1) {

  uint256 public fee;
  uint256 public commissionBPS;

  constructor(uint256 _fee, uint256 _commissionBPS) {
    fee = _fee;
    commissionBPS = _commissionBPS;
  }

  function setFees(uint256 _fee, uint256 _commissionBPS) external {
    fee = _fee;
    commissionBPS = _commissionBPS;
  }

  function calculateFee(uint256 /* salePrice */, uint256 quantity) external view returns (uint256) {
    return fee == 0 ? 0 : fee * quantity;
  }

  function calculateCommission(uint256 salePrice, uint256 quantity) external view returns (uint256) {
    return commissionBPS == 0 ? 0 : (salePrice * commissionBPS / 100_00) * quantity;
  }

  function recipient() external view returns (address) {
    return address(this);
  }

  function withdraw() external onlyOwner {
    if ( splitWallet != address(0) ) {
      revert SplitsAreActive();
    }
    (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
    if ( ! success ) {
      revert  WithdrawFailed();
    }
  }

  receive() external payable { }
}
