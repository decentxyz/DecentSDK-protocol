import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deploySDK, deployStaking, deployTestERC20, deployTestERC721 } from "./shared";

const tokenDecimals = 18;
const vaultEnd = Math.floor((new Date()).getTime() / 1000) + 8_640_000;

describe("DCNTStaking contract", () => {
  let owner: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      token: Contract,
      nft: Contract;

  describe("basic tests", () => {
    beforeEach(async () => {
      [owner] = await ethers.getSigners();
      sdk = await deploySDK();
      token = await deployTestERC20(100);
      nft = await deployTestERC721();
      clone = await deployStaking(
        sdk,
        nft.address,
        token.address,
        tokenDecimals,
        vaultEnd
      );
    });

    describe("DCNTStaking clones", async () => {
      it("should have the owner set as the EOA deploying the contract", async () => {
        expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
      });

      it("should initialize state which would otherwise be set in constructor", async () => {
        expect(await clone.nftAddress()).to.equal(nft.address);
        expect(await clone.erc20Address()).to.equal(token.address);
        expect(await clone.tokenDecimals()).to.equal(tokenDecimals);
        expect(await clone.vaultEnd()).to.equal(vaultEnd);
      });
    });
  });
});
