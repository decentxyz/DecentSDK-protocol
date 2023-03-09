// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './TokenGateConfig.sol';

struct SeriesConfig {
  string name;
  string symbol;
  string contractURI;
  string metadataURI;
  uint256 royaltyBPS;
  address payoutAddress;
  bool isSoulbound;
}

struct Droplet {
  bool hasAdjustableCap;
  uint256 maxTokens;
  uint256 tokenPrice;
  uint256 maxTokensPerOwner;
  bytes32 presaleMerkleRoot;
  uint256 presaleStart;
  uint256 presaleEnd;
  uint256 saleStart;
  uint256 saleEnd;
  TokenGateConfig tokenGate;
}
