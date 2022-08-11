import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deploySDK, deployImplementations, deploy721A } from "./shared";

const name = 'Decent';
const symbol = 'DCNT';
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;

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
});
