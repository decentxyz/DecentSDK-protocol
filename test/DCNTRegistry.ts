import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, theFuture, deployMockERC721 } from "../core";

describe("DCNTVaultNFT", async () => {
  let owner: SignerWithAddress,
      sdk: Contract,
      registry: Contract,
      nft: Contract;

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
      nft = await deployMockERC721();
      const registerTx = await registry.register(owner.address, nft.address, '');
      const deployments = await registry.query(owner.address);
      expect(deployments[0]).to.equal(nft.address);
    });

    it("should emit an event with the name of the contract", async () => {
      nft = await deployMockERC721();
      const registerTx = await registry.register(owner.address, nft.address, 'MockERC721');

      const receipt = await registerTx.wait();
      const event = receipt.events.find((x: any) => x.event === 'Register').args;

      expect(event.deployer).to.equal(owner.address);
      expect(event.deployment).to.equal(nft.address);
      expect(event.key).to.equal('MockERC721');
    });
  });

  describe("remove()", async () => {
    it("should remove a deployment for a specific deployer", async () => {
      const before = await registry.query(owner.address);
      expect(before.length).to.equal(2);

      const removeTx = await registry.remove(owner.address, nft.address);
      const after = await registry.query(owner.address);
      expect(after.length).to.equal(1);
    });
  });

  describe("query()", async () => {
    it("should return all deployments for a specific deployer", async () => {
      nft = await deployMockERC721();
      const registerTx = await registry.register(owner.address, nft.address, '');
      const deployments = await registry.query(owner.address);
      expect(deployments.length).to.equal(2);
      expect(deployments[1]).to.equal(nft.address);
    });
  });
});
