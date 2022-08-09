import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deploySDK, deployVault, deployTestERC20, deployTestERC721 } from "./shared";

const name = 'Decent';
const symbol = 'DCNT';
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;

const oneDay = 60 * 60 * 24;

describe("DCNTVault contract", () => {
  let owner: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      token: Contract,
      nft: Contract,
      date: number;

  describe("basic tests", () => {
    beforeEach(async () => {
      [owner] = await ethers.getSigners();
      sdk = await deploySDK();
      date = Math.floor((new Date()).getTime() / 1000);
      nft = await deployTestERC721();
      token = await deployTestERC20(100);
      clone = await deployVault(
        sdk,
        token.address,
        nft.address,
        date
      );
    });

    describe("DCNTVault clones", async () => {
      it("should have the owner set as the EOA deploying the contract", async () => {
        expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
      });

      it("should initialize state which would otherwise be set in constructor", async () => {
        expect(ethers.utils.getAddress(await clone.vaultDistributionToken())).to.equal(token.address);
        expect(ethers.utils.getAddress(await clone.nftVaultKey())).to.equal(nft.address);
        expect(await clone.unlockDate()).to.equal(date);
      });
    });
  });
});
