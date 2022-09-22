// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct CrescendoConfig {
    uint256 initialPrice;
    uint256 step1;
    uint256 step2;
    uint256 hitch;
    uint256 takeRateBPS;
    uint256 unlockDate;
}
