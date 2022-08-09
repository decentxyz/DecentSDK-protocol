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

describe("Artist Nft Contract", () => {
  let nft: Contract;
  let addr1: SignerWithAddress,
    addr2: SignerWithAddress,
    addr3: SignerWithAddress,
    addr4: SignerWithAddress;

  let overrides = { value: ethers.utils.parseEther("0.01") };
  let overrides2 = { value: ethers.utils.parseEther("0.02") };
  let overrides3 = { value: ethers.utils.parseEther("0.03") };

  describe("basic tests", () => {
    before(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      const sdk = await deploySDK();
      nft = await deploy721A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase
      );
    })

    describe("initial deployment", async () => {
      it("should prevent a user from minting", async () => {
        await expect(nft.connect(addr1).mint(1)).to.be.revertedWith(
          'Sale must be active to mint'
        );
      });

      it("should prevent non-owner from flipping state", async () => {
        await expect(nft.connect(addr2).flipSaleState()).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });

      it("should not allow more than 2 mints at a time", async () => {
        await nft.connect(addr1).flipSaleState();
        await expect(nft.connect(addr2).mint(3, overrides3)).to.be.revertedWith(
          "Exceeded max number per mint"
        );
      });

      it("should allow normal mint progression", async () => {
        await nft.connect(addr2).mint(1, overrides);
        expect(await nft.ownerOf(0)).to.equal(addr2.address);
      });

      it("should allow additonal mints", async () => {
        await nft.connect(addr3).mint(2, overrides2);
        expect(await nft.ownerOf(1)).to.equal(addr3.address);
        expect(await nft.ownerOf(2)).to.equal(addr3.address);
        await nft.connect(addr2).mint(1, overrides);
        expect(await nft.ownerOf(3)).to.equal(addr2.address);
      });

      it("should not allow mints after cap", async () => {
        await expect(nft.connect(addr4).mint(1, overrides)).to.be.revertedWith(
          "Purchase would exceed max supply"
        );
      });

      it("should allow owner to withdraw", async () => {
        const before = await addr1.getBalance();
        const tx = await nft.connect(addr1).withdraw();
        const receipt = await tx.wait();
        const gas = receipt.cumulativeGasUsed * receipt.effectiveGasPrice;
        const after = await addr1.getBalance();
        const withdrawn = after.sub(before).add(gas);
        expect(withdrawn).to.equal(ethers.utils.parseEther("0.04"));
      });
    });
  });
});
