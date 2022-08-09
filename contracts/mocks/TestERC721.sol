// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// ============ Imports ============

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Decentralized Creator Vaults (DCVs)
/// @notice claimable ERC20s for NFT holders after vault expiration
contract TestERC721 is ERC721Enumerable, Ownable {

  /// ============ Constructor ============

  constructor(
    string memory name,
    string memory symbol
  ) ERC721 (name, symbol) {}

  function mintNft(uint numberOfTokens) public payable {
    uint256 mintIndex = totalSupply();
    for(uint256 i = 0; i < numberOfTokens; i++) {
      _safeMint(msg.sender, mintIndex++);
    }
  }
}