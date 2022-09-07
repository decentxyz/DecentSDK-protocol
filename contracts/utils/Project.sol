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
import {MetadataRenderAdminCheck} from "./MetadataRenderAdminCheck.sol";
import {IOnChainMetadata} from "../interfaces/IOnChainMetadata.sol";

contract Project is MetadataRenderAdminCheck, IOnChainMetadata {
    /// @notice Token information mapping storage
    mapping(address => ProjectMetadata) public projectMetadatas;

    /// @notice Admin function to update Lyrics
    /// @param artworkUri The uri of the artwork (ipfs://<CID>)
    /// @param artworkMimeType The mime type of the artwork
    /// @param artworkNft The NFT of the artwork (caip19)
    function updateProjectArtwork(
        address target,
        string memory artworkUri,
        string memory artworkMimeType,
        string memory artworkNft
    ) external requireSenderAdmin(target) {
        projectMetadatas[target].artwork = Artwork(
            artworkUri,
            artworkMimeType,
            artworkNft
        );

        emit ProjectArtworkUpdated({
            target: target,
            sender: msg.sender,
            artworkUri: artworkUri,
            artworkMimeType: artworkMimeType,
            artworkNft: artworkNft
        });
    }

    /// @notice Admin function to update Lyrics
    /// @param title The uri of the artwork (ipfs://<CID>)
    /// @param description The mime type of the artwork
    /// @param recordLabel The record label of the track
    /// @param publisher The publisher of the track
    /// @param locationCreated The location where the track was created
    /// @param releaseDate The original release date of the track (DateTime ISO8601)
    function updateProjectPublishingData(
        address target,
        string memory title,
        string memory description,
        string memory recordLabel,
        string memory publisher,
        string memory locationCreated,
        string memory releaseDate,
        string memory projectType,
        string memory upc
    ) external requireSenderAdmin(target) {
        projectMetadatas[target].publishingData = PublishingData({
            title: title,
            description: description,
            recordLabel: recordLabel,
            publisher: publisher,
            locationCreated: locationCreated,
            releaseDate: releaseDate
        });
        projectMetadatas[target].projectType = projectType;
        projectMetadatas[target].upc = upc;

        emit ProjectPublishingDataUpdated({
            target: target,
            sender: msg.sender,
            title: title,
            description: description,
            recordLabel: recordLabel,
            publisher: publisher,
            locationCreated: locationCreated,
            releaseDate: releaseDate,
            projectType: projectType,
            upc: upc
        });
    }
}
