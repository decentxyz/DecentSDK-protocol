// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct EditionConfig {
  string name;
  string symbol;
  bool adjustableCap;
  uint256 maxTokens;
  uint256 tokenPrice;
  uint256 maxTokenPurchase;
  uint256 presaleStart;
  uint256 presaleEnd;
  uint256 saleStart;
  uint256 royaltyBPS;
}
