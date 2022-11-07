import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNT4907A, theFuture, deployMockERC721 } from "../core";

const name = 'Decent';
const symbol = 'DCNT';
const adjustableCap = false;
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;
const presaleStart = theFuture.time();
const presaleEnd = theFuture.time();
const saleStart = theFuture.time();
const royaltyBPS = 10_00;
const contractURI = "http://localhost/contract/";
const metadataURI = "http://localhost/metadata/";
const metadataRendererInit = null;
const tokenGateConfig = null;

describe("DCNT4907A", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      nft: Contract,
      expiration: number,
      parentIP: Contract;

  before(async () => {
    [owner] = await ethers.getSigners();
    sdk = await deployDCNTSDK();
    parentIP = await deployMockERC721()
    clone = await deployDCNT4907A(
      sdk,
      name,
      symbol,
      adjustableCap,
      maxTokens,
      tokenPrice,
      maxTokenPurchase,
      presaleStart,
      presaleEnd,
      saleStart,
      royaltyBPS,
      contractURI,
      metadataURI,
      metadataRendererInit,
      tokenGateConfig,
      parentIP.address
    );
  });

  describe("initialize()", async () => {
    it("should have the owner set as the EOA deploying the contract", async () => {
      expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
    });

    it("should initialize state which would otherwise be set in constructor", async () => {
      expect(await clone.name()).to.equal(name);
      expect(await clone.symbol()).to.equal(symbol);
      expect(await clone.MAX_TOKENS()).to.equal(maxTokens);
      expect(await clone.tokenPrice()).to.equal(tokenPrice);
      expect(await clone.maxTokenPurchase()).to.equal(maxTokenPurchase);
      expect(await clone.parentIP()).to.equal(parentIP.address);
    });
  });

  describe("setUser()", async () => {
    before(async () => {
      [addr1, addr2] = await ethers.getSigners();
      await clone.mint(1, { value: tokenPrice });
      expiration = theFuture.time() + theFuture.oneDay;
      await clone.setUser(0, addr2.address, expiration);
    });

    it("should set user to the intended account", async () => {
      expect(ethers.utils.getAddress(await clone.userOf(0))).to.equal(addr2.address);
    });

    it("should set expiration to the intended timestamp", async () => {
      expect(await clone.userExpires(0)).to.equal(expiration);
    });
  });

  describe("userOf()", async () => {
    before(async () => {
      [addr1, addr2, addr3] = await ethers.getSigners();
      await clone.setUser(0, addr3.address, expiration);
    });

    it("should return the current user", async () => {
      expect(ethers.utils.getAddress(await clone.userOf(0))).to.equal(addr3.address);
    });

    it("should return zero address after expiration", async () => {
      await theFuture.travel(theFuture.oneDay + 1);
      await theFuture.arrive();
      expect(await clone.userOf(0)).to.equal(ethers.constants.AddressZero);
    });
  });

  describe("userExpires()", async () => {
    before(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      expiration = theFuture.time() + theFuture.oneMonth;
      await clone.setUser(0, addr4.address, expiration);
    });

    it("should return the expiration timestamp", async () => {
      expect(await clone.userExpires(0)).to.equal(expiration);
    });
  });

  describe("supportsInterface()", async () => {
    it('should support the interface for ERC4907', async function () {
      expect(await clone.supportsInterface('0xad092b5c')).to.eq(true);
    });

    it('should support the interface for ERC2981', async function () {
      expect(await clone.supportsInterface('0x2a55205a')).to.eq(true);
    });
  });

  describe("royaltyInfo()", async () => {
    it('should calculate the royalty for the secondary sale', async function () {
      const royalty = await clone.royaltyInfo(0, tokenPrice);
      expect(royalty.royaltyAmount).to.eq(tokenPrice.div(10_000).mul(royaltyBPS));
    });

    it('should set owner as the receiver, unless there is a split', async function () {
      const ownerRoyalty = await clone.royaltyInfo(0, tokenPrice);
      expect(ownerRoyalty.receiver).to.eq(owner.address);

      // await nft.createSplit(...split);
      // const splitRoyalty = await nft.royaltyInfo(0, tokenPrice);
      // expect(splitRoyalty.receiver).to.eq(await nft.splitWallet());
    });
  });
});
