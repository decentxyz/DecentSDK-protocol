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
  address public DCNT721AImplementation;
  address public DCNT4907AImplementation;
  address public DCNTCrescendoImplementation;
  address public DCNTVaultImplementation;
  address public DCNTStakingImplementation;

  /// @notice contracts deployed by DecentSDK proxy factory
  address[] public allDCNT721A;
  address[] public allDCNT4907A;
  address[] public allDCNTCrescendo;
  address[] public allDCNTVault;
  address[] public allDCNTStaking;

  /// ============ Events ============

  /// @notice Emitted after successfully deploying a contract
  event DeployDCNT721A(address DCNT721A);
  event DeployDCNT4907A(address DCNT4907A);
  event DeployDCNTCrescendo(address DCNTCrescendo);
  event DeployDCNTVault(address DCNTVault);
  event DeployDCNTStaking(address DCNTStaking);

  /// ============ Constructor ============

  /// @notice Creates a new DecentSDK instance
  constructor(
    address _DCNT721AImplementation,
    address _DCNT4907AImplementation,
    address _DCNTCrescendoImplementation,
    address _DCNTVaultImplementation,
    address _DCNTStakingImplementation
  ) {
    DCNT721AImplementation = _DCNT721AImplementation;
    DCNT4907AImplementation = _DCNT4907AImplementation;
    DCNTCrescendoImplementation = _DCNTCrescendoImplementation;
    DCNTVaultImplementation = _DCNTVaultImplementation;
    DCNTStakingImplementation = _DCNTStakingImplementation;
  }

  /// ============ Functions ============

  // deploy and initialize an erc721a clone
  function deployDCNT721A(
    string memory _name,
    string memory _symbol,
    uint256 _maxTokens,
    uint256 _tokenPrice,
    uint256 _maxTokenPurchase
  ) external payable {
    address DCNT721AClone = Clones.clone(DCNT721AImplementation);
    (bool success, ) = DCNT721AClone.call{value: msg.value}(
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
    allDCNT721A.push(DCNT721AClone);
    emit DeployDCNT721A(DCNT721AClone);
  }

  // deploy and initialize an erc4907a clone
  function deployDCNT4907A(
    string memory _name,
    string memory _symbol,
    uint256 _maxTokens,
    uint256 _tokenPrice,
    uint256 _maxTokenPurchase
  ) external payable {
    address DCNT4907AClone = Clones.clone(DCNT4907AImplementation);
    (bool success, ) = DCNT4907AClone.call{value: msg.value}(
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
    allDCNT4907A.push(DCNT4907AClone);
    emit DeployDCNT4907A(DCNT4907AClone);
  }

  // deploy and initialize a Crescendo clone
  function deployDCNTCrescendo(
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
    address DCNTCrescendoClone = Clones.clone(DCNTCrescendoImplementation);
    (bool success, ) = DCNTCrescendoClone.call{value: msg.value}(
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
    allDCNTCrescendo.push(DCNTCrescendoClone);
    emit DeployDCNTCrescendo(DCNTCrescendoClone);
  }

  // deploy and initialize a vault wrapper clone
  function deployDCNTVault(
    address _vaultDistributionTokenAddress,
    address _nftVaultKeyAddress,
    uint256 _nftTotalSupply,
    uint256 _unlockDate
  ) external payable {
    address DCNTVaultClone = Clones.clone(DCNTVaultImplementation);
    (bool success, ) = DCNTVaultClone.call{value: msg.value}(
      abi.encodeWithSignature("initialize(address,address,address,uint256,uint256)",
        msg.sender,
        _vaultDistributionTokenAddress,
        _nftVaultKeyAddress,
        _nftTotalSupply,
        _unlockDate
      )
    );
    require(success);
    allDCNTVault.push(DCNTVaultClone);
    emit DeployDCNTVault(DCNTVaultClone);
  }

  // deploy and initialize a vault wrapper clone
  function deployDCNTStaking(
    address _nft,
    address _token,
    uint256 _vaultDuration,
    uint256 _totalSupply
  ) external payable {
    address DCNTStakingClone = Clones.clone(DCNTStakingImplementation);
    (bool success, ) = DCNTStakingClone.call{value: msg.value}(
      abi.encodeWithSignature("initialize(address,address,address,uint256,uint256)",
        msg.sender,
        _nft,
        _token,
        _vaultDuration,
        _totalSupply
      )
    );
    require(success);
    allDCNTStaking.push(DCNTStakingClone);
    emit DeployDCNTStaking(DCNTStakingClone);
  }
}
