// SPDX-License-Identifier: MIT LICENSE
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

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// could swap out 721Enumerable for 721 but would need to rewrite balanceOf + tokensOfOwner
// import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract DCNTStaking is Initializable, Ownable, ReentrancyGuard, IERC721Receiver {

  uint256 public totalStaked;

  // struct to store a stake's token, owner, and earning values
  struct Stake {
    uint24 tokenId;
    uint48 timestamp;
    address owner;
  }

  event NFTStaked(address owner, uint256 tokenId, uint256 value);
  event NFTUnstaked(address owner, uint256 tokenId, uint256 value);
  event Claimed(address owner, uint256 amount);

  address public nftAddress;
  address public erc20Address;
  uint256 public tokenDecimals;
  uint256 public vaultEnd;

  // maps tokenId to stake
  mapping(uint256 => Stake) public vault;

  function initialize(
    address _owner,
    address _nft,
    address _token,
    uint256 _tokenDecimals,
    uint256 _vaultEnd
  )
    public
    initializer
  {
    _transferOwnership(_owner);
    nftAddress = _nft;
    erc20Address = _token;
    tokenDecimals = _tokenDecimals;
    vaultEnd = _vaultEnd;
  }

  function stake(uint256[] calldata tokenIds) external nonReentrant {
    uint256 tokenId;
    totalStaked += tokenIds.length;
    for (uint256 i; i != tokenIds.length; i++) {
      tokenId = tokenIds[i];
      require(IERC721Enumerable(nftAddress).ownerOf(tokenId) == msg.sender, "not your token");
      require(vault[tokenId].tokenId == 0, "already staked");

      IERC721Enumerable(nftAddress).safeTransferFrom(msg.sender, address(this), tokenId);
      emit NFTStaked(msg.sender, tokenId, block.timestamp);

      vault[tokenId] = Stake({
        owner: msg.sender,
        tokenId: uint24(tokenId),
        timestamp: uint48(min(block.timestamp, vaultEnd))
      });
    }
  }

  function _unstakeMany(address account, uint256[] calldata tokenIds) internal {
    uint256 tokenId;
    totalStaked -= tokenIds.length;
    for (uint256 i; i != tokenIds.length; i++) {
      tokenId = tokenIds[i];
      Stake memory staked = vault[tokenId];
      require(staked.owner == msg.sender, "not an owner");

      delete vault[tokenId];
      emit NFTUnstaked(account, tokenId, block.timestamp);
      IERC721Enumerable(nftAddress).safeTransferFrom(address(this), account, tokenId);
    }
  }

  function claim(uint256[] calldata tokenIds) external nonReentrant {
      _claim(msg.sender, tokenIds, false);
  }

  function claimForAddress(address account, uint256[] calldata tokenIds) external nonReentrant {
      _claim(account, tokenIds, false);
  }

  function unstake(uint256[] calldata tokenIds) external nonReentrant {
      _claim(msg.sender, tokenIds, true);
  }

  function _claim(address account, uint256[] calldata tokenIds, bool _unstake) internal {
    uint256 tokenId;
    uint256 earned = 0;

    for (uint256 i; i != tokenIds.length; i++) {
      tokenId = tokenIds[i];
      Stake memory staked = vault[tokenId];
      require(staked.owner == account, "not an owner");
      uint256 stakedAt = staked.timestamp;
      uint256 currentTime = min(block.timestamp, vaultEnd);

      // staking structure = 16 tokens per day
      earned += 16 * (10**tokenDecimals) * (currentTime - stakedAt) / 1 days;

      vault[tokenId] = Stake({
        owner: account,
        tokenId: uint24(tokenId),
        timestamp: uint48(currentTime)
      });

    }
    if (earned > 0) {
      IERC20(erc20Address).transfer(account, earned);
    }
    if (_unstake) {
      _unstakeMany(account, tokenIds);
    }
    emit Claimed(account, earned);
  }

  function earningInfo(address account, uint256[] calldata tokenIds) external view returns (uint256) {
     uint256 tokenId;
     uint256 earned = 0;

    for (uint256 i; i != tokenIds.length; i++) {
      tokenId = tokenIds[i];
      Stake memory staked = vault[tokenId];
      require(staked.owner == account, "not an owner");
      uint256 stakedAt = staked.timestamp;
      earned += 16 * (10**tokenDecimals) * (min(block.timestamp, vaultEnd) - stakedAt) / 1 days;
    }
    return earned;
  }

  // get number of tokens staked in account
  function balanceOf(address account) external view returns (uint256) {
    uint256 balance = 0;
    uint256 supply = IERC721Enumerable(nftAddress).totalSupply();

    // note DecentNfts are 1-indexed
    for(uint256 i = 1; i <= supply; i++) {
      if (vault[i].owner == account) {
        balance++;
      }
    }
    return balance;
  }

  // return nft tokens staked of owner
  function tokensOfOwner(address account) external view returns (uint256[] memory ownerTokens) {

    uint256 supply = IERC721Enumerable(nftAddress).totalSupply();
    uint256[] memory tmp = new uint256[](supply);

    uint256 index = 0;
    for(uint256 tokenId = 1; tokenId <= supply; tokenId++) {
      if (vault[tokenId].owner == account) {
        tmp[index] = vault[tokenId].tokenId;
        index++;
      }
    }

    uint256[] memory tokens = new uint256[](index);
    for(uint256 i; i != index; i++) {
      tokens[i] = tmp[i];
    }

    return tokens;
  }

  function min(uint256 a, uint256 b) internal pure returns (uint256) {
    return a >= b ? b : a;
}

  function onERC721Received(
      address,
      address,
      // address from,
      uint256,
      bytes calldata
    ) external pure override returns (bytes4) {
      // require(from == address(0x0), "Cannot send nfts to Vault directly");
      return IERC721Receiver.onERC721Received.selector;
  }

  function withdraw(uint256 amount) external onlyOwner {
    IERC20(erc20Address).transfer(address(this), amount);
  }

  // fallback
  fallback() external payable {}

  // receive eth
  receive() external payable {}
}