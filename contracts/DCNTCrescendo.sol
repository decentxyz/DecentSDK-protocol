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
import "./utils/CrescendoConfig.sol";
import "./utils/Splits.sol";

/// ========= Bonding Token =========

contract DCNTCrescendo is
  IBondingCurve,
  ERC1155,
  Initializable,
  Ownable,
  Splits
{
  // Token name
  string private _name;

  // Token symbol
  string private _symbol;

  // Token uri
  string private _uri;

  uint256 private step1;
  uint256 private step2;
  uint256 private hitch;
  uint256 private takeRateBPS;
  uint256 public royaltyBPS;

  // id to supply
  mapping(uint256 => uint256) private _totalSupply;
  // id to current price
  mapping(uint256 => uint256) private _currentPrice;

  uint256 private totalWithdrawn = 0;

  bool public saleIsActive = false;

  uint256 public unlockDate;

  // addresses for splits contract and wallet
  address public splitMain;
  address public splitWallet;

  uint256 constant bps = 100_00;

  /// ============ Constructor ============

  function initialize(
    address _owner,
    string memory name_,
    string memory symbol_,
    string memory uri_,
    CrescendoConfig memory _config,
    uint256 _royaltyBPS,
    address _splitMain
  ) public initializer {
    _transferOwnership(_owner);
    _currentPrice[0] = _config.initialPrice;
    step1 = _config.step1;
    step2 = _config.step2;
    hitch = _config.hitch;
    takeRateBPS = _config.takeRateBPS;
    unlockDate = _config.unlockDate;
    _name = name_;
    _symbol = symbol_;
    _setURI(uri_);
    royaltyBPS = _royaltyBPS;
    splitMain = _splitMain;
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

  function buy(uint256 id) external payable {
    require(saleIsActive, "Sale must be active to buy");
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

  function sell(uint256 id) external {
    require(saleIsActive, "Sale must be active to sell");
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
    saleIsActive = !saleIsActive;
  }

  function withdrawFund() external onlyOwner {
    require(block.timestamp >= unlockDate, "Crescendo is still locked");
    require(
      _getSplitWallet() == address(0),
      "Cannot withdraw with an active split"
    );
    payable(msg.sender).transfer(address(this).balance);
  }

  function distributeAndWithdrawFund(
    address account,
    uint256 withdrawETH,
    ERC20[] memory tokens,
    address[] calldata accounts,
    uint32[] calldata percentAllocations,
    uint32 distributorFee,
    address distributorAddress
  ) public virtual requireSplit {
    require(block.timestamp >= unlockDate, "Crescendo is still locked");
    if (withdrawETH != 0) {
      super._transferETHToSplit();
      bytes memory payload = abi.encodeWithSignature(
        "distributeETH(address,address[],uint32[],uint32,address)",
        _getSplitWallet(),
        accounts,
        percentAllocations,
        distributorFee,
        distributorAddress
      );
      (bool success, ) = _getSplitMain().call(payload);
      require(success);
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
      _getSplitWallet() == address(0),
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
  {
    require(block.timestamp >= unlockDate, "Crescendo is still locked");
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
    (bool success, ) = _getSplitWallet().call{value: toWithdraw}("");
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

  function uri(uint256) public view override returns (string memory) {
    return _uri;
  }

  function _setURI(string memory newuri) private {
    _uri = newuri;
  }

  function updateUri(string memory uri_) external onlyOwner {
    _setURI(uri_);
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
