import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNTVaultNFT, DCNTVaultNFTCreate, theFuture } from "../core";

const name = 'Decent';
const symbol = 'DCNT';
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;
const vaultDistributionTokenAddress = ethers.constants.AddressZero;
const unlockDate = theFuture.time();

describe("DCNTVaultNFT", async () => {
  let owner: SignerWithAddress,
      sdk: Contract,
      dcntVaultNFT: Contract,
      nft: Contract,
      vault: Contract;

  before(async () => {
    [owner] = await ethers.getSigners();
    sdk = await deployDCNTSDK();
    dcntVaultNFT = await deployDCNTVaultNFT(sdk);
  });

  describe("constructor()", async () => {
    it("should result in a properly deployed contract", async () => {
      expect(dcntVaultNFT.address).to.be.properAddress;
    });
  });

  describe("create()", async () => {
    before(async () => {
      let supports4907 = false;
      [nft, vault] = await DCNTVaultNFTCreate(
        dcntVaultNFT,
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        vaultDistributionTokenAddress,
        unlockDate,
        supports4907
      );
    });

    it("should deploy and initialize a DCNT721A contract", async () => {
      expect(nft.address).to.be.properAddress;
      expect(await nft.supportsInterface('0xad092b5c')).to.eq(false);
    });

    it("should have the owner properly set on the DCNT721A deployment", async () => {
      expect(ethers.utils.getAddress(await nft.owner())).to.equal(owner.address);
    });

    it("should deploy and initialize a DCNTVault contract", async () => {
      expect(vault.address).to.be.properAddress;
    });

    it("should have the owner properly set on the DCNTVault deployment", async () => {
      expect(ethers.utils.getAddress(await vault.owner())).to.equal(owner.address);
    });

    it("should optionally deploy and initialize a DCNT4907A contract", async () => {
      let supports4907 = true;
      [nft, vault] = await DCNTVaultNFTCreate(
        dcntVaultNFT,
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        vaultDistributionTokenAddress,
        unlockDate,
        supports4907
      );

      expect(nft.address).to.be.properAddress;
      expect(await nft.supportsInterface('0xad092b5c')).to.eq(true);
    });

    it("should have the owner properly set on the DCNT4907A deployment", async () => {
      expect(ethers.utils.getAddress(await nft.owner())).to.equal(owner.address);
    });
  });
});
