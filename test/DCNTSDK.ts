import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  deployDCNTSDK,
  deployImplementations,
  deployDCNT721A,
  deployDCNT4907A,
  deployDCNTCrescendo,
  deployDCNTVault,
  deployDCNTStaking,
  theFuture
} from "../core";

describe("DCNTSDK", async () => {
  let owner: SignerWithAddress,
      implementations: any,
      sdk: Contract,
      clone: Contract;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    implementations = await deployImplementations();
    sdk = await deployDCNTSDK(implementations);
  });

  describe("constructor()", async () => {
    it("should store the DCNT721A implementation address on the sdk", async () => {
      expect(await sdk.DCNT721AImplementation()).to.equal(implementations.DCNT721A.address);
    });

    it("should store the DCNT4907A implementation address on the sdk", async () => {
      expect(await sdk.DCNT4907AImplementation()).to.equal(implementations.DCNT4907A.address);
    });

    it("should store the DCNTCrescendo implementation address on the sdk", async () => {
      expect(await sdk.DCNTCrescendoImplementation()).to.equal(implementations.DCNTCrescendo.address);
    });

    it("should store the DCNTVault implementation address on the sdk", async () => {
      expect(await sdk.DCNTVaultImplementation()).to.equal(implementations.DCNTVault.address);
    });

    it("should store the DCNTStaking implementation address on the sdk", async () => {
      expect(await sdk.DCNTStakingImplementation()).to.equal(implementations.DCNTStaking.address);
    });
  });

  describe("deployDCNT721A()", async () => {
    before(async () => {
      const name = 'Decent';
      const symbol = 'DCNT';
      const maxTokens = 4;
      const tokenPrice = ethers.utils.parseEther('0.01');
      const maxTokenPurchase = 2;

      clone = await deployDCNT721A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase
      );
    });

    it("should deploy and initialize a DCNT721A contract", async () => {
      expect(clone.address).to.be.properAddress;
    });
  });

  describe("deployDCNT4907A()", async () => {
    before(async () => {
      const name = 'Decent';
      const symbol = 'DCNT';
      const maxTokens = 4;
      const tokenPrice = ethers.utils.parseEther('0.01');
      const maxTokenPurchase = 2;

      clone = await deployDCNT4907A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase
      );
    });

    it("should deploy and initialize a DCNT4907A contract", async () => {
      expect(clone.address).to.be.properAddress;
    });
  });

  describe("deployDCNTCrescendo()", async () => {
    before(async () => {
      const name = 'Decent';
      const symbol = 'DCNT';
      const uri = 'http://localhost/{id}.json'
      const initialPrice = ethers.utils.parseEther('0.05');
      const step1 = ethers.utils.parseEther("0.005");
      const step2 = ethers.utils.parseEther("0.05");
      const hitch = 20;
      const [trNum,trDenom] = [3,20];
      const payouts = ethers.constants.AddressZero;

      clone = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        uri,
        initialPrice,
        step1,
        step2,
        hitch,
        trNum,
        trDenom
      );
    });

    it("should deploy and initialize a DCNTCrescendo contract", async () => {
      expect(clone.address).to.be.properAddress;
    });
  });

  describe("deployDCNTVault()", async () => {
    before(async () => {
      clone = await deployDCNTVault(
        sdk,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        100,
        theFuture.time()
      );
    });

    it("should deploy and initialize a DCNTVault contract", async () => {
      expect(clone.address).to.be.properAddress;
    });
  });

  describe("deployDCNTStaking()", async () => {
    before(async () => {
      const vaultDuration = 100;
      const totalSupply = 10;
      clone = await deployDCNTStaking(
        sdk,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        vaultDuration,
        totalSupply
      );
    });

    it("should deploy and initialize a DCNTCrescendo contract", async () => {
      expect(clone.address).to.be.properAddress;
    });
  });
});
