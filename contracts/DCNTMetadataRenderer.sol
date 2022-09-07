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
import "./interfaces/IMetadataRenderer.sol";
import {MusicMetadata} from "./utils/MusicMetadata.sol";
import {Project} from "./utils/Project.sol";
import {Credits} from "./utils/Credits.sol";
import {ISharedNFTLogic} from "./interfaces/ISharedNFTLogic.sol";

/// @notice DCNTMetadataRenderer for editions support
contract DCNTMetadataRenderer is
    IMetadataRenderer,
    MusicMetadata,
    Project,
    Credits
{
    /// @notice Token information mapping storage
    mapping(address => string[]) internal trackTags;

    /// @notice Reference to Shared NFT logic library
    ISharedNFTLogic private immutable sharedNFTLogic;

    /// @notice Constructor for library
    /// @param _sharedNFTLogic reference to shared NFT logic library
    constructor(ISharedNFTLogic _sharedNFTLogic) {
        sharedNFTLogic = _sharedNFTLogic;
    }

    /// @notice Admin function to update description
    /// @param target target description
    /// @param tags The tags of the track
    function updateTags(address target, string[] memory tags)
        public
        requireSenderAdmin(target)
    {
        trackTags[target] = tags;

        emit TagsUpdated({target: target, sender: msg.sender, tags: tags});
    }

    /// @notice Contract URI information getter
    /// @return contract uri (if set)
    function contractURI() external view override returns (string memory) {
        address target = msg.sender;
        bytes memory imageSpace = bytes("");
        if (bytes(songMetadatas[target].song.artwork.artworkUri).length > 0) {
            imageSpace = abi.encodePacked(
                '", "image": "',
                songMetadatas[target].song.artwork.artworkUri
            );
        }
        return
            string(
                sharedNFTLogic.encodeMetadataJSON(
                    abi.encodePacked(
                        '{"name": "',
                        songMetadatas[target].songPublishingData.title,
                        '", "description": "',
                        songMetadatas[target].songPublishingData.description,
                        imageSpace,
                        '"}'
                    )
                )
            );
    }

    /// @notice Token URI information getter
    /// @param tokenId to get uri for
    /// @return contract uri (if set)
    function tokenURI(uint256 tokenId)
        external
        view
        override
        returns (string memory)
    {
        address target = msg.sender;

        return tokenURITarget(tokenId, target);
    }

    /// @notice Token URI information getter
    /// @param tokenId to get uri for
    /// @return contract uri (if set)
    function tokenURITarget(uint256 tokenId, address target)
        public
        view
        returns (string memory)
    {
        return
            sharedNFTLogic.createMetadataEdition({
                tokenOfEdition: tokenId,
                songMetadata: songMetadatas[target],
                projectMetadata: projectMetadatas[target],
                credits: credits[target],
                tags: trackTags[target]
            });
    }
}
