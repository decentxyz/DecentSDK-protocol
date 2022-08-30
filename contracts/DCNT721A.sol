// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
 ______   _______  _______  _______  _       _________
(  __  \ (  ____ \(  ____ \(  ____ \( (    /|\__   __/
| (  \  )| (    \/| (    \/| (    \/|  \  ( |   ) (
| |   ) || (__    | |      | (__    |   \ | |   | |
| |   | ||  __)   | |      |  __)   | (\ \) |   | |
| |   ) || (      | |      | (      | | \   |   | |
| (__/  )| (____/\| (____/\| (____/\| )  \  |   | |
(______/ (_______/(_______/(_______/|/    )_)   )_(

*/


/// ============ Imports ============

import "./erc721a/ERC721A.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


/// @title template NFT contract
contract DCNT721A is ERC721A, Initializable, Ownable {

  /// ============ Immutable storage ============

  /// ============ Mutable storage ============

  uint256 public MAX_TOKENS;
  uint256 public tokenPrice;
  uint256 public maxTokenPurchase;

  bool public saleIsActive = false;
  string public baseURI;

  /// ============ Events ============

  /// @notice Emitted after a successful token claim
  /// @param sender recipient of NFT mint
  /// @param tokenId_ of token minted
  event Minted(address sender, uint256 tokenId_);

  /// ============ Constructor ============

  function initialize(
    address _owner,
    string memory name,
    string memory symbol,
    uint256 _maxTokens,
    uint256 _tokenPrice,
    uint256 _maxTokenPurchase
  )
    public
    initializer
  {
    _transferOwnership(_owner);
    _name = name;
    _symbol = symbol;
    _currentIndex = _startTokenId();
    MAX_TOKENS = _maxTokens;
    tokenPrice = _tokenPrice;
    maxTokenPurchase = _maxTokenPurchase;
  }

  function mint(uint numberOfTokens) external payable {
    uint256 mintIndex = totalSupply();
    require(saleIsActive, "Sale must be active to mint");
    require(mintIndex + numberOfTokens <= MAX_TOKENS, "Purchase would exceed max supply");
    require(mintIndex <= MAX_TOKENS, "SOLD OUT");
    require(numberOfTokens <= maxTokenPurchase, "Exceeded max number per mint");
    require(msg.value >= (tokenPrice * numberOfTokens), "Insufficient funds");

    _safeMint(msg.sender, numberOfTokens);
    for(uint256 i = 0; i < numberOfTokens; i++) {
      emit Minted(msg.sender, mintIndex++);
    }
  }

  function flipSaleState() external onlyOwner {
    saleIsActive = !saleIsActive;
  }

  function withdraw() external onlyOwner {
    payable(msg.sender).transfer(address(this).balance);
  }

  function setBaseURI(string memory uri) external onlyOwner {
    baseURI = uri;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  // save some for creator
  function reserveDCNT(uint256 numReserved) external onlyOwner {
    uint256 supply = totalSupply();
    require(supply + numReserved < MAX_TOKENS, "Purchase would exceed max supply");
    for (uint256 i = 0; i < numReserved; i++) {
      _safeMint(msg.sender, supply + i + 1);
    }
  }
}
