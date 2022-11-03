// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './EditionConfig.sol';
import './MetadataConfig.sol';
import './TokenGateConfig.sol';

contract DCNT721AStorage {
  // everything needed related the to token
  EditionConfig public editionConfig;

  // token data
  // MetadataConfig public metadataConfig;

  // token gating
  TokenGateConfig public tokenGateConfig;

  /// potential presale mints
  // mapping(address => uint256) public presaleMintsByAddress;
}