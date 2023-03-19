import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNT1155, deployMockERC721, deployContract, theFuture, sortByAddress, base64decode } from "../core";
import { MerkleTree } from "merkletreejs";
const keccak256 = require("keccak256");

const tokenPrice = ethers.utils.parseEther('0.01');

describe("FeeManager", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      sdk: Contract,
      feeManager: Contract,
      nft: Contract,
      fixedFee: BigNumber,
      commissionBPS: BigNumber,
      split: any[];

  describe("constructor()", async () => {
    it("should set the initial parameters for a fee manager", async () => {
      fixedFee = ethers.utils.parseEther('0.0005'); // $1.00 USD in ETH at $2000 USD
      commissionBPS = 10_00; // 10% in BPS
      feeManager = await deployContract('FeeManager',[fixedFee, commissionBPS]);
      expect(await feeManager.fee()).to.equal(fixedFee);
      expect(await feeManager.commissionBPS()).to.equal(commissionBPS);
    });
  });

  describe("setFees()", async () => {
    it("should update the fees for a fee manager", async () => {
      fixedFee = ethers.utils.parseEther('0.0010'); // $2.00 USD in ETH at $2000 USD
      commissionBPS = 5_00; // 5% in BPS
      await feeManager.setFees(fixedFee, commissionBPS);
      expect(await feeManager.fee()).to.equal(fixedFee);
      expect(await feeManager.commissionBPS()).to.equal(commissionBPS);
    });
  });

  describe("calculateFee()", async () => {
    it("should return the caluclated fee, which is presently fixed", async () => {
      // currently fixed rate fee
      expect(await feeManager.calculateFee(tokenPrice)).to.equal(fixedFee);
    });
  });

  describe("calculateCommission()", async () => {
    it("should return the calculated commission", async () => {
      expect(
        await feeManager.calculateCommission(tokenPrice)
      ).to.equal(tokenPrice.mul(commissionBPS).div(100_00));
    });
  });
});
