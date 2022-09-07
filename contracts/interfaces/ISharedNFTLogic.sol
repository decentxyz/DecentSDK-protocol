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
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/IOnChainMetadata.sol";

/// Shared NFT logic for rendering metadata associated with editions
/// @dev Can safely be used for generic base64Encode and numberToString functions
contract ISharedNFTLogic is IOnChainMetadata {
    /// @param unencoded bytes to base64-encode
    function base64Encode(bytes memory unencoded)
        public
        pure
        returns (string memory)
    {}

    /// Proxy to openzeppelin's toString function
    /// @param value number to return as a string
    function numberToString(uint256 value)
        public
        pure
        returns (string memory)
    {}

    /// Generate edition metadata from storage information as base64-json blob
    /// Combines the media data and metadata
    /// @param tokenOfEdition Token ID for specific token
    /// @param songMetadata song metadata
    /// @param projectMetadata project metadata
    /// @param credits The credits of the track
    /// @param tags The tags of the track
    function createMetadataEdition(
        uint256 tokenOfEdition,
        SongMetadata memory songMetadata,
        ProjectMetadata memory projectMetadata,
        Credit[] memory credits,
        string[] memory tags
    ) external pure returns (string memory) {}

    /// Function to create the metadata json string for the nft edition
    /// @param name Name of NFT in metadata
    /// @param tokenOfEdition Token ID for specific token
    /// @param songMetadata metadata of the song
    /// @param projectMetadata metadata of the project
    /// @param credits The credits of the track
    /// @param tags The tags of the track
    function createMetadataJSON(
        string memory name,
        uint256 tokenOfEdition,
        SongMetadata memory songMetadata,
        ProjectMetadata memory projectMetadata,
        Credit[] memory credits,
        string[] memory tags
    ) public pure returns (bytes memory) {}

    /// Function to create the metadata json string for the nft edition
    /// @param name Name of NFT in metadata
    /// @param tokenOfEdition Token ID for specific token
    /// @param songMetadata metadata of the song
    /// @param projectMetadata metadata of the project
    /// @param credits The credits of the track
    /// @param tags The tags of the track
    function createMusicMetadataJSON(
        string memory name,
        uint256 tokenOfEdition,
        SongMetadata memory songMetadata,
        ProjectMetadata memory projectMetadata,
        Credit[] memory credits,
        string[] memory tags
    ) public pure returns (bytes memory) {}

    /// Generate edition metadata from storage information as base64-json blob
    /// Combines the media data and metadata
    /// @param name Name of NFT in metadata
    /// @param description Description of NFT in metadata
    /// @param imageUrl URL of image to render for edition
    /// @param animationUrl URL of animation to render for edition
    /// @param tokenOfEdition Token ID for specific token
    function createBaseMetadataEdition(
        string memory name,
        string memory description,
        string memory imageUrl,
        string memory animationUrl,
        uint256 tokenOfEdition
    ) public pure returns (bytes memory) {}

    /// Generates edition metadata from storage information as base64-json blob
    /// Combines the media data and metadata
    /// @param imageUrl URL of image to render for edition
    /// @param animationUrl URL of animation to render for edition
    function tokenMediaData(
        string memory imageUrl,
        string memory animationUrl,
        uint256 tokenOfEdition
    ) public pure returns (string memory) {}

    /// Encodes the argument json bytes into base64-data uri format
    /// @param json Raw json to base64 and turn into a data-uri
    function encodeMetadataJSON(bytes memory json)
        public
        pure
        returns (string memory)
    {}

    function _formatSongMetadata(SongMetadata memory songMetadata)
        internal
        pure
        returns (bytes memory)
    {}

    function _formatProjectMetadata(ProjectMetadata memory _metadata)
        internal
        pure
        returns (bytes memory)
    {}

    function _formatAudio(Audio memory audio)
        internal
        pure
        returns (bytes memory)
    {}

    function _formatSongDetails(SongDetails memory songDetails)
        internal
        pure
        returns (bytes memory)
    {}

    function _formatAudioQuantitative(
        AudioQuantitative memory audioQuantitativeInfo
    ) internal pure returns (bytes memory) {}

    function _formatAudioQualitative(AudioQualitative memory audioQualitative)
        internal
        pure
        returns (bytes memory)
    {}

    function _formatPublishingData(PublishingData memory _data)
        internal
        pure
        returns (bytes memory)
    {}

    function _formatArtwork(string memory _artworkLabel, Artwork memory _data)
        internal
        pure
        returns (bytes memory)
    {}

    function _formatExtras(
        uint256 tokenOfEdition,
        SongMetadata memory songMetadata,
        ProjectMetadata memory projectMetadata,
        string[] memory tags,
        Credit[] memory credits
    ) internal pure returns (bytes memory) {}

    function _formatLyrics(Lyrics memory _data)
        internal
        pure
        returns (bytes memory)
    {}

    function _formatAttributes(
        string memory _label,
        uint256 _tokenOfEdition,
        SongDetails memory _songDetails,
        ProjectMetadata memory _projectMetadata,
        PublishingData memory _publishingData
    ) internal pure returns (bytes memory) {}

    function _getArrayString(string[] memory _array)
        internal
        pure
        returns (string memory)
    {}

    function _getString(string memory _string)
        internal
        pure
        returns (string memory)
    {}

    function _getCollaboratorString(Credit[] memory credits)
        internal
        pure
        returns (string memory)
    {}
}
