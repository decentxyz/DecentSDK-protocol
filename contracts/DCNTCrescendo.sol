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

/// ========= Bonding Token =========

contract DCNTCrescendo is IBondingCurve, ERC1155, Initializable, Ownable {

  // Token name
  string private _name;

  // Token symbol
  string private _symbol;

  // Token uri
  string private _uri;

  uint256 private step1;
  uint256 private step2;
  uint256 private hitch;
  uint256 private trNum;
  uint256 private trDenom;

  // id to supply
  mapping(uint256 => uint256) private _totalSupply;
  // id to current price
  mapping(uint256 => uint256) private _currentPrice;

  uint256 private totalWithdrawn = 0;

  bool public saleIsActive = false;

  // address for take rate payouts
  address payable public payouts;

  /// ============ Constructor ============

  function initialize(
    address _owner,
    string memory name_,
    string memory symbol_,
    string memory uri_,
    uint256 _initialPrice,
    uint256 _step1,
    uint256 _step2,
    uint256 _hitch,
    uint256 _trNum,
    uint256 _trDenom,
    address payable _payouts
  )
    public
    initializer
  {
    _transferOwnership(_owner);
    payouts = _payouts;
    _currentPrice[0] = _initialPrice;
    step1 = _step1;
    step2 = _step2;
    hitch = _hitch;
    trNum = _trNum;
    trDenom = _trDenom;
    _name = name_;
    _symbol = symbol_;
    _setURI(uri_);
  }

  function calculateCurvedMintReturn(uint256 amount, uint256 id) public view override returns (uint256) {
    require(amount == 1, "max amount is 1");
    return _currentPrice[id];
  }

  function calculateCurvedBurnReturn(uint256 amount, uint256 id) public view override returns (uint256) {
    require(amount == 1, "max amount is 1");
    return (trDenom-trNum)*_currentPrice[id]/trDenom;
  }

  function buy(uint256 id) external payable {
    require(saleIsActive, "Sale must be active to buy");
    uint256 price = calculateCurvedMintReturn(1,id);
    require(msg.value >= price, "Insufficient funds");
    require(id == 0, "currently only one edition");

    // allow for slippage
    if (msg.value - price > 0) {
      (bool success, ) = payable(msg.sender).call{value: (msg.value - price)}("");
      require(success, "Failed to send ether");
    }

    _mint(msg.sender, id, 1, "");
    _totalSupply[id] += 1;
    emit CurvedMint(msg.sender, 1, id, price);

    // update supply / price
    if (totalSupply(id) < hitch){
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
    if (totalSupply(id) < hitch){
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
    payable(msg.sender).transfer(address(this).balance);
  }

  function withdrawDividend() external {
    uint256 toWithdraw = liquidity() - totalWithdrawn;
    totalWithdrawn += toWithdraw;
    (bool success, ) = payouts.call{value: toWithdraw}("");
    require(success, "Failed to send ether");
  }

  function liquidity() public view returns (uint256) {
    return trNum*(address(this).balance + totalWithdrawn) / trDenom;
  }

  function reserveAmt() public view returns (uint256) {
    return (trDenom-trNum)*(address(this).balance + totalWithdrawn) / trDenom;
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
}
