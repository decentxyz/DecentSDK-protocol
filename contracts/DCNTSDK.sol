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

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract DCNTSDK is Ownable {

  /// ============ Immutable storage ============

  /// ============ Mutable storage ============

  /// @notice implementation addresses for base contracts
  address public nftImplementation;
  address public crescendoImplementation;
  address public vaultImplementation;
  address public stakingImplementation;

  /// @notice contracts deployed by DecentSDK proxy factory
  address[] public allNFTs;
  address[] public allCrescendos;
  address[] public allVaults;
  address[] public allStaking;

  /// ============ Events ============

  /// @notice Emitted after successfully deploying a contract
  event NewNFT(address nft);
  event NewCrescendo(address crescendo);
  event NewVault(address vault);
  event NewStaking(address staking);

  /// ============ Constructor ============

  /// @notice Creates a new DecentSDK instance
  constructor(
    address _nftImplementation,
    address _crescendoImplementation,
    address _vaultImplementation,
    address _stakingImplementation
  ) {
    nftImplementation = _nftImplementation;
    crescendoImplementation = _crescendoImplementation;
    vaultImplementation = _vaultImplementation;
    stakingImplementation = _stakingImplementation;
  }

  /// ============ Functions ============

  // deploy and initialize an erc721a clone
  function deploy721A(
    string memory _name,
    string memory _symbol,
    uint256 _maxTokens,
    uint256 _tokenPrice,
    uint256 _maxTokenPurchase
  ) external payable {
    address nftInstance = Clones.clone(nftImplementation);
    (bool success, ) = nftInstance.call{value: msg.value}(
      abi.encodeWithSignature(
        "initialize(address,string,string,uint256,uint256,uint256)",
        msg.sender,
        _name,
        _symbol,
        _maxTokens,
        _tokenPrice,
        _maxTokenPurchase
      )
    );
    require(success);
    allNFTs.push(nftInstance);
    emit NewNFT(nftInstance);
  }

  // deploy and initialize a Crescendo clone
  function deployCrescendo(
    string memory _name,
    string memory _symbol,
    string memory _uri,
    uint256 _initialPrice,
    uint256 _step1,
    uint256 _step2,
    uint256 _hitch,
    uint256 _trNum,
    uint256 _trDenom,
    address payable _payouts
  ) external payable {
    address crescendoInstance = Clones.clone(crescendoImplementation);
    (bool success, ) = crescendoInstance.call{value: msg.value}(
      abi.encodeWithSignature(
        "initialize(address,string,string,string,uint256,uint256,uint256,uint256,uint256,uint256,address)",
        msg.sender,
        _name,
        _symbol,
        _uri,
        _initialPrice,
        _step1,
        _step2,
        _hitch,
        _trNum,
        _trDenom,
        _payouts
      )
    );
    require(success);
    allCrescendos.push(crescendoInstance);
    emit NewCrescendo(crescendoInstance);
  }

  // deploy and initialize a vault wrapper clone
  function deployVault(
    address _vaultDistributionTokenAddress,
    address _nftVaultKeyAddress,
    uint256 _nftTotalSupply,
    uint256 _unlockDate
  ) external payable {
    address vaultInstance = Clones.clone(vaultImplementation);
    (bool success, ) = vaultInstance.call{value: msg.value}(
      abi.encodeWithSignature("initialize(address,address,address,uint256,uint256)",
        msg.sender,
        _vaultDistributionTokenAddress,
        _nftVaultKeyAddress,
        _nftTotalSupply,
        _unlockDate
      )
    );
    require(success);
    allVaults.push(vaultInstance);
    emit NewVault(vaultInstance);
  }

  // deploy and initialize a vault wrapper clone
  function deployStaking(
    address _nft,
    address _token,
    uint256 _vaultDuration
  ) external payable {
    address stakingInstance = Clones.clone(stakingImplementation);
    (bool success, ) = stakingInstance.call{value: msg.value}(
      abi.encodeWithSignature("initialize(address,address,address,uint256)",
        msg.sender,
        _nft,
        _token,
        _vaultDuration
      )
    );
    require(success);
    allStaking.push(stakingInstance);
    emit NewStaking(stakingInstance);
  }
}
