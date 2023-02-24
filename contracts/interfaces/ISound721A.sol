// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISound721A {
  function mint(address to, uint256 quantity) external payable;

  function transferFrom(address from, address to, uint256 tokenId) external;

  function totalSupply() external view returns (uint256);
}
