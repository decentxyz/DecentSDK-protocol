import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNT4907A, theFuture } from "../core";

const name = 'Decent';
const symbol = 'DCNT';
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;

describe("DCNT4907A", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      nft: Contract,
      expiration: number;

  before(async () => {
    [owner] = await ethers.getSigners();
    sdk = await deployDCNTSDK();
    clone = await deployDCNT4907A(
      sdk,
      name,
      symbol,
      maxTokens,
      tokenPrice,
      maxTokenPurchase
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
    });
  });

  describe("setUser()", async () => {
    before(async () => {
      [addr1, addr2] = await ethers.getSigners();
      await clone.flipSaleState();
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
});