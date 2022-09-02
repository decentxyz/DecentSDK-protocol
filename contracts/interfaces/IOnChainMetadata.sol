// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOnChainMetadata {
    /// @notice Storage for AudioQuantitative
    struct AudioQuantitativeInfo {
        string key; // C / A# / etc
        uint256 bpm; // 120 / 60 / 100
        uint256 duration; // 240 / 60 / 120
        string audioMimeType; // audio/wav
        uint256 trackNumber; // 1
    }
}
