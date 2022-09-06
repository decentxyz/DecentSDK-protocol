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
import "./interfaces/IERC721Drop.sol";
import "@openzeppelin/contracts/interfaces/IERC721Metadata.sol";
import {SharedNFTLogic} from "./utils/SharedNFTLogic.sol";
import {MetadataRenderAdminCheck} from "./utils/MetadataRenderAdminCheck.sol";

/// @notice DCNTMetadataRenderer for editions support
contract DCNTMetadataRenderer is IMetadataRenderer, MetadataRenderAdminCheck {
    /// @notice Token information mapping storage
    mapping(address => SongMetadata) public songMetadatas;
    mapping(address => ProjectMetadata) public projectMetadatas;
    mapping(address => string[]) internal trackTags;
    mapping(address => Credit[]) internal credits;

    /// @notice Reference to Shared NFT logic library
    SharedNFTLogic private immutable sharedNFTLogic;

    /// @notice Constructor for library
    /// @param _sharedNFTLogic reference to shared NFT logic library
    constructor(SharedNFTLogic _sharedNFTLogic) {
        sharedNFTLogic = _sharedNFTLogic;
    }

    /// @notice Update media URIs
    /// @param target target for contract to update metadata for
    /// @param imageURI new image uri address
    /// @param animationURI new animation uri address
    function updateMediaURIs(
        address target,
        string memory imageURI,
        string memory animationURI
    ) external requireSenderAdmin(target) {
        songMetadatas[target].song.artwork.artworkUri = imageURI;
        songMetadatas[target].song.audio.losslessAudio = animationURI;
        emit MediaURIsUpdated({
            target: target,
            sender: msg.sender,
            imageURI: imageURI,
            animationURI: animationURI
        });
    }

    /// @notice Admin function to update description
    /// @param target target description
    /// @param newDescription new description
    function updateDescription(address target, string memory newDescription)
        external
        requireSenderAdmin(target)
    {
        songMetadatas[target].songPublishingData.description = newDescription;

        emit DescriptionUpdated({
            target: target,
            sender: msg.sender,
            newDescription: newDescription
        });
    }

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

    /// @notice Admin function to update description
    /// @param target target description
    /// @param tags The tags of the track
    function updateTags(address target, string[] memory tags)
        external
        requireSenderAdmin(target)
    {
        trackTags[target] = tags;

        emit TagsUpdated({target: target, sender: msg.sender, tags: tags});
    }

    /// @notice Admin function to update description
    /// @param target target description
    /// @param _name The name of the credit
    /// @param _collaboratorType The type of the collaborator
    function addCredit(
        address target,
        string memory _name,
        string memory _collaboratorType
    ) external requireSenderAdmin(target) {
        credits[target].push(Credit(_name, _collaboratorType));

        emit CreditAdded({
            target: target,
            sender: msg.sender,
            name: _name,
            collaboratorType: _collaboratorType
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

    /// @notice Default initializer for edition data from a specific contract
    /// @param data data to init with
    function initializeWithData(bytes memory data) external {
        // data format: description, imageURI, animationURI
        (
            string memory description,
            string memory imageURI,
            string memory animationURI
        ) = abi.decode(data, (string, string, string));

        songMetadatas[msg.sender].songPublishingData.description = description;
        songMetadatas[msg.sender].song.audio.losslessAudio = animationURI;
        songMetadatas[msg.sender].song.artwork.artworkUri = imageURI;

        emit EditionInitialized({
            target: msg.sender,
            description: description,
            imageURI: imageURI,
            animationURI: animationURI
        });
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

        IERC721Drop media = IERC721Drop(target);

        uint256 maxSupply = media.saleDetails().maxSupply;

        // For open editions, set max supply to 0 for renderer to remove the edition max number
        // This will be added back on once the open edition is "finalized"
        if (maxSupply == type(uint64).max) {
            maxSupply = 0;
        }

        return
            sharedNFTLogic.createMetadataEdition({
                tokenOfEdition: tokenId,
                editionSize: maxSupply,
                songMetadata: songMetadatas[target],
                projectMetadata: projectMetadatas[target],
                credits: credits[target],
                tags: trackTags[target]
            });
    }

    /// @notice Token URI information getter
    /// @param tokenId to get uri for
    /// @return contract uri (if set)
    function tokenURITarget(uint256 tokenId, address target)
        external
        view
        returns (string memory)
    {
        return
            sharedNFTLogic.createMetadataEdition({
                tokenOfEdition: tokenId,
                editionSize: 0,
                songMetadata: songMetadatas[target],
                projectMetadata: projectMetadatas[target],
                credits: credits[target],
                tags: trackTags[target]
            });
    }

    function songMetadata(address target)
        public
        view
        returns (SongMetadata memory)
    {
        return songMetadatas[target];
    }
}
