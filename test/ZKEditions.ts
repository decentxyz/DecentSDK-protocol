import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployZKEdition, deployMockERC721, theFuture, sortByAddress, base64decode } from "../core";

const name = 'Decent';
const symbol = 'DCNT';
const hasAdjustableCap = true;
const isSoulbound = false;
const maxTokens = 1;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;
const presaleMerkleRoot = null;
const presaleStart = theFuture.time();
const presaleEnd = theFuture.time();
let saleStart = theFuture.time();
const saleEnd = theFuture.time() + theFuture.oneYear;
const royaltyBPS = 10_00;
const metadataRendererInit = {
  description: "This is the Decent unit test NFT",
  imageURI: "http://localhost/image.jpg",
  animationURI: "http://localhost/song.mp3",
};
const contractURI = "http://localhost/contract/";
const metadataURI = "http://localhost/metadata/";
const tokenGateConfig = {
  tokenAddress: ethers.constants.AddressZero,
  minBalance: 0,
  saleType: 0,
}

describe("ZKEdition", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      nft: Contract,
      metadataRenderer: Contract,
      split: any[],
      parentIP: Contract;

  describe("initialize()", async () => {
    before(async () => {
      [owner] = await ethers.getSigners();
      sdk = await deployDCNTSDK();
      parentIP = await deployMockERC721();
      metadataRenderer = await ethers.getContractAt('DCNTMetadataRenderer', sdk.metadataRenderer());
      await theFuture.reset();
      clone = await deployZKEdition(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig,
        ethers.constants.AddressZero,
        parentIP.address
      );
    });

    it("should have the owner set as the EOA deploying the contract", async () => {
      expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
    });

    it("should initialize state which would otherwise be set in constructor", async () => {
      expect(await clone.name()).to.equal(name);
      expect(await clone.symbol()).to.equal(symbol);
      expect(await clone.hasAdjustableCap()).to.equal(hasAdjustableCap);
      expect(await clone.MAX_TOKENS()).to.equal(maxTokens);
    });

    it("should have the verifier set to zero addres", async () => {
      expect(ethers.utils.getAddress(await clone.zkVerifier())).to.equal(ethers.constants.AddressZero);
    });
  });

  describe("zkClaim()", async () => {
    before(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      const sdk = await deployDCNTSDK();
      nft = await deployZKEdition(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig,
        addr1.address,
        parentIP.address
      );
    });

    it("should mint tokens to the specified recipient", async () => {
      const freshNFT = await deployZKEdition(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig,
        addr1.address,
        parentIP.address
      );

      expect(await freshNFT.balanceOf(addr1.address)).to.equal(0);

      await freshNFT.zkClaim(addr1.address);
      expect(await freshNFT.balanceOf(addr1.address)).to.equal(1);
    });

    it("should prevent a mint which would exceed max supply", async () => {
      await nft.zkClaim(addr1.address)
      await expect(nft.zkClaim(addr1.address)).to.be.revertedWith(
        'Purchase would exceed max supply'
      );
    });
  });
});
