// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDCNT721A {
  function mint(uint256 numberOfTokens) external payable;

  function transferFrom(address from, address to, uint256 tokenId) external;

  function totalSupply() external view returns (uint256);
}
