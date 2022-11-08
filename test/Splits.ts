import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNT4907A, theFuture, deployMockERC20, sortByAddress } from "../core";

const name = 'Decent';
const symbol = 'DCNT';
const hasAdjustableCap = false;
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('1');
const maxTokenPurchase = 2;
const presaleMerkleRoot = null;
const presaleStart = theFuture.time();
const presaleEnd = theFuture.time();
const saleStart = theFuture.time();
const saleEnd = theFuture.time() + theFuture.oneYear;
const royaltyBPS = 10_000;
const contractURI = "http://localhost/contract/";
const metadataURI = "http://localhost/metadata/";
const metadataRendererInit = null;
const tokenGateConfig = null;

const scale = 1_000_000;
const bigPercent = (num: BigNumber, perc: number) => num.div(100).mul(perc);

describe("Splits", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      sdk: Contract,
      nft: Contract,
      split: any[],
      splitMain: Contract;

  before(async () => {
    [addr1, addr2, addr3, addr4] = await ethers.getSigners();
    sdk = await deployDCNTSDK();
    splitMain = await ethers.getContractAt('SplitMain', sdk.SplitMain());
    nft = await deployDCNT4907A(
      sdk,
      name,
      symbol,
      hasAdjustableCap,
      maxTokens,
      tokenPrice,
      maxTokenPurchase,
      presaleMerkleRoot,
      presaleStart,
      presaleEnd,
      saleStart,
      saleEnd,
      royaltyBPS,
      contractURI,
      metadataURI,
      metadataRendererInit,
      tokenGateConfig,
    );

    const payouts = sortByAddress([
      {
        address: addr2.address,
        percent: (scale / 100) * 90
      },
      {
        address: addr3.address,
        percent: (scale / 100) * 10
      },
    ]);

    const addresses = payouts.map(payout => payout.address);
    const percents = payouts.map(payout => payout.percent);
    const distributorFee = 0;
    split = [addresses, percents, distributorFee];
  });

  describe("createSplit()", async () => {
    it("should create a split", async () => {
      expect(await nft.splitWallet()).to.equal(ethers.constants.AddressZero);
      await nft.createSplit(...split);
      expect(await nft.splitWallet()).to.not.equal(ethers.constants.AddressZero);
    });

    it("should revert if a split has already been created", async () => {
      await expect(nft.createSplit(...split)).to.be.revertedWith('Split already created');
    });

    it("should revert if called by an account which is not the owner", async () => {
      const freshNFT: Contract = await deployDCNT4907A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig,
      );

      await expect(
        freshNFT.distributeERC20(ethers.constants.AddressZero, ...split, addr1.address)
      ).to.be.revertedWith('Split not created yet');
    });
  });

  describe("distributeETH()", async () => {
    it("should transfer ETH to the split and distribute to receipients", async () => {
      await nft.mint(1, { value: tokenPrice });
      expect(await ethers.provider.getBalance(nft.address)).to.equal(tokenPrice);

      await nft.distributeETH(...split, addr1.address);
      expect(await ethers.provider.getBalance(nft.address)).to.equal(0);
      expect(await splitMain.getETHBalance(addr2.address)).to.equal(bigPercent(tokenPrice, 90));
      expect(await splitMain.getETHBalance(addr3.address)).to.equal(bigPercent(tokenPrice, 10));
    });

    it("should revert if a split has not yet been created", async () => {
      const freshNFT: Contract = await deployDCNT4907A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig,
      );

      await expect(
        freshNFT.distributeETH(...split, addr1.address)
      ).to.be.revertedWith('Split not created yet');
    });
  });

  describe("distributeERC20()", async () => {
    it("should transfer ERC20 to the split and distribute to receipients", async () => {
      const supply = ethers.utils.parseEther('100');
      const erc20 = await deployMockERC20(supply);
      await erc20.transfer(nft.address, supply);

      await nft.distributeERC20(erc20.address, ...split, addr1.address);

      const afterSplit = await erc20.balanceOf(splitMain.address);
      const after2 = await splitMain.getERC20Balance(addr2.address, erc20.address);
      const after3 = await splitMain.getERC20Balance(addr3.address, erc20.address);

      expect(afterSplit).to.equal(supply.sub(1));
      expect(after2).to.equal(bigPercent(supply, 90).sub(1));
      expect(after3).to.equal(bigPercent(supply, 10).sub(1));
    });

    it("should revert if a split has not yet been created", async () => {
      const freshNFT: Contract = await deployDCNT4907A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig,
      );

      await expect(
        freshNFT.distributeERC20(ethers.constants.AddressZero, ...split, addr1.address)
      ).to.be.revertedWith('Split not created yet');
    });
  });

  describe("distributeAndWithdraw()", async () => {
    before(async () => {
      sdk = await deployDCNTSDK();
      splitMain = await ethers.getContractAt('SplitMain', sdk.SplitMain());
      nft = await deployDCNT4907A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig,
      );
    });

    it("should transfer ETH to the split, distribute to receipients, and withdraw", async () => {
      nft.createSplit(...split);

      await nft.mint(1, { value: tokenPrice });
      expect(await ethers.provider.getBalance(nft.address)).to.equal(tokenPrice);

      const before2 = await ethers.provider.getBalance(addr2.address);
      const before3 = await ethers.provider.getBalance(addr3.address);

      await nft.distributeAndWithdraw(addr2.address, 1, [], ...split, addr1.address);
      expect(await ethers.provider.getBalance(nft.address)).to.equal(0);

      const after2 = await ethers.provider.getBalance(addr2.address);
      let after3 = await ethers.provider.getBalance(addr3.address);

      expect(after2).to.equal(before2.add(bigPercent(tokenPrice, 90).sub(1)));
      expect(after3).to.equal(before3);

      await nft.distributeAndWithdraw(addr3.address, 1, [], ...split, addr1.address);
      after3 = await ethers.provider.getBalance(addr3.address);
      expect(after3).to.equal(before3.add(bigPercent(tokenPrice, 10).sub(1)));
    });

    it("should transfer ERC20s to the split, distribute to receipients, and withdraw", async () => {
      const supply = ethers.utils.parseEther('100');

      const erc20A = await deployMockERC20(supply);
      await erc20A.transfer(nft.address, supply);

      const erc20B = await deployMockERC20(supply);
      await erc20B.transfer(nft.address, supply);

      await nft.distributeAndWithdraw(
        addr2.address,
        1,
        [
          erc20A.address,
          erc20B.address,
        ],
        ...split,
        addr1.address
      );

      let after2 = await erc20A.balanceOf(addr2.address);
      expect(after2).to.equal(bigPercent(supply, 90).sub(2));

      after2 = await erc20B.balanceOf(addr2.address);
      expect(after2).to.equal(bigPercent(supply, 90).sub(2));
    });

    it("should revert if a split has not yet been created", async () => {
      const freshNFT: Contract = await deployDCNT4907A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig,
      );

      await expect(
        freshNFT.distributeAndWithdraw(addr2.address, 1, [], ...split, addr1.address)
      ).to.be.revertedWith('Split not created yet');
    });
  });

  describe("transferToSplit()", async () => {
    it("should transfer ETH and ERC20 to the split", async () => {
      await nft.mint(1, { value: tokenPrice });
      expect(await ethers.provider.getBalance(nft.address)).to.equal(tokenPrice);

      const supply = ethers.utils.parseEther('100');
      const erc20 = await deployMockERC20(supply);
      await erc20.transfer(nft.address, supply);
      expect(await erc20.balanceOf(nft.address)).to.equal(supply);

      await nft.transferToSplit(1, [erc20.address]);
      expect(await erc20.balanceOf(nft.splitWallet())).to.equal(supply);
      expect(await ethers.provider.getBalance(nft.splitWallet())).to.equal(tokenPrice);
    });

    it("should revert if a split has not yet been created", async () => {
      const freshNFT: Contract = await deployDCNT4907A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig
      );

      await expect(
        freshNFT.transferToSplit(1, [])
      ).to.be.revertedWith('Split not created yet');
    });
  });
});
