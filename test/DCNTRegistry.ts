import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, theFuture, deployMockERC721 } from "../core";

describe("DCNTVaultNFT", async () => {
  let owner: SignerWithAddress,
      sdk: Contract,
      registry: Contract;

  describe("constructor()", async () => {
    before(async () => {
      [owner] = await ethers.getSigners();
      sdk = await deployDCNTSDK();
      registry = await ethers.getContractAt('DCNTRegistry', await sdk.contractRegistry());
    });

    it("should result in a properly deployed contract", async () => {
      expect(registry.address).to.be.properAddress;
    });
  });

  describe("register()", async () => {
    it("should register a deployment for a specific deployer", async () => {
      const nft = await deployMockERC721();
      await registry.register(owner.address, nft.address);
      const deployments = await registry.query(owner.address);
      expect(deployments[0]).to.equal(nft.address);
    });
  });

  describe("query()", async () => {
    it("should return all deployments for a specific deployer", async () => {
      const nft = await deployMockERC721();
      await registry.register(owner.address, nft.address);
      const deployments = await registry.query(owner.address);
      expect(deployments.length).to.equal(2);
      expect(deployments[1]).to.equal(nft.address);
    });
  });
});
