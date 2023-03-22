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

import "solmate/src/tokens/ERC1155.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IBondingCurve.sol";
import "./interfaces/IMetadataRenderer.sol";

import "./storage/CrescendoConfig.sol";
import "./storage/MetadataConfig.sol";
import "./utils/Splits.sol";
import './utils/Version.sol';

/// ========= Bonding Token =========

contract DCNTCrescendo is
  IBondingCurve,
  ERC1155,
  Initializable,
  Ownable,
  Splits,
  Version(3)
{
  // Token name
  string private _name;

  // Token symbol
  string private _symbol;

  // Token uri
  string private _uri;
  string private _contractURI;

  uint256 public step1;
  uint256 public step2;
  uint256 public hitch;
  uint256 public takeRateBPS;
  uint256 public royaltyBPS;

  // id to supply
  mapping(uint256 => uint256) private _totalSupply;
  // id to current price
  mapping(uint256 => uint256) private _currentPrice;

  uint256 public totalWithdrawn = 0;

  uint256 public saleStart;
  bool public saleIsPaused;

  uint256 public unlockDate;

  uint256 constant bps = 100_00;

  /// @notice DCNTMetadataRenderer address
  address public metadataRenderer;

  address public parentIP;
  /// ============ Constructor ============

  function initialize(
    address _owner,
    // string memory name_,
    // string memory symbol_,
    // string memory uri_,
    CrescendoConfig memory _config,
    MetadataConfig memory _metadataConfig,
    address _metadataRenderer
  ) public initializer {
    _transferOwnership(_owner);
    _currentPrice[0] = _config.initialPrice;
    step1 = _config.step1;
    step2 = _config.step2;
    hitch = _config.hitch;
    takeRateBPS = _config.takeRateBPS;
    unlockDate = _config.unlockDate;
    _name = _config.name;
    _symbol = _config.symbol;
    saleStart = _config.saleStart;
    royaltyBPS = _config.royaltyBPS;
    parentIP = _metadataConfig.parentIP;

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
      _setURI(_metadataConfig.metadataURI);
    }
  }

  function calculateCurvedMintReturn(uint256 amount, uint256 id)
    public
    view
    override
    returns (uint256)
  {
    require(amount == 1, "max amount is 1");
    return _currentPrice[id];
  }

  function calculateCurvedBurnReturn(uint256 amount, uint256 id)
    public
    view
    override
    returns (uint256)
  {
    require(amount == 1, "max amount is 1");
    return ((bps - takeRateBPS) * _currentPrice[id]) / bps;
  }

  modifier salesAreActive {
    require(block.timestamp >= saleStart, "Sales are not active yet.");
    require(block.timestamp < unlockDate, "Sales are no longer active.");
    require(! saleIsPaused, "Sale must be active to buy or sell");
    _;
  }

  function saleIsActive() external view returns(bool _saleIsActive) {
    _saleIsActive = (block.timestamp >= saleStart) && (!saleIsPaused);
  }

  /// @notice purchase nft
  function buy(uint256 id) external payable salesAreActive {
    uint256 price = calculateCurvedMintReturn(1, id);
    require(msg.value >= price, "Insufficient funds");
    require(id == 0, "currently only one edition");

    // allow for slippage
    if (msg.value - price > 0) {
      (bool success, ) = payable(msg.sender).call{value: (msg.value - price)}(
        ""
      );
      require(success, "Failed to send ether");
    }

    _mint(msg.sender, id, 1, "");
    _totalSupply[id] += 1;
    emit CurvedMint(msg.sender, 1, id, price);

    // update supply / price
    if (totalSupply(id) < hitch) {
      _currentPrice[id] += step1;
    } else {
      _currentPrice[id] += step2;
    }
  }

  /// @notice sell nft if liquidity is available
  function sell(uint256 id) external salesAreActive {
    require(id == 0, "currently only one edition");
    uint256 price = calculateCurvedBurnReturn(1, id);
    require(balanceOf[msg.sender][id] > 0, "must own nft to sell");

    // burn nft
    _burn(msg.sender, id, 1);
    _totalSupply[id] -= 1;

    // send money to nft holder
    (bool success, ) = payable(msg.sender).call{value: price}("");
    require(success, "Failed to send ether");
    emit CurvedBurn(msg.sender, 1, id, price);

    // update supply / price
    if (totalSupply(id) < hitch) {
      _currentPrice[id] -= step1;
    } else {
      _currentPrice[id] -= step2;
    }
  }

  function totalSupply(uint256 id) public view returns (uint256) {
    return _totalSupply[id];
  }

  function flipSaleState() external onlyOwner {
    saleIsPaused = !saleIsPaused;
  }

  function withdrawFund() external onlyOwner onlyUnlocked {
    require(
      splitWallet == address(0),
      "Cannot withdraw with an active split"
    );
    (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
    require(success, "Could not withdraw fund");
  }

  /// @notice only when crescendo is unlocked
  modifier onlyUnlocked() {
    require(block.timestamp >= unlockDate, "Crescendo is still locked");
    _;
  }

  function distributeAndWithdrawFund(
    address account,
    uint256 withdrawETH,
    ERC20[] memory tokens,
    address[] calldata accounts,
    uint32[] calldata percentAllocations,
    uint32 distributorFee,
    address distributorAddress
  ) public virtual requireSplit onlyUnlocked {
    if (withdrawETH != 0) {
      super._transferETHToSplit();
      ISplitMain(splitMain).distributeETH(
        splitWallet,
        accounts,
        percentAllocations,
        distributorFee,
        distributorAddress
      );
    }

    for (uint256 i = 0; i < tokens.length; ++i) {
      distributeERC20(
        tokens[i],
        accounts,
        percentAllocations,
        distributorFee,
        distributorAddress
      );
    }

    _withdraw(account, withdrawETH, tokens);
  }

  function withdraw() external onlyOwner {
    require(
      splitWallet == address(0),
      "Cannot withdraw with an active split"
    );
    uint256 toWithdraw = liquidity() - totalWithdrawn;
    totalWithdrawn += toWithdraw;
    (bool success, ) = payable(msg.sender).call{value: toWithdraw}("");
    require(success, "Failed to send ether");
  }

  function transferFundToSplit(uint256 transferETH, ERC20[] memory tokens)
    public
    virtual
    requireSplit
    onlyUnlocked
  {
    if (transferETH != 0) {
      super._transferETHToSplit();
    }

    for (uint256 i = 0; i < tokens.length; ++i) {
      _transferERC20ToSplit(tokens[i]);
    }
  }

  function _transferETHToSplit() internal override {
    uint256 toWithdraw = liquidity() - totalWithdrawn;
    totalWithdrawn += toWithdraw;
    (bool success, ) = splitWallet.call{value: toWithdraw}("");
    require(success, "Could not transfer ETH to split");
  }

  function liquidity() public view returns (uint256) {
    return (takeRateBPS * (address(this).balance + totalWithdrawn)) / bps;
  }

  function reserveAmt() public view returns (uint256) {
    return
      ((bps - takeRateBPS) * (address(this).balance + totalWithdrawn)) / bps;
  }

  function name() external view returns (string memory) {
    return _name;
  }

  function symbol() external view returns (string memory) {
    return _symbol;
  }

  function contractURI() public view returns (string memory) {
    if (metadataRenderer != address(0)) {
      return IMetadataRenderer(metadataRenderer).contractURI();
    }
    return _contractURI;
  }

  function updateContractURI(string memory contractURI_) external onlyOwner {
    _contractURI = contractURI_;
  }

  function uri(uint256) public view override returns (string memory) {
    if (metadataRenderer != address(0)) {
      return IMetadataRenderer(metadataRenderer).tokenURI(1);
    }
    return _uri;
  }

  function _setURI(string memory newuri) private {
    _uri = newuri;
  }

  function updateUri(string memory uri_) external onlyOwner {
    _setURI(uri_);
  }

  function setMetadataRenderer(address _metadataRenderer) external onlyOwner {
    metadataRenderer = _metadataRenderer;
  }

  function royaltyInfo(uint256 tokenId, uint256 salePrice)
    external
    view
    returns (address receiver, uint256 royaltyAmount)
  {
    require(tokenId == 0, "currently only one edition");

    if (splitWallet != address(0)) {
      receiver = splitWallet;
    } else {
      receiver = owner();
    }

    uint256 royaltyPayment = (salePrice * royaltyBPS) / bps;

    return (receiver, royaltyPayment);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC1155)
    returns (bool)
  {
    return
      interfaceId == 0x2a55205a || // ERC2981 interface ID for ERC2981.
      super.supportsInterface(interfaceId);
  }
}
