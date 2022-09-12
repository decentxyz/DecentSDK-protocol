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

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract DCNTRegistry {

  using EnumerableSet for EnumerableSet.AddressSet;

  mapping(address => EnumerableSet.AddressSet) private deployments;

  /// ============ Events ============

  event Registered(address indexed deployer, address indexed deployment);

  /// ============ Constructor ============

  constructor() { }

  /// ============ Functions ============

  function register(address _deployer, address _deployment) external {
    deployments[_deployer].add(_deployment);
  }

  function query(address _deployer) external view returns (address[] memory) {
    return deployments[_deployer].values();
  }
}
