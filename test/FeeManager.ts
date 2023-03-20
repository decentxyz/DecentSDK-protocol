import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNT1155, deployMockERC721, deployContract, theFuture, sortByAddress, base64decode } from "../core";
import { MerkleTree } from "merkletreejs";
const keccak256 = require("keccak256");

const name = 'Decent';
const symbol = 'DCNT';
const hasAdjustableCap = true;
const isSoulbound = false;
const startTokenId = 0;
const endTokenId = 0;
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokensPerOwner = 2;
const presaleMerkleRoot = null;
const presaleStart = theFuture.time();
const presaleEnd = theFuture.time();
let saleStart = theFuture.time();
let saleEnd = theFuture.time() + theFuture.oneYear;
const royaltyBPS = 10_00;
const feeManager = ethers.constants.AddressZero;
const payoutAddress = ethers.constants.AddressZero;
const currencyOracle = ethers.constants.AddressZero;
const contractURI = "http://localhost/contract/";
const metadataURI = "http://localhost/metadata/";
const tokenGateConfig = {
  tokenAddress: ethers.constants.AddressZero,
  minBalance: 0,
  saleType: 0,
}

describe("FeeManager", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      sdk: Contract,
      feeManager: Contract,
      splitMain: Contract,
      nft: Contract,
      fixedFee: BigNumber,
      commissionBPS: BigNumber,
      split: any[];

  before(async () => {
    sdk = await deployDCNTSDK();
    [addr1, addr2, addr3, addr4] = await ethers.getSigners();
    await theFuture.reset();
    saleStart = theFuture.time();
    saleEnd = saleStart + theFuture.oneYear;
  });

  describe("constructor()", async () => {
    it("should set the initial parameters for a fee manager", async () => {
      fixedFee = ethers.utils.parseEther('0.0005'); // $1.00 USD in ETH at $2000 USD
      commissionBPS = 10_00; // 10% in BPS
      feeManager = await deployContract('FeeManager',[fixedFee, commissionBPS]);
      expect(await feeManager.fee()).to.equal(fixedFee);
      expect(await feeManager.commissionBPS()).to.equal(commissionBPS);
    });
  });

  describe("setFees()", async () => {
    it("should update the fees for a fee manager", async () => {
      fixedFee = ethers.utils.parseEther('0.0010'); // $2.00 USD in ETH at $2000 USD
      commissionBPS = 5_00; // 5% in BPS
      await feeManager.setFees(fixedFee, commissionBPS);
      expect(await feeManager.fee()).to.equal(fixedFee);
      expect(await feeManager.commissionBPS()).to.equal(commissionBPS);
    });
  });

  describe("calculateFee()", async () => {
    it("should return the caluclated fee for the specified price and quantity", async () => {
      expect(await feeManager.calculateFee(tokenPrice, 1)).to.equal(fixedFee);
      expect(await feeManager.calculateFee(tokenPrice, 5)).to.equal(fixedFee.mul(5));
    });
  });

  describe("calculateCommission()", async () => {
    it("should return the calculated commission for the specified price and quantity", async () => {
      expect(
        await feeManager.calculateCommission(tokenPrice, 1)
      ).to.equal(tokenPrice.mul(commissionBPS).div(100_00));
      expect(
        await feeManager.calculateCommission(tokenPrice, 5)
      ).to.equal(tokenPrice.mul(commissionBPS).div(100_00).mul(5));
    });
  });

  describe("withdraw()", async () => {
    it("should allow withdrawals by owner", async () => {
      const fixedFee = ethers.utils.parseEther('0.0005'); // $1.00 USD in ETH at $2000 USD
      const commissionBPS = 10_00; // 10% in BPS
      const feeManager = await deployContract('FeeManager',[fixedFee, commissionBPS]);

      const freshNFT = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager.address,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        {
          maxTokens,
          tokenPrice,
          maxTokensPerOwner,
          presaleMerkleRoot,
          presaleStart,
          presaleEnd,
          saleStart,
          saleEnd,
          tokenGateConfig
        }
      );

      await freshNFT.mint(0, addr1.address, 1, { value: tokenPrice.add(fixedFee) });
      const commission = tokenPrice.mul(commissionBPS).div(100_00);
      const totalFees = commission.add(fixedFee);
      const before = await addr1.getBalance();
      const tx = await feeManager.withdraw();
      const receipt = await tx.wait();
      const gas = receipt.cumulativeGasUsed * receipt.effectiveGasPrice;
      const after = await addr1.getBalance();
      const withdrawn = after.sub(before).add(gas);
      expect(withdrawn).to.equal(totalFees);
    });

    it("should revert if called by an account which is not the owner", async () => {
      await expect(
        feeManager.connect(addr2).withdraw()
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe("createSplit()", async () => {
    before(async () => {
      const payouts = sortByAddress([
        {
          address: addr2.address,
          percent: (1_000_000 / 100) * 90
        },
        {
          address: addr3.address,
          percent: (1_000_000 / 100) * 10
        },
      ]);

      const addresses = payouts.map(payout => payout.address);
      const percents = payouts.map(payout => payout.percent);
      const distributorFee = 0;
      split = [addresses, percents, distributorFee];
      splitMain = await deployContract('SplitMain');
    });

    it("should create a split", async () => {
      expect(await feeManager.splitWallet()).to.equal(ethers.constants.AddressZero);
      await feeManager.createSplit(splitMain.address, ...split);
      expect(await feeManager.splitWallet()).to.not.equal(ethers.constants.AddressZero);
    });
  });

});
