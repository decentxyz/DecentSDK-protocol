import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  deploySDK,
  deployImplementations,
  deploy721A,
  deploy4907A,
  deployCrescendo,
  deployVault,
  deployStaking,
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
    sdk = await deploySDK(implementations);
  });

  describe("constructor()", async () => {
    it("should store the DCNT721A implementation address on the sdk", async () => {
      expect(ethers.utils.getAddress(await sdk.nftImplementation())).to.equal(implementations.nft.address);
    });

    it("should store the DCNT4907A implementation address on the sdk", async () => {
      expect(ethers.utils.getAddress(await sdk.DCNT4907AImplementation())).to.equal(implementations.DCNT4907A.address);
    });

    it("should store the DCNTCrescendo implementation address on the sdk", async () => {
      expect(ethers.utils.getAddress(await sdk.crescendoImplementation())).to.equal(implementations.crescendo.address);
    });

    it("should store the DCNTVault implementation address on the sdk", async () => {
      expect(ethers.utils.getAddress(await sdk.vaultImplementation())).to.equal(implementations.vault.address);
    });

    it("should store the DCNTStaking implementation address on the sdk", async () => {
      expect(ethers.utils.getAddress(await sdk.nftImplementation())).to.equal(implementations.nft.address);
    });
  });

  describe("deploy721A()", async () => {
    before(async () => {
      const name = 'Decent';
      const symbol = 'DCNT';
      const maxTokens = 4;
      const tokenPrice = ethers.utils.parseEther('0.01');
      const maxTokenPurchase = 2;

      clone = await deploy721A(
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

  describe("deploy4907A()", async () => {
    before(async () => {
      const name = 'Decent';
      const symbol = 'DCNT';
      const maxTokens = 4;
      const tokenPrice = ethers.utils.parseEther('0.01');
      const maxTokenPurchase = 2;

      clone = await deploy4907A(
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

  describe("deployCrescendo()", async () => {
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

    it("should deploy and initialize a DCNTCrescendo contract", async () => {
      expect(clone.address).to.be.properAddress;
    });
  });

  describe("deployVault()", async () => {
    before(async () => {
      clone = await deployVault(
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

  describe("deployStaking()", async () => {
    before(async () => {
      const vaultDuration = 100;
      const totalSupply = 10;
      clone = await deployStaking(
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
