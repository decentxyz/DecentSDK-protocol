// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// ============ Imports ============

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockERC721 is ERC721, Ownable {

  uint256 public totalSupply;

  /// ============ Constructor ============

  constructor(
    string memory name,
    string memory symbol
  ) ERC721 (name, symbol) {}

  function mintNft(uint numberOfTokens) public payable {
    for(uint256 i = 0; i < numberOfTokens; i++) {
      _safeMint(msg.sender, totalSupply++);
    }
  }
}