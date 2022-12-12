import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNTStaking, deployMockERC20, deployMockERC721, theFuture } from "../core";

const tokenDecimals = 18;
const vaultDuration = 100; // days

// amounts
const oneEth = ethers.utils.parseEther("1");
const vaultFund = oneEth.mul(100);

describe("DCNTStaking", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      token: Contract,
      nft: Contract,
      totalSupply: number;

  before(async () => {
    [owner] = await ethers.getSigners();
    sdk = await deployDCNTSDK();
    token = await deployMockERC20(vaultFund);
    nft = await deployMockERC721();
    totalSupply = 10;
    await theFuture.travel(theFuture.oneDay);
    clone = await deployDCNTStaking(
      sdk,
      nft.address,
      token.address,
      vaultDuration,
      totalSupply
    );
  });

  describe("initialize()", async () => {
    it("should have the owner set as the EOA deploying the contract", async () => {
      expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
    });

    it("should initialize state which would otherwise be set in constructor", async () => {
      expect(await clone.nftAddress()).to.equal(nft.address);
      expect(await clone.erc20Address()).to.equal(token.address);
    });

    it("should calculate vault start and end dates based on block timestamp", async () => {
      expect(await clone.vaultStart()).to.equal(theFuture.time());
      expect(await clone.vaultEnd()).to.equal(theFuture.time() + (theFuture.oneDay * vaultDuration));
    });
  });

  describe("stake()", async () => {
    it("should revert if not approved for token or not an approved operator", async () => {
      const stakedNFT = await deployMockERC721();
      await stakedNFT.mintNft(10);

      const staking = await deployDCNTStaking(
        sdk,
        stakedNFT.address,
        token.address,
        vaultDuration,
        totalSupply
      );

      await expect(staking.stake([0])).to.be.revertedWith('not approved for transfer');
      await stakedNFT.approve(staking.address, 0);
      await staking.stake([0]);
      expect(await staking.balanceOf(owner.address)).to.equal(1);

      await expect(staking.stake([1,2,3,4,5])).to.be.revertedWith('not approved for transfer');
      await stakedNFT.setApprovalForAll(staking.address, true);
      await staking.stake([1,2,3,4,5]);
      expect(await staking.balanceOf(owner.address)).to.equal(6);
    });
  });

  describe("vault functionality", async () => {
    it("should have a vault balance of zero", async () => {
      expect(await nft.balanceOf(owner.address)).to.equal(0);
    })

    describe("and 50 tokens are added to the vault", async () => {
      it("should have a vault balance of 50", async () => {
        await token.connect(owner).transfer(clone.address, 50);
        expect(await token.balanceOf(clone.address)).to.equal(50);
      })
    });

    describe("and 50 more tokens are added to the vault", async () => {
      it("should have a vault balance of 100", async () => {
        await token.connect(owner).transfer(clone.address, 50);
        expect(await token.balanceOf(clone.address)).to.equal(100);
      })
    });
  });

  describe("claiming functionality", async () => {
    let owner: SignerWithAddress,
        addr1: SignerWithAddress,
        addr2: SignerWithAddress,
        addr3: SignerWithAddress,
        addr4: SignerWithAddress,
        sdk: Contract,
        clone: Contract,
        token: Contract,
        nft: Contract,
        totalSupply: number;

    before(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      sdk = await deployDCNTSDK();
      token = await deployMockERC20(vaultFund.mul(2));
      nft = await deployMockERC721();
      totalSupply = 10;
      await theFuture.travel(theFuture.oneDay);
      clone = await deployDCNTStaking(
        sdk,
        nft.address,
        token.address,
        vaultDuration,
        totalSupply
      );

      // fund the vault
      await token.connect(addr1).transfer(clone.address, vaultFund);

      // mint 1/10 of nft collection to owner
      await nft.connect(addr1).mintNft(1);
      await nft.connect(addr2).mintNft(8);
      await nft.connect(addr3).mintNft(1);

      // approve transfer and stake 1 nft
      await nft.connect(addr1).approve(clone.address, 0);
      await theFuture.travel(theFuture.oneDay);
      await clone.connect(addr1).stake([0]);

      // approve transfer and stake 1 nft
      await nft.connect(addr2).approve(clone.address, 1);
      await clone.connect(addr2).stake([1]);
    });

    describe("and a user with one nft stakes for 1 day", async () => {
      it("they would have earned 0.1 token", async () => {
        await theFuture.travel(theFuture.oneDay);
        await theFuture.arrive();
        const earn = await clone.earningInfo(addr1.address, [0]);
        expect(earn).to.equal(ethers.utils.parseEther('0.1'));
      });
    });

    describe("and continues to stake for another 1.5 days", async () => {
      it("they would have earned 0.25 token", async () => {
        await theFuture.travel(theFuture.oneDay*1.5);
        await theFuture.arrive();
        const earn = await clone.earningInfo(addr1.address, [0]);
        expect(earn).to.equal(ethers.utils.parseEther('0.25'));
      });
    });

    describe("and continues to stake for another 2.5 days", async () => {
      it("they would have earned 0.5 token", async () => {
        await theFuture.travel(theFuture.oneDay*2.5);
        await theFuture.arrive();
        const earn = await clone.earningInfo(addr1.address, [0]);
        expect(earn).to.equal(ethers.utils.parseEther('0.5'));
      });
    });

    describe("and continues to stake for another day after a user claims", async () => {
      it("they would have earned 0.6 token", async () => {
        await clone.connect(addr2).claim([1]);

        await theFuture.travel(theFuture.oneDay);
        await theFuture.arrive();
        const earn = await clone.earningInfo(addr1.address, [0]);
        expect(earn).to.equal(ethers.utils.parseEther('0.6'));
      });
    });

    describe("and stakes for 7 days total and the vault fund is doubled", async () => {
      it("they would have earned 1.4 token", async () => {
        await token.connect(addr1).transfer(clone.address, vaultFund);

        await theFuture.travel(theFuture.oneDay);
        await theFuture.arrive();
        const earn = await clone.earningInfo(addr1.address, [0]);
        expect(earn).to.equal(ethers.utils.parseEther('1.4'));
      });
    });

    describe("and then tries to stake the same nft again ", async () => {
      it("should revert with already staked", async () => {
        await expect(clone.connect(addr1).stake([0])).to.be.revertedWith("already staked");
      });
    });

    describe("and then tries to stake another user's nft ", async () => {
      it("should revert with not your token", async () => {
        await expect(clone.connect(addr1).stake([2])).to.be.revertedWith("not your token");
      });
    });

    describe("and another user tries to stake without approving first", async () => {
      it("should revert with not approved for transfer", async () => {
        await expect(clone.connect(addr3).stake([9])).to.be.revertedWith("not approved for transfer");
      });
    });
  });
});

