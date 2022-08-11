import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deploySDK, deployCrescendo } from "./shared";

const name = 'Decent';
const symbol = 'DCNT';
const uri = 'http://localhost/{id}.json'
const initialPrice = ethers.utils.parseEther('0.05');
const step1 = ethers.utils.parseEther("0.005");
const step2 = ethers.utils.parseEther("0.05");
const hitch = 20;
const [trNum,trDenom] = [3,20];
const payouts = ethers.constants.AddressZero;

const calculateCurvedBurnReturn = (price: BigNumber) => price.mul(trDenom-trNum).div(trDenom);

describe("DCNTCrescendo", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      crescendo: Contract;

  before(async () => {
    [owner] = await ethers.getSigners();
    sdk = await deploySDK();
    clone = await deployCrescendo(
      sdk,
      name,
      symbol,
      uri,
      initialPrice,
      step1,
      step2,
      hitch,
      trNum,
      trDenom,
      payouts
    );
  });

  describe("initialize()", async () => {
    it("should have the owner set as the EOA deploying the contract", async () => {
      expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
    });

    it("should initialize state which would otherwise be set in constructor", async () => {
      // public state
      expect(await clone.name()).to.equal(name);
      expect(await clone.symbol()).to.equal(symbol);
      expect(await clone.uri(0)).to.equal(uri);
      expect(await clone.payouts()).to.equal(payouts);

      // private state
      const key = ethers.utils.defaultAbiCoder.encode(["uint256","uint256"],[0,12]);
      const slot = ethers.utils.keccak256(key);

      const state = {
        initialPrice: await ethers.provider.getStorageAt(clone.address, slot),
        step1: await ethers.provider.getStorageAt(clone.address, 6),
        step2: await ethers.provider.getStorageAt(clone.address, 7),
        hitch: parseInt(await ethers.provider.getStorageAt(clone.address, 8)),
        trNum: parseInt(await ethers.provider.getStorageAt(clone.address, 9)),
        trDenom: parseInt(await ethers.provider.getStorageAt(clone.address, 10)),
      }

      expect(state.step1).to.equal(step1);
      expect(state.step2).to.equal(step2);
      expect(state.hitch).to.equal(hitch);
      expect(state.trNum).to.equal(trNum);
      expect(state.trDenom).to.equal(trDenom);
      expect(state.initialPrice).to.equal(initialPrice);
    });
  });

  describe("buy()", async () => {
    before(async () => {
      crescendo = await deployCrescendo(
        sdk,
        name,
        symbol,
        uri,
        initialPrice,
        step1,
        step2,
        hitch,
        trNum,
        trDenom,
        payouts
      );
    });

    it("should mint the user an nft", async () => {
      await crescendo.flipSaleState();
      await crescendo.buy(0, { value: initialPrice });
      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(initialPrice.add(step1));
      expect(await crescendo.balanceOf(owner.address,0)).to.equal(1);
    });

    it("should increase the total supply", async () => {
      expect(await crescendo.totalSupply(0)).to.equal(1);
    });

    it("should increase contract balance by price of nft", async () => {
      expect(await ethers.provider.getBalance(crescendo.address)).to.equal(initialPrice);
    });

    it("should increase current price by primary step pre-hitch", async () => {
      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(initialPrice.add(step1));
    });

    it("should increase current price by secondary step post-hitch", async () => {
      let price = initialPrice.add(step1);
      for (let i = 2; i <= hitch; i++) {
        await crescendo.buy(0, { value: price });
        price = price.add(step1);
      }

      const postHitch = initialPrice.add(step1.mul(hitch-1)).add(step2);
      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(postHitch);
    });
  });

  describe("sell()", async () => {
    beforeEach(async () => {
      crescendo = await deployCrescendo(
        sdk,
        name,
        symbol,
        uri,
        initialPrice,
        step1,
        step2,
        hitch,
        trNum,
        trDenom,
        payouts
      );

      await crescendo.flipSaleState();
      await crescendo.buy(0, { value: initialPrice });
    });

    it("should burn a user's nft", async () => {
      expect(await crescendo.balanceOf(owner.address,0)).to.equal(1);
      await crescendo.sell(0);
      expect(await crescendo.balanceOf(owner.address,0)).to.equal(0);
    });

    it("should decrease the total supply", async () => {
      expect(await crescendo.totalSupply(0)).to.equal(1);
      await crescendo.sell(0);
      expect(await crescendo.totalSupply(0)).to.equal(0);
    });

    it("should decrease contract balance by curved burn rate", async () => {
      expect(await ethers.provider.getBalance(crescendo.address)).to.equal(initialPrice);
      await crescendo.sell(0);
      const returned = calculateCurvedBurnReturn(initialPrice.add(step1));
      expect(await ethers.provider.getBalance(crescendo.address)).to.equal(initialPrice.sub(returned));
    });

    it("should decrease current price by primary step pre-hitch", async () => {
      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(initialPrice.add(step1));
      await crescendo.sell(0);
      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(initialPrice);
    });

    it("should decrease current price by secondary step post-hitch", async () => {
      // buy right up to the hitch
      let price = initialPrice.add(step1);
      for (let i = 2; i <= hitch; i++) {
        await crescendo.buy(0, { value: price });
        price = price.add(step1);
      }

      // first purchase after hitch
      const postHitch = initialPrice.add(step1.mul(hitch-1)).add(step2);
      await crescendo.buy(0, { value: postHitch });

      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(postHitch.add(step2));
      await crescendo.sell(0);
      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(postHitch);
    });
  });

});
