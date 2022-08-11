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

describe("DCNTCrescendo", async () => {
  let owner: SignerWithAddress,
      sdk: Contract,
      clone: Contract;

  beforeEach(async () => {
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
});
