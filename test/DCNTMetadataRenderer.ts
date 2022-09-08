import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNTMetadataRenderer, deployDCNT721A } from "../core";
import assert from "assert";
import metadata from "./metadata.json";

// nft params
const name = 'Decent';
const symbol = 'DCNT';
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;

// metadataRenderer params
const songMetadata = {
  song: {
    audio: {
      losslessAudio: metadata.animation_url,
      songDetails: {
        artistName: metadata.artist,
        audioQuantitative: {
          key: metadata.key,
          bpm: metadata.bpm,
          duration: metadata.duration,
          audioMimeType: metadata.mimeType,
          trackNumber: metadata.trackNumber,
        },
        audioQualitative: {
          license: metadata.license,
          externalUrl: metadata.external_url,
          isrc: metadata.isrc,
          genre: metadata.genre,
        },
      },
      lyrics: {
        lyrics: metadata.lyrics.text,
        lyricsNft: metadata.lyrics.nft,
      },
    },
    artwork: {
      artworkUri: metadata.artwork.uri,
      artworkMimeType: metadata.artwork.mimeType,
      artworkNft: metadata.artwork.nft,
    },
    visualizer: {
        artworkUri: metadata.visualizer.uri,
        artworkMimeType: metadata.visualizer.mimeType,
        artworkNft: metadata.visualizer.nft,
    },
  },
  songPublishingData: {
    title: metadata.title,
    description: metadata.description,
    recordLabel: metadata.recordLabel,
    publisher: metadata.publisher,
    locationCreated: metadata.locationCreated,
    releaseDate: metadata.originalReleaseDate,
  },
};

const projectMetadata = {
  publishingData: {
    title: metadata.project.title,
    description: metadata.project.description,
    recordLabel: metadata.project.recordLabel,
    publisher: metadata.project.publisher,
    locationCreated: metadata.locationCreated,
    releaseDate: metadata.project.originalReleaseDate,
  },
  artwork: {
    artworkUri: metadata.project.artwork.uri,
    artworkMimeType: metadata.project.artwork.mimeType,
    artworkNft: metadata.project.artwork.nft,
  },
  projectType: metadata.project.type,
  upc: metadata.project.upc,
};

const tags = metadata.tags;
const credits = metadata.credits;

describe("DCNTMetadataRenderer", async () => {
  let owner: SignerWithAddress,
      sdk: Contract,
      nft: Contract,
      metadataRenderer: Contract;

  describe("bulkUpdate()", async () => {
    before(async () => {
      [owner] = await ethers.getSigners();
      sdk = await deployDCNTSDK();
      metadataRenderer = await deployDCNTMetadataRenderer();
    });

    it("should update on chain music metadata for the specified NFT", async () => {
      nft = await deployDCNT721A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase
      );
      await nft.setMetadataRenderer(metadataRenderer.address);
      await metadataRenderer.bulkUpdate(
        nft.address,
        songMetadata,
        projectMetadata,
        tags,
        credits
      );

      const flipTx = await nft.flipSaleState();
      const mintTx = await nft.mint(1, {value: tokenPrice});

      let meta = await nft.tokenURI(0);
      meta = meta.replace('data:application/json;base64,','');
      meta = Buffer.from(meta, 'base64').toString('ascii');
      meta = JSON.parse(meta);

      assert.deepEqual(meta, metadata);
    });
  });
});

/*

// songMetadata

{
  song: {
    audio: {
      losslessAudio:
      songDetails: {
        artistName:
        audioQuantitative: {
          key:
          bpm:
          duration:
          audioMimeType:
          trackNumber:
        }
        audioQualitative: {
          license:
          externalUrl:
          isrc:
          genre:
        }
      }
      lyrics: {
        lyrics:
        lyricsNft:
      }
    }
    artwork: {
      artworkUri:
      artworkMimeType:
      artworkNft:
    }
    visualizer: {
        artworkUri:
        artworkMimeType:
        artworkNft:
    }
  }
  songPublishingData: {
    title:
    description:
    recordLabel:
    publisher:
    locationCreated:
    releaseDate:
  }
}

// projectMetadata

{
  publishingData: {
    title:
    description:
    recordLabel:
    publisher:
    locationCreated:
    releaseDate:
  }
  artwork: {
    artworkUri:
    artworkMimeType:
    artworkNft:
  }
  projectType:
  upc:
}

// tags

['', '', '']

// credits

[
  {
    name:
    collaboratorType:
  }
]

*/