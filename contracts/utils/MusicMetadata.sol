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
import {IOnChainMetadata} from "../interfaces/IOnChainMetadata.sol";
import {MetadataRenderAdminCheck} from "./MetadataRenderAdminCheck.sol";

contract MusicMetadata is MetadataRenderAdminCheck, IOnChainMetadata {
    mapping(address => SongMetadata) public songMetadatas;

    /// @notice Admin function to update artist
    /// @param target target artist
    /// @param newArtist new artist
    function updateArtist(address target, string memory newArtist)
        external
        requireSenderAdmin(target)
    {
        songMetadatas[target].song.audio.songDetails.artistName = newArtist;

        emit ArtistUpdated({
            target: target,
            sender: msg.sender,
            newArtist: newArtist
        });
    }

    /// @notice Admin function to update losslessAudio
    /// @param target target description
    /// @param _losslessAudio The lossless audio URI of the track
    function updateLosslessAudio(address target, string memory _losslessAudio)
        external
        requireSenderAdmin(target)
    {
        songMetadatas[target].song.audio.losslessAudio = _losslessAudio;

        emit LosslessAudioUpdated({
            target: target,
            sender: msg.sender,
            losslessAudio: _losslessAudio
        });
    }

    /// @notice Admin function to update AudioQuantitative
    /// @param key musical key
    /// @param bpm beats per minute
    /// @param duration length (in seconds)
    /// @param audioMimeType mimeType of the content
    /// @param trackNumber track number in project
    function updateAudioQuantitativeInfo(
        address target,
        string memory key,
        uint256 bpm,
        uint256 duration,
        string memory audioMimeType,
        uint256 trackNumber
    ) external requireSenderAdmin(target) {
        songMetadatas[target]
            .song
            .audio
            .songDetails
            .audioQuantitative = AudioQuantitative({
            key: key,
            bpm: bpm,
            duration: duration,
            audioMimeType: audioMimeType,
            trackNumber: trackNumber
        });

        emit AudioQuantitativeUpdated({
            target: target,
            sender: msg.sender,
            key: key,
            bpm: bpm,
            duration: duration,
            audioMimeType: audioMimeType,
            trackNumber: trackNumber
        });
    }

    /// @notice Admin function to update AudioQuantitative
    /// @param license music licensing
    /// @param externalUrl used in merketplaces like OpenSea / Rarible
    /// @param isrc CC-XXX-YY-NNNNN
    /// @param genre Rock / Pop / Metal / Hip-Hop / Electronic / Classical / Jazz / Folk / Reggae / Other
    /// @param genre track number in project
    function updateAudioQualitative(
        address target,
        string memory license,
        string memory externalUrl,
        string memory isrc,
        string memory genre
    ) external requireSenderAdmin(target) {
        songMetadatas[target]
            .song
            .audio
            .songDetails
            .audioQualitative = AudioQualitative({
            license: license,
            externalUrl: externalUrl,
            isrc: isrc,
            genre: genre
        });

        emit AudioQualitativeUpdated({
            target: target,
            sender: msg.sender,
            license: license,
            externalUrl: externalUrl,
            isrc: isrc,
            genre: genre
        });
    }

    /// @notice Admin function to update Lyrics
    /// @param _lyrics The text of the lyrics
    /// @param _lyricsNft The NFT of the lyrics (caip19)
    function updateLyrics(
        address target,
        string memory _lyrics,
        string memory _lyricsNft
    ) external requireSenderAdmin(target) {
        songMetadatas[target].song.audio.lyrics = Lyrics({
            lyrics: _lyrics,
            lyricsNft: _lyricsNft
        });

        emit LyricsUpdated({
            target: target,
            sender: msg.sender,
            lyrics: _lyrics,
            lyricsNft: _lyricsNft
        });
    }

    /// @notice Admin function to update Artwork
    /// @param artworkUri The uri of the artwork (ipfs://<CID>)
    /// @param artworkMimeType The mime type of the artwork
    /// @param artworkNft The NFT of the artwork (caip19)
    function updateArtwork(
        address target,
        string memory artworkUri,
        string memory artworkMimeType,
        string memory artworkNft
    ) external requireSenderAdmin(target) {
        songMetadatas[target].song.artwork = Artwork({
            artworkUri: artworkUri,
            artworkMimeType: artworkMimeType,
            artworkNft: artworkNft
        });

        emit ArtworkUpdated({
            target: target,
            sender: msg.sender,
            artworkUri: artworkUri,
            artworkMimeType: artworkMimeType,
            artworkNft: artworkNft
        });
    }

    /// @notice Admin function to update Visualizer
    /// @param artworkUri The uri of the artwork (ipfs://<CID>)
    /// @param artworkMimeType The mime type of the artwork
    /// @param artworkNft The NFT of the artwork (caip19)
    function updateVisualizer(
        address target,
        string memory artworkUri,
        string memory artworkMimeType,
        string memory artworkNft
    ) external requireSenderAdmin(target) {
        songMetadatas[target].song.visualizer = Artwork({
            artworkUri: artworkUri,
            artworkMimeType: artworkMimeType,
            artworkNft: artworkNft
        });

        emit VisualizerUpdated({
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
    function updatePublishingData(
        address target,
        string memory title,
        string memory description,
        string memory recordLabel,
        string memory publisher,
        string memory locationCreated,
        string memory releaseDate
    ) external requireSenderAdmin(target) {
        songMetadatas[target].songPublishingData = PublishingData({
            title: title,
            description: description,
            recordLabel: recordLabel,
            publisher: publisher,
            locationCreated: locationCreated,
            releaseDate: releaseDate
        });

        emit PublishingDataUpdated({
            target: target,
            sender: msg.sender,
            title: title,
            description: description,
            recordLabel: recordLabel,
            publisher: publisher,
            locationCreated: locationCreated,
            releaseDate: releaseDate
        });
    }
}
