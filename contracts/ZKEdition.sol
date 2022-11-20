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
import "./storage/ZKEditionConfig.sol";
import "./storage/MetadataConfig.sol";
import "./storage/DCNT721AStorage.sol";
import "./utils/Splits.sol";

/// @title template NFT contract
contract ZKEdition is ERC721A, DCNT721AStorage, Initializable, Ownable, Splits {

  bool public hasAdjustableCap;
  uint256 public MAX_TOKENS;

  string public baseURI;
  string private _contractURI;
  address public metadataRenderer;
  uint256 public royaltyBPS;

  address public splitMain;
  address public splitWallet;
  address public parentIP;

  address public zkVerifier;

  /// ============ Events ============

  /// @notice Emitted after a successful token claim
  /// @param sender recipient of NFT mint
  /// @param tokenId_ of token minted
  event Minted(address sender, uint256 tokenId_);

  /// ============ Constructor ============

  function initialize(
    address _owner,
    ZKEditionConfig memory _editionConfig,
    MetadataConfig memory _metadataConfig,
    address _metadataRenderer,
    address _splitMain,
    address _zkVerifier
  ) public initializer {
    _transferOwnership(_owner);
    _name = _editionConfig.name;
    _symbol = _editionConfig.symbol;
    _currentIndex = _startTokenId();
    MAX_TOKENS = _editionConfig.maxTokens;
    royaltyBPS = _editionConfig.royaltyBPS;
    hasAdjustableCap = _editionConfig.hasAdjustableCap;
    parentIP = _metadataConfig.parentIP;
    splitMain = _splitMain;

    zkVerifier = _zkVerifier;

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

  /// @notice allows someone to claim an nft with a valid zk proof
  function zkClaim(address recipient) external {
    require(msg.sender == zkVerifier, "Only zkVerifier can call");
    uint256 mintIndex = _nextTokenId();
    require(
      mintIndex + 1 <= MAX_TOKENS,
      "Purchase would exceed max supply"
    );

    _safeMint(recipient, 1);
    emit Minted(recipient, mintIndex);
  }

  /// @notice allows the owner to "airdrop" users an NFT
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

  ///change maximum number of tokens available to mint
  function adjustCap(uint256 newCap) external onlyOwner {
    require(hasAdjustableCap, 'cannot adjust size of this collection');
    require(_nextTokenId() <= newCap, 'cannot decrease cap');
    MAX_TOKENS = newCap;
  }

  function setZKVerifier(address _zkVerifier) external onlyOwner {
    zkVerifier = _zkVerifier;
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

  /// @notice update the contract URI
  function setContractURI(string memory uri) external onlyOwner {
    _contractURI = uri;
  }

  /// @notice view the current contract URI
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

  /// @notice view the token URI for a given tokenId
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

  /// @notice save some for creator
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
}
