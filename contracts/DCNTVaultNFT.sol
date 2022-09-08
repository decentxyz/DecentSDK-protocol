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

import "./interfaces/IDCNTSDK.sol";

contract DCNTVaultNFT {

  /// ============ Immutable storage ============

  /// ============ Mutable storage ============

  /// ============ Events ============

  /// @notice Emitted after successfully deploying a contract
  event Create(address nft, address vault);

  /// ============ Constructor ============

  /// @notice Creates a new DecentVaultWrapped instance
  constructor() { }

  /// ============ Functions ============

  function create(
    address _DCNTSDK,
    string memory _name,
    string memory _symbol,
    uint256 _maxTokens,
    uint256 _tokenPrice,
    uint256 _maxTokenPurchase,
    address _vaultDistributionTokenAddress,
    uint256 _unlockDate,
    bool _supports4907
  ) external returns (address nft, address vault) {
    IDCNTSDK sdk = IDCNTSDK(_DCNTSDK);

    address deployedNFT;
    if ( _supports4907 ) {
      deployedNFT = sdk.deployDCNT4907A(
        _name,
        _symbol,
        _maxTokens,
        _tokenPrice,
        _maxTokenPurchase
      );
    } else {
      deployedNFT = sdk.deployDCNT721A(
        _name,
        _symbol,
        _maxTokens,
        _tokenPrice,
        _maxTokenPurchase
      );
    }

    address deployedVault = sdk.deployDCNTVault(
      _vaultDistributionTokenAddress,
      deployedNFT,
      _maxTokens,
      _unlockDate
    );

    emit Create(deployedNFT, deployedVault);
    return (deployedNFT, deployedVault);
  }
}
