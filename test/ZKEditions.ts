import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployZKEdition, deployMockERC721, theFuture, sortByAddress, base64decode } from "../core";

const name = 'Decent';
const symbol = 'DCNT';
const hasAdjustableCap = true;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokens = 1;
const royaltyBPS = 10_00;
const metadataRendererInit = {
  description: "This is the Decent unit test NFT",
  imageURI: "http://localhost/image.jpg",
  animationURI: "http://localhost/song.mp3",
};
const contractURI = "http://localhost/contract/";
const metadataURI = "http://localhost/metadata/";

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
        maxTokens,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        ethers.constants.AddressZero,
        parentIP.address
      );
    });

    it("should have the owner set as the EOA deploying the contract", async () => {
      expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
    });

    it("should have the verifier set to zero addres", async () => {
      expect(ethers.utils.getAddress(await clone.zkVerifier())).to.equal(ethers.constants.AddressZero);
    });

    it("should have the EIP-5553 based parent IP set", async () => {
      expect(await clone.parentIP()).to.equal(parentIP.address);
    });

    it("should optionally allow the EIP-5553 based parent IP to be empty", async () => {
      const nftWithNoParent = await deployZKEdition(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        maxTokens,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        ethers.constants.AddressZero,
      );
      expect(await nftWithNoParent.parentIP()).to.equal(ethers.constants.AddressZero);
    });

    it("should initialize state which would otherwise be set in constructor", async () => {
      expect(await clone.name()).to.equal(name);
      expect(await clone.symbol()).to.equal(symbol);
      expect(await clone.hasAdjustableCap()).to.equal(hasAdjustableCap);
      expect(await clone.MAX_TOKENS()).to.equal(maxTokens);
    });

    it("should initialize the edition with the metadata renderer", async () => {
      const response = await metadataRenderer.tokenURITarget(0, clone.address);
      let decoded = base64decode(response);
      const meta = JSON.parse(decoded);
      expect(meta.name).to.equal(`${name} 0`);
    });

    it("should optionally set the base token URI", async () => {
      clone = await deployZKEdition(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        maxTokens,
        royaltyBPS,
        contractURI,
        metadataURI,
        null,
        ethers.constants.AddressZero,
      );

      expect(await clone.baseURI()).to.equal(metadataURI);
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
        maxTokens,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        addr1.address
      );
    });

    it("should mint tokens to the specified recipient", async () => {
      const freshNFT = await deployZKEdition(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        maxTokens,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        addr1.address
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

    it("should prevent non-verifier from minting an airdrop", async () => {
      await expect(nft.connect(addr2).zkClaim(addr1.address)).to.be.revertedWith(
        'Only zkVerifier can call'
      );
    });
  });

  describe("mintAirdrop()", async () => {
    it("should mint tokens to the specified recipients", async () => {
      const freshNFT = await deployZKEdition(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        4,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        ethers.constants.AddressZero,
      );

      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      expect(await freshNFT.balanceOf(addr1.address)).to.equal(0);
      expect(await freshNFT.balanceOf(addr2.address)).to.equal(0);
      expect(await freshNFT.balanceOf(addr3.address)).to.equal(0);
      expect(await freshNFT.balanceOf(addr4.address)).to.equal(0);

      await freshNFT.mintAirdrop([addr1.address, addr2.address, addr3.address, addr4.address]);
      expect(await freshNFT.balanceOf(addr1.address)).to.equal(1);
      expect(await freshNFT.balanceOf(addr2.address)).to.equal(1);
      expect(await freshNFT.balanceOf(addr3.address)).to.equal(1);
      expect(await freshNFT.balanceOf(addr4.address)).to.equal(1);
    });

    it("should prevent an airdrop which would exceed max supply", async () => {
      await expect(nft.mintAirdrop([addr1.address])).to.be.revertedWith(
        'Purchase would exceed max supply'
      );
    });

    it("should prevent non-owner from minting an airdrop", async () => {
      await expect(nft.connect(addr2).mintAirdrop([])).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });
  });

  describe("adjustCap()", async() => {
    it("should adjust the cap on nfts with an adjustable cap", async () => {
      expect(await nft.MAX_TOKENS()).to.equal(maxTokens);
      await nft.adjustCap(maxTokens*2);
      expect(await nft.MAX_TOKENS()).to.equal(maxTokens*2);
    });

    it("should prevent adjusting the cap on nfts without an adjustable cap", async () => {
      const freshNFT = await deployZKEdition(
        sdk,
        name,
        symbol,
        false,
        maxTokens,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        ethers.constants.AddressZero,
      );

      expect(await freshNFT.MAX_TOKENS()).to.equal(maxTokens);
      await expect(freshNFT.adjustCap(maxTokens*2)).to.be.revertedWith(
        'cannot adjust size of this collection'
      );
      expect(await freshNFT.MAX_TOKENS()).to.equal(maxTokens);
    });
  });

  describe("tokenURI()", async () => {
    it("should return basic on chain matadata rendered as a base64 url", async () => {
      const response = await nft.tokenURI(0);
      const decoded = base64decode(response);
      const meta = JSON.parse(decoded);

      expect(meta.name).to.equal(`${name} 0`);
      expect(meta.description).to.equal(metadataRendererInit.description);
      expect(meta.image).to.equal(`${metadataRendererInit.imageURI}?id=0`);
      expect(meta.animation_url).to.equal(`${metadataRendererInit.animationURI}?id=0`);
    });

    it("should optionally return an off chain matadata url", async () => {
      const freshNFT: Contract = await deployZKEdition(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        maxTokens,
        royaltyBPS,
        contractURI,
        metadataURI,
        null,
        ethers.constants.AddressZero,
      );

      await freshNFT.mintAirdrop([addr1.address]);
      const response = await freshNFT.tokenURI(0);
      expect(response).to.equal(`${metadataURI}0`);
    });
  });

  describe("contractURI()", async () => {
    it("should return basic on chain contract-level matadata rendered as a base64 url", async () => {
      const response = await nft.contractURI();
      const decoded = base64decode(response);
      const meta = JSON.parse(decoded);

      expect(meta.name).to.equal(name);
      expect(meta.description).to.equal(metadataRendererInit.description);
      expect(meta.image).to.equal(metadataRendererInit.imageURI);
    });

    it("should optionally return an off chain matadata url", async () => {
      const freshNFT: Contract = await deployZKEdition(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        maxTokens,
        royaltyBPS,
        contractURI,
        metadataURI,
        null,
        ethers.constants.AddressZero,
      );

      const response = await freshNFT.contractURI();
      expect(response).to.equal(contractURI);
    });
  });

  describe("supportsInterface()", async () => {
    it('should support the interface for ERC2981', async function () {
      expect(await nft.supportsInterface('0x2a55205a')).to.eq(true);
    });
  });

  describe("royaltyInfo()", async () => {
    it('should calculate the royalty for the secondary sale', async function () {
      const royalty = await nft.royaltyInfo(0, tokenPrice);
      expect(royalty.royaltyAmount).to.eq(tokenPrice.div(10_000).mul(royaltyBPS));
    });

    it('should set owner as the receiver, unless there is a split', async function () {
      const freshNFT: Contract = await deployZKEdition(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        maxTokens,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        ethers.constants.AddressZero,
      );

      await freshNFT.mintAirdrop([addr1.address])

      const ownerRoyalty = await freshNFT.royaltyInfo(0, tokenPrice);
      expect(ownerRoyalty.receiver).to.eq(owner.address);

      const payouts = sortByAddress([
        {
          address: addr2.address,
          percent: (1_000_000 / 100) * 90
        },
        {
          address: addr3.address,
          percent: (1_000_000 / 100) * 10
        },
      ]);

      const addresses = payouts.map(payout => payout.address);
      const percents = payouts.map(payout => payout.percent);
      const distributorFee = 0;
      split = [addresses, percents, distributorFee];

      await freshNFT.createSplit(...split);
      const splitRoyalty = await freshNFT.royaltyInfo(0, tokenPrice);
      expect(splitRoyalty.receiver).to.eq(await freshNFT.splitWallet());
    });
  });
});
