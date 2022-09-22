// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IOnChainMetadata} from "../interfaces/IOnChainMetadata.sol";

interface IMetadataRenderer is IOnChainMetadata {
    function tokenURI(uint256) external view returns (string memory);

    function contractURI() external view returns (string memory);

    function initializeWithData(bytes memory initData) external;

    function bulkUpdate(
        address target,
        SongMetadata memory _songMetadata,
        ProjectMetadata memory _projectMetadata,
        string[] memory _tags,
        Credit[] calldata _credits
    ) external;

    /// @notice Storage for token edition information
    struct TokenEditionInfo {
        string description;
        string imageURI;
        string animationURI;
    }
}
