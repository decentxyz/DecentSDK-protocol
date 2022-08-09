import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deploySDK, deploy721A } from "./shared";

const name = 'Decent';
const symbol = 'DCNT';
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;

describe("DCNT721A contract", () => {
  let owner: SignerWithAddress,
      sdk: Contract,
      clone: Contract;

  describe("basic tests", () => {
    beforeEach(async () => {
      [owner] = await ethers.getSigners();
      sdk = await deploySDK();
      clone = await deploy721A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase
      );
    });

    describe("DCNT721A clones", async () => {
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
  });
});
