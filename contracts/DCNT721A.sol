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
import "./interfaces/IMetadataRenderer.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./storage/DCNT721AStorage.sol";
import "./utils/Splits.sol";
import './interfaces/ITokenWithBalance.sol';

/// @title template NFT contract
contract DCNT721A is ERC721A, DCNT721AStorage, Initializable, Ownable, Splits {

  bool public isSoulbound;
  bool public saleIsPaused;
  string public baseURI;
  address public metadataRenderer;
  address public splitMain;
  address public splitWallet;
  address public parentIP;
  bytes32 private presaleMerkleRoot;

  /// ============ Events ============

  /// @notice Emitted after a successful token claim
  /// @param sender recipient of NFT mint
  /// @param tokenId_ of token minted
  event Minted(address sender, uint256 tokenId_);

  /// ========== Modifier =============

  modifier verifyTokenGate(bool isPresale) {
    if (tokenGateConfig.tokenAddress != address(0)
      && (tokenGateConfig.saleType == SaleType.ALL ||
          isPresale && tokenGateConfig.saleType == SaleType.PRESALE) ||
          !isPresale && tokenGateConfig.saleType == SaleType.PRIMARY) {
            require(
              ITokenWithBalance(tokenGateConfig.tokenAddress).balanceOf(msg.sender) >= tokenGateConfig.minBalance,
              'do not own required token'
            );
    }

    _;
  }

  /// ============ Constructor ============

  function initialize(
    address _owner,
    EditionConfig memory _editionConfig,
    MetadataConfig memory _metadataConfig,
    TokenGateConfig memory _tokenGateConfig,
    address _metadataRenderer,
    address _splitMain
  ) public initializer {
    _transferOwnership(_owner);
    _name = _editionConfig.name;
    _symbol = _editionConfig.symbol;
    _currentIndex = _startTokenId();
    editionConfig.maxTokens = _editionConfig.maxTokens;
    editionConfig.tokenPrice = _editionConfig.tokenPrice;
    editionConfig.maxTokenPurchase = _editionConfig.maxTokenPurchase;
    editionConfig.saleStart = _editionConfig.saleStart;
    editionConfig.royaltyBPS = _editionConfig.royaltyBPS;
    editionConfig.adjustableCap = _editionConfig.adjustableCap;
    splitMain = _splitMain;
    tokenGateConfig = _tokenGateConfig;
    editionConfig.presaleStart = _editionConfig.presaleStart;
    editionConfig.presaleEnd = _editionConfig.presaleEnd;

    if (
      _metadataRenderer != address(0) &&
      _metadataConfig.metadataRendererInit.length > 0
    ) {
      metadataRenderer = _metadataRenderer;
      IMetadataRenderer(_metadataRenderer).initializeWithData(
        _metadataConfig.metadataRendererInit
      );
    } else {
      baseURI = _metadataConfig.metadataURI;
    }
  }

  function mint(uint256 numberOfTokens)
    external
    payable
    verifyTokenGate(false)
  {
    uint256 mintIndex = _nextTokenId();
    require(block.timestamp >= editionConfig.saleStart, "Sales are not active yet.");
    require(!saleIsPaused, "Sale must be active to mint");
    require(
      mintIndex + numberOfTokens <= editionConfig.maxTokens,
      "Purchase would exceed max supply"
    );
    require(mintIndex <= editionConfig.maxTokens, "SOLD OUT");
    require(msg.value >= (editionConfig.tokenPrice * numberOfTokens), "Insufficient funds");
    if ( editionConfig.maxTokenPurchase != 0 ) {
      require(numberOfTokens <= editionConfig.maxTokenPurchase, "Exceeded max number per mint");
    }

    _safeMint(msg.sender, numberOfTokens);
    unchecked {
      for (uint256 i = 0; i < numberOfTokens; i++) {
        emit Minted(msg.sender, mintIndex++);
      }
    }
  }

  // allows the owner to "airdrop" users an NFT
  function mintAirdrop(address[] calldata recipients) external onlyOwner {
    uint256 atId = _nextTokenId();
    uint256 startAt = atId;
    require(atId + recipients.length <= editionConfig.maxTokens,
      "Purchase would exceed max supply"
    );

    unchecked {
      for (
        uint256 endAt = atId + recipients.length;
        atId < endAt;
        atId++
      ) {
        _safeMint(recipients[atId - startAt], 1);
        emit Minted(recipients[atId - startAt], atId);
      }
    }
  }

  function mintPresale(
    uint256 quantity,
    uint256 maxQuantity,
    uint256 pricePerToken,
    bytes32[] calldata merkleProof
  )
    external
    payable
    verifyTokenGate(true)
  {
    require (block.timestamp >= editionConfig.presaleStart && block.timestamp <= editionConfig.presaleEnd, 'not presale');
    uint256 mintIndex = _nextTokenId();
    require(!saleIsPaused, "Sale must be active to mint");
    require(
      mintIndex + quantity <= editionConfig.maxTokens,
      "Purchase would exceed max supply"
    );
    require (MerkleProof.verify(
        merkleProof,
        presaleMerkleRoot,
        keccak256(
          // address, uint256, uint256
          abi.encode(msg.sender,maxQuantity,pricePerToken)
        )
      ), 'not approved');

    require(msg.value >= (pricePerToken * quantity), "Insufficient funds");
    require(balanceOf(msg.sender) + quantity <= maxQuantity, 'minted too many');
    _safeMint(msg.sender, quantity);
    unchecked {
      for (uint256 i = 0; i < quantity; i++) {
        emit Minted(msg.sender, mintIndex++);
      }
    }
  }

  function flipSaleState() external onlyOwner {
    saleIsPaused = !saleIsPaused;
  }

  function saleIsActive() external view returns(bool _saleIsActive) {
    _saleIsActive = (block.timestamp >= editionConfig.saleStart) && (!saleIsPaused);
  }

  function adjustCap(uint256 newCap) external onlyOwner {
    require(editionConfig.adjustableCap, 'cannot adjust size of this collection');
    require(_nextTokenId() <= newCap, 'cannot decrease cap');
    editionConfig.maxTokens = newCap;
  }

  function withdraw() external onlyOwner {
    require(
      _getSplitWallet() == address(0),
      "Cannot withdraw with an active split"
    );
    payable(msg.sender).transfer(address(this).balance);
  }

  function setBaseURI(string memory uri) external onlyOwner {
    baseURI = uri;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  function setMetadataRenderer(address _metadataRenderer) external onlyOwner {
    metadataRenderer = _metadataRenderer;
  }

  function tokenURI(uint256 tokenId)
    public
    view
    virtual
    override
    returns (string memory)
  {
    if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

    if (metadataRenderer != address(0)) {
      return IMetadataRenderer(metadataRenderer).tokenURI(tokenId);
    }
    return super.tokenURI(tokenId);
  }

  // save some for creator
  function reserveDCNT(uint256 numReserved) external onlyOwner {
    uint256 supply = _nextTokenId();
    require(
      supply + numReserved < editionConfig.maxTokens,
      "Purchase would exceed max supply"
    );
    for (uint256 i = 0; i < numReserved; i++) {
      _safeMint(msg.sender, supply + i + 1);
    }
  }

  function royaltyInfo(uint256 tokenId, uint256 salePrice)
    external
    view
    returns (address receiver, uint256 royaltyAmount)
  {
    require(_exists(tokenId), "Nonexistent token");

    if (splitWallet != address(0)) {
      receiver = splitWallet;
    } else {
      receiver = owner();
    }

    uint256 royaltyPayment = (salePrice * editionConfig.royaltyBPS) / 10_000;

    return (receiver, royaltyPayment);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC721A)
    returns (bool)
  {
    return
      interfaceId == 0x2a55205a || // ERC2981 interface ID for ERC2981.
      super.supportsInterface(interfaceId);
  }

  function _getSplitMain() internal virtual override returns (address) {
    return splitMain;
  }

  function _getSplitWallet() internal virtual override returns (address) {
    return splitWallet;
  }

  function _setSplitWallet(address _splitWallet) internal virtual override {
    splitWallet = _splitWallet;
  }

  function updateSaleStart(uint256 newStart) external onlyOwner {
    editionConfig.saleStart = newStart;
  }
}
