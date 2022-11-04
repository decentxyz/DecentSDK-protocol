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
import "./storage/EditionConfig.sol";
import "./storage/MetadataConfig.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./storage/DCNT721AStorage.sol";
import "./utils/Splits.sol";
import './interfaces/ITokenWithBalance.sol';

/// @title template NFT contract
contract DCNT721A is ERC721A, DCNT721AStorage, Initializable, Ownable, Splits {

  bool public adjustableCap;
  bool public isSoulbound;
  uint256 public MAX_TOKENS;
  uint256 public tokenPrice;
  uint256 public maxTokenPurchase;

  uint256 public saleStart;
  bool public saleIsPaused;
  string public baseURI;
  string private _contractURI;
  address public metadataRenderer;
  uint256 public royaltyBPS;
  uint256 public presaleStart;
  uint256 public presaleEnd;

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
            require(ITokenWithBalance(tokenGateConfig.tokenAddress).balanceOf(msg.sender) >= tokenGateConfig.minBalance, 'do not own required token');
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
    MAX_TOKENS = _editionConfig.maxTokens;
    tokenPrice = _editionConfig.tokenPrice;
    maxTokenPurchase = _editionConfig.maxTokenPurchase;
    saleStart = _editionConfig.saleStart;
    royaltyBPS = _editionConfig.royaltyBPS;
    adjustableCap = _editionConfig.adjustableCap;
    parentIP = _metadataConfig.parentIP;
    splitMain = _splitMain;
    tokenGateConfig = _tokenGateConfig;
    presaleStart = _editionConfig.presaleStart;
    presaleEnd = _editionConfig.presaleEnd;

    if (
      _metadataRenderer != address(0) &&
      _metadataConfig.metadataRendererInit.length > 0
    ) {
      metadataRenderer = _metadataRenderer;
      IMetadataRenderer(_metadataRenderer).initializeWithData(
        _metadataConfig.metadataRendererInit
      );
    } else {
      _contractURI = _metadataConfig.contractURI;
      baseURI = _metadataConfig.metadataURI;
    }
  }

  function mint(uint256 numberOfTokens)
    external
    payable
    verifyTokenGate(false)
  {
    uint256 mintIndex = _nextTokenId();
    require(block.timestamp >= saleStart, "Sales are not active yet.");
    require(!saleIsPaused, "Sale must be active to mint");
    require(
      mintIndex + numberOfTokens <= MAX_TOKENS,
      "Purchase would exceed max supply"
    );
    require(mintIndex <= MAX_TOKENS, "SOLD OUT");
    require(msg.value >= (tokenPrice * numberOfTokens), "Insufficient funds");
    if ( maxTokenPurchase != 0 ) {
      require(numberOfTokens <= maxTokenPurchase, "Exceeded max number per mint");
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
    require(atId + recipients.length <= MAX_TOKENS,
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
    require (block.timestamp >= presaleStart && block.timestamp <= presaleEnd, 'not presale');
    uint256 mintIndex = _nextTokenId();
    require(!saleIsPaused, "Sale must be active to mint");
    require(
      mintIndex + quantity <= MAX_TOKENS,
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
    _saleIsActive = (block.timestamp >= saleStart) && (!saleIsPaused);
  }

  function adjustCap(uint256 newCap) external onlyOwner {
    require(adjustableCap, 'cannot adjust size of this collection');
    require(_nextTokenId() <= newCap, 'cannot decrease cap');
    MAX_TOKENS = newCap;
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

  function setContractURI(string memory uri) external onlyOwner {
    _contractURI = uri;
  }

  function contractURI()
    public
    view
    virtual
    returns (string memory)
  {
    return (metadataRenderer != address(0))
      ? IMetadataRenderer(metadataRenderer).contractURI()
      : _contractURI;
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
      supply + numReserved < MAX_TOKENS,
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

    uint256 royaltyPayment = (salePrice * royaltyBPS) / 10_000;

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
    saleStart = newStart;
  }
}
