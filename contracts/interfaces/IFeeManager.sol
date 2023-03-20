// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFeeManager {

  error SplitsAreActive();

  error WithdrawFailed();

  function setFees(uint256 _fee, uint256 _commissionBPS) external;

  function calculateFee(uint256 salePrice, uint256 quantity) external view returns (uint256);

  function calculateCommission(uint256 salePrice, uint256 quantity) external view returns (uint256);

  function recipient() external view returns (address);

}
