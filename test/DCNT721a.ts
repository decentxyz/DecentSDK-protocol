import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNT721A, sortByAddress } from "../core";

const name = 'Decent';
const symbol = 'DCNT';
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;

describe("DCNT721A", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      nft: Contract,
      split: any[];

  let overrides = { value: ethers.utils.parseEther("0.01") };
  let overrides2 = { value: ethers.utils.parseEther("0.02") };
  let overrides3 = { value: ethers.utils.parseEther("0.03") };

  describe("initialize()", async () => {
    before(async () => {
      [owner] = await ethers.getSigners();
      sdk = await deployDCNTSDK();
      clone = await deployDCNT721A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase
      );
    });

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

  describe("mint()", async () => {
    before(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      const sdk = await deployDCNTSDK();
      nft = await deployDCNT721A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase
      );
    });

    it("should prevent a user from minting", async () => {
      await expect(nft.connect(addr1).mint(1)).to.be.revertedWith(
        'Sale must be active to mint'
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
  });

  describe("flipSaleState()", async () => {
    it("should prevent non-owner from flipping state", async () => {
      await expect(nft.connect(addr2).flipSaleState()).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });
  });

  describe("withdraw()", async () => {
    it("should allow owner to withdraw", async () => {
      const before = await addr1.getBalance();
      const tx = await nft.connect(addr1).withdraw();
      const receipt = await tx.wait();
      const gas = receipt.cumulativeGasUsed * receipt.effectiveGasPrice;
      const after = await addr1.getBalance();
      const withdrawn = after.sub(before).add(gas);
      expect(withdrawn).to.equal(ethers.utils.parseEther("0.04"));
    });

    it("should revert if a split has already been created", async () => {
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

      await nft.createSplit(...split);
      await expect(nft.withdraw()).to.be.revertedWith('Cannot withdraw with an active split');
    });
  });

  describe("distributeAndWithdraw()", async () => {
    before(async () => {
      nft = await deployDCNT721A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase
      );
      await nft.flipSaleState();
      await nft.mint(1, { value: tokenPrice });
    });

    it("should transfer ETH to the split, distribute to receipients, and withdraw", async () => {
      await nft.createSplit(...split);
      const before2 = await ethers.provider.getBalance(addr2.address);
      const before3 = await ethers.provider.getBalance(addr3.address);

      await nft.distributeAndWithdraw(addr2.address, 1, [], ...split, addr1.address);
      const after2 = await ethers.provider.getBalance(addr2.address);
      expect(after2).to.equal(before2.add(tokenPrice.div(100).mul(90).sub(1)));

      await nft.distributeAndWithdraw(addr3.address, 1, [], ...split, addr1.address);
      const after3 = await ethers.provider.getBalance(addr3.address);
      expect(after3).to.equal(before3.add(tokenPrice.div(100).mul(10).sub(1)));
    });

    it("should revert if a split has not yet been created", async () => {
      const freshNFT: Contract = await deployDCNT721A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase
      );

      await expect(
        freshNFT.distributeAndWithdraw(addr2.address, 1, [], ...split, addr1.address)
      ).to.be.revertedWith('Split not created yet');
    });
  });
});
