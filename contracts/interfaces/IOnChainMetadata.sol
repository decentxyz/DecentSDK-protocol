// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOnChainMetadata {
    /// @notice AudioQuantitativeUpdated updated for this edition
    /// @dev admin function indexer feedback
    event AudioQuantitativeUpdated(
        address indexed target,
        address sender,
        string key,
        uint256 bpm,
        uint256 duration,
        string audioMimeType,
        uint256 trackNumber
    );

    /// @notice Storage for AudioQuantitative
    struct AudioQuantitativeInfo {
        string key; // C / A# / etc
        uint256 bpm; // 120 / 60 / 100
        uint256 duration; // 240 / 60 / 120
        string audioMimeType; // audio/wav
        uint256 trackNumber; // 1
    }
}
