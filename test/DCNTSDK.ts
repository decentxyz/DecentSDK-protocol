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
  deployDCNTMetadataRenderer,
  deployContract,
  theFuture,
  deployMockERC721
} from "../core";

describe("DCNTSDK", async () => {
  let owner: SignerWithAddress,
      implementations: any,
      metadataRenderer: Contract,
      contractRegistry: Contract,
      sdk: Contract,
      clone: Contract,
      parentIP: Contract;

  before(async () => {
    [owner] = await ethers.getSigners();
    implementations = await deployImplementations();
    metadataRenderer = await deployDCNTMetadataRenderer();
    contractRegistry = await deployContract('DCNTRegistry');
    sdk = await deployDCNTSDK(implementations, metadataRenderer, contractRegistry);
    parentIP = await deployMockERC721();
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

    it("should store the DCNTRegistry address on the sdk", async () => {
      expect(await sdk.contractRegistry()).to.equal(contractRegistry.address);
    });
  });

  describe("deployDCNT721A()", async () => {
    before(async () => {
      const name = 'Decent';
      const symbol = 'DCNT';
      const maxTokens = 4;
      const tokenPrice = ethers.utils.parseEther('0.01');
      const maxTokenPurchase = 2;
      const saleStart = theFuture.time();
      const royaltyBPS = 10_00;
      const metadataURI = 'http://localhost/metadata/';
      const metadataRendererInit = null;

      clone = await deployDCNT721A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        saleStart,
        royaltyBPS,
        metadataURI,
        metadataRendererInit,
        parentIP.address
      );
    });

    it("should deploy and initialize a DCNT721A contract", async () => {
      expect(clone.address).to.be.properAddress;
    });

    it("should register the deployed DCNT721A with the contract registry", async () => {
      const deployments = await contractRegistry.query(owner.address);
      expect(deployments[0]).to.equal(clone.address);
    });
  });

  describe("deployDCNT4907A()", async () => {
    before(async () => {
      const name = 'Decent';
      const symbol = 'DCNT';
      const maxTokens = 4;
      const tokenPrice = ethers.utils.parseEther('0.01');
      const maxTokenPurchase = 2;
      const saleStart = theFuture.time();
      const royaltyBPS = 10_00;
      const metadataURI = 'http://localhost/metadata/';
      const metadataRendererInit = null;

      clone = await deployDCNT4907A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        saleStart,
        royaltyBPS,
        metadataURI,
        metadataRendererInit,
        parentIP.address
      );
    });

    it("should deploy and initialize a DCNT4907A contract", async () => {
      expect(clone.address).to.be.properAddress;
    });

    it("should register the deployed DCNT4907A with the contract registry", async () => {
      const deployments = await contractRegistry.query(owner.address);
      expect(deployments[1]).to.equal(clone.address);
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
      const takeRateBPS = 15_00;
      const unlockDate = theFuture.time();
      const saleStart = theFuture.time();
      const royaltyBPS = 10_00;
      const metadataURI = 'http://localhost/metadata/';
      const metadataRendererInit = null;

      clone = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        unlockDate,
        saleStart,
        royaltyBPS,
        metadataURI,
        metadataRendererInit,
        parentIP.address
      );
    });

    it("should deploy and initialize a DCNTCrescendo contract", async () => {
      expect(clone.address).to.be.properAddress;
    });

    it("should register the deployed DCNTCrescendo with the contract registry", async () => {
      const deployments = await contractRegistry.query(owner.address);
      expect(deployments[2]).to.equal(clone.address);
    });
  });

  describe("deployDCNTVault()", async () => {
    before(async () => {
      const vaultDistributionTokenAddress = ethers.constants.AddressZero;
      const nftVaultKeyAddress = ethers.constants.AddressZero;
      const nftTotalSupply = 100;
      const unlockDate = theFuture.time();

      clone = await deployDCNTVault(
        sdk,
        vaultDistributionTokenAddress,
        nftVaultKeyAddress,
        nftTotalSupply,
        unlockDate
      );
    });

    it("should deploy and initialize a DCNTVault contract", async () => {
      expect(clone.address).to.be.properAddress;
    });

    it("should register the deployed DCNTVault with the contract registry", async () => {
      const deployments = await contractRegistry.query(owner.address);
      expect(deployments[3]).to.equal(clone.address);
    });
  });

  describe("deployDCNTStaking()", async () => {
    before(async () => {
      const nft = ethers.constants.AddressZero;
      const token = ethers.constants.AddressZero;
      const vaultDuration = 100;
      const totalSupply = 10;

      clone = await deployDCNTStaking(
        sdk,
        nft,
        token,
        vaultDuration,
        totalSupply
      );
    });

    it("should deploy and initialize a DCNTStaking contract", async () => {
      expect(clone.address).to.be.properAddress;
    });

    it("should register the deployed DCNTStaking with the contract registry", async () => {
      const deployments = await contractRegistry.query(owner.address);
      expect(deployments[4]).to.equal(clone.address);
    });
  });
});
