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
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {IPublicSharedMetadata} from "../interfaces/IPublicSharedMetadata.sol";

/// Shared NFT logic for rendering metadata associated with editions
/// @dev Can safely be used for generic base64Encode and numberToString functions
contract SharedNFTLogic is IPublicSharedMetadata {
    /// @param unencoded bytes to base64-encode
    function base64Encode(bytes memory unencoded)
        public
        pure
        override
        returns (string memory)
    {
        return Base64.encode(unencoded);
    }

    /// Proxy to openzeppelin's toString function
    /// @param value number to return as a string
    function numberToString(uint256 value)
        public
        pure
        override
        returns (string memory)
    {
        return Strings.toString(value);
    }

    /// Generate edition metadata from storage information as base64-json blob
    /// Combines the media data and metadata
    /// @param tokenOfEdition Token ID for specific token
    /// @param editionSize Size of entire edition to show
    /// @param songMetadata song metadata
    /// @param projectMetadata project metadata
    function createMetadataEdition(
        uint256 tokenOfEdition,
        uint256 editionSize,
        SongMetadata memory songMetadata,
        ProjectMetadata memory projectMetadata,
        Credit[] memory credits,
        string[] memory tags
    ) external pure returns (string memory) {
        bytes memory json = createMetadataJSON(
            songMetadata.songPublishingData.title,
            tokenOfEdition,
            editionSize,
            songMetadata,
            projectMetadata,
            credits,
            tags
        );
        return encodeMetadataJSON(json);
    }

    /// Function to create the metadata json string for the nft edition
    /// @param name Name of NFT in metadata
    /// @param tokenOfEdition Token ID for specific token
    /// @param editionSize Size of entire edition to show
    /// @param songMetadata metadata of the song
    function createMetadataJSON(
        string memory name,
        uint256 tokenOfEdition,
        uint256 editionSize,
        SongMetadata memory songMetadata,
        ProjectMetadata memory projectMetadata,
        Credit[] memory credits,
        string[] memory tags
    ) public pure returns (bytes memory) {
        bytes memory editionSizeText;
        if (editionSize > 0) {
            editionSizeText = abi.encodePacked(
                "/",
                numberToString(editionSize)
            );
        }
        bytes memory songMetadataFormatted = _formatSongMetadata(songMetadata);
        ProjectMetadata memory projectMetadata = ProjectMetadata(
            songMetadata.songPublishingData,
            songMetadata.song.artwork,
            "single",
            "upc"
        );
        return
            abi.encodePacked(
                '{"version": "0.1", "name": "',
                name,
                " ",
                numberToString(editionSize),
                editionSizeText,
                '",',
                songMetadataFormatted,
                ", ",
                _formatProjectMetadata(projectMetadata),
                ", ",
                _formatExtras(
                    tokenOfEdition,
                    songMetadata,
                    projectMetadata,
                    tags,
                    credits
                ),
                "}"
            );
    }

    /// Encodes the argument json bytes into base64-data uri format
    /// @param json Raw json to base64 and turn into a data-uri
    function encodeMetadataJSON(bytes memory json)
        public
        pure
        override
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    base64Encode(json)
                )
            );
    }

    function _formatSongMetadata(SongMetadata memory songMetadata)
        internal
        pure
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                _formatAudio(songMetadata.song.audio),
                ",",
                _formatPublishingData(songMetadata.songPublishingData),
                ",",
                _formatArtwork("artwork", songMetadata.song.artwork),
                ",",
                _formatArtwork("visualizer", songMetadata.song.visualizer),
                ",",
                _formatLyrics(songMetadata.song.audio.lyrics),
                ',"image":"',
                songMetadata.song.artwork.artworkUri,
                '"'
            );
    }

    function _formatProjectMetadata(ProjectMetadata memory _metadata)
        internal
        pure
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                '"project": {',
                '"title": "',
                _metadata.publishingData.title,
                '", "description": "',
                _metadata.publishingData.description,
                '", "type": "',
                _metadata.projectType,
                '", "originalReleaseDate": "',
                _metadata.publishingData.releaseDate,
                '", "recordLabel": "',
                _metadata.publishingData.recordLabel,
                '", "publisher": "',
                _metadata.publishingData.publisher,
                '", "upc": "',
                _metadata.upc,
                '",',
                _formatArtwork("artwork", _metadata.artwork),
                "}"
            );
    }

    function _formatAudio(Audio memory audio)
        internal
        pure
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                '"losslessAudio": "',
                audio.losslessAudio,
                '","animation_url": "',
                audio.losslessAudio,
                '",',
                _formatSongDetails(audio.songDetails)
            );
    }

    function _formatSongDetails(SongDetails memory songDetails)
        internal
        pure
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                '"artist": "',
                songDetails.artistName,
                '",',
                _formatAudioQuantitative(songDetails.audioQuantitative),
                ",",
                _formatAudioQualitative(songDetails.audioQualitative)
            );
    }

    function _formatAudioQuantitative(
        AudioQuantitative memory audioQuantitativeInfo
    ) internal pure returns (bytes memory) {
        return
            abi.encodePacked(
                '"key": "',
                audioQuantitativeInfo.key,
                '", "bpm": ',
                numberToString(audioQuantitativeInfo.bpm),
                ', "duration": ',
                numberToString(audioQuantitativeInfo.duration),
                ', "mimeType": "',
                audioQuantitativeInfo.audioMimeType,
                '", "trackNumber": ',
                numberToString(audioQuantitativeInfo.trackNumber)
            );
    }

    function _formatAudioQualitative(AudioQualitative memory audioQualitative)
        internal
        pure
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                '"license": "',
                audioQualitative.license,
                '", "external_url": "',
                audioQualitative.externalUrl,
                '", "isrc": "',
                audioQualitative.isrc,
                '", "genre": "',
                audioQualitative.genre,
                '"'
            );
    }

    function _formatPublishingData(PublishingData memory _data)
        internal
        pure
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                '"title": "',
                _data.title,
                '", "description": "',
                _data.description,
                '", "recordLabel": "',
                _data.recordLabel,
                '", "publisher": "',
                _data.publisher,
                '", "locationCreated": "',
                _data.locationCreated,
                '", "originalReleaseDate": "',
                _data.releaseDate,
                '", "name": "',
                _data.title,
                '"'
            );
    }

    function _formatArtwork(string memory _artworkLabel, Artwork memory _data)
        internal
        pure
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                '"',
                _artworkLabel,
                '": {',
                '"uri": "',
                _data.artworkUri,
                '", "mimeType": "',
                _data.artworkMimeType,
                '", "nft": "',
                _data.artworkNft,
                '"}'
            );
    }

    function _formatExtras(
        uint256 tokenOfEdition,
        SongMetadata memory songMetadata,
        ProjectMetadata memory projectMetadata,
        string[] memory tags,
        Credit[] memory credits
    ) internal pure returns (bytes memory) {
        return
            abi.encodePacked(
                _formatAttributes(
                    "attributes",
                    tokenOfEdition,
                    songMetadata.song.audio.songDetails,
                    projectMetadata,
                    songMetadata.songPublishingData
                ),
                ", ",
                _formatAttributes(
                    "properties",
                    tokenOfEdition,
                    songMetadata.song.audio.songDetails,
                    projectMetadata,
                    songMetadata.songPublishingData
                ),
                ',"tags":',
                _getArrayString(tags),
                ', "credits": ',
                _getCollaboratorString(credits)
            );
    }

    function _formatLyrics(Lyrics memory _data)
        internal
        pure
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                '"lyrics": {',
                '"text": "',
                _data.lyrics,
                '", "nft": "',
                _data.lyricsNft,
                '"}'
            );
    }

    function _formatAttributes(
        string memory _label,
        uint256 _tokenOfEdition,
        SongDetails memory _songDetails,
        ProjectMetadata memory _projectMetadata,
        PublishingData memory _publishingData
    ) internal pure returns (bytes memory) {
        AudioQuantitative memory _audioQuantitative = _songDetails
            .audioQuantitative;
        AudioQualitative memory _audioQualitative = _songDetails
            .audioQualitative;
        return
            abi.encodePacked(
                '"',
                _label,
                '": {"number": ',
                numberToString(_tokenOfEdition),
                ', "bpm": ',
                numberToString(_audioQuantitative.bpm),
                ', "key": "',
                _audioQuantitative.key,
                '", "genre": "',
                _audioQualitative.genre,
                '", "project": "',
                _projectMetadata.publishingData.title,
                '", "artist": "',
                _songDetails.artistName,
                '", "recordLabel": "',
                _publishingData.recordLabel,
                '", "license": "',
                _audioQualitative.license,
                '"}'
            );
    }

    function _getArrayString(string[] memory _array)
        internal
        pure
        returns (string memory)
    {
        string memory _string = "[";
        for (uint256 i = 0; i < _array.length; i++) {
            _string = string(abi.encodePacked(_string, _getString(_array[i])));
            if (i < _array.length - 1) {
                _string = string(abi.encodePacked(_string, ","));
            }
        }
        _string = string(abi.encodePacked(_string, "]"));
        return _string;
    }

    function _getString(string memory _string)
        internal
        pure
        returns (string memory)
    {
        return string(abi.encodePacked('"', _string, '"'));
    }

    function _getCollaboratorString(Credit[] memory credits)
        internal
        pure
        returns (string memory)
    {
        string memory _string = "[";
        for (uint256 i = 0; i < credits.length; i++) {
            _string = string(abi.encodePacked(_string, '{"name":'));
            _string = string(
                abi.encodePacked(_string, _getString(credits[i].name))
            );
            _string = string(abi.encodePacked(_string, ',"collaboratorType":'));
            _string = string(
                abi.encodePacked(
                    _string,
                    _getString(credits[i].collaboratorType),
                    "}"
                )
            );
            if (i < credits.length - 1) {
                _string = string(abi.encodePacked(_string, ","));
            }
        }
        _string = string(abi.encodePacked(_string, "]"));
        return _string;
    }
}
