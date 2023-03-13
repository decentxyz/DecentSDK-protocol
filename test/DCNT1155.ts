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
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokensPerOwner = 2;
const presaleMerkleRoot = null;
const presaleStart = theFuture.time();
const presaleEnd = theFuture.time();
let saleStart = theFuture.time();
const saleEnd = theFuture.time() + theFuture.oneYear;
const royaltyBPS = 10_00;
const payoutAddress = ethers.constants.AddressZero;
const currencyOracle = ethers.constants.AddressZero;
const contractURI = "http://localhost/contract/";
const metadataURI = "http://localhost/metadata/";
const tokenGateConfig = {
  tokenAddress: ethers.constants.AddressZero,
  minBalance: 0,
  saleType: 0,
}

describe("DCNT1155", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      nft: Contract,
      presaleNFT: Contract,
      split: any[],
      parentIP: Contract,
      tree: MerkleTree,
      leaves: string[],
      snapshot: any[];

  describe("initialize()", async () => {
    before(async () => {
      [owner] = await ethers.getSigners();
      sdk = await deployDCNTSDK();
      parentIP = await deployMockERC721();
      await theFuture.reset();
      saleStart = theFuture.time() + theFuture.oneDay
      clone = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokensPerOwner,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        tokenGateConfig,
        parentIP.address
      );
    });

    it("should have the owner set as the EOA deploying the contract", async () => {
      expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
    });

    it("should initialize state which would otherwise be set in constructor", async () => {
      expect(await clone.name()).to.equal(name);
      expect(await clone.symbol()).to.equal(symbol);
      const droplet = await clone.droplets(0);
      expect(droplet.hasAdjustableCap).to.equal(hasAdjustableCap);
      expect(droplet.maxTokens).to.equal(maxTokens);
      expect(droplet.tokenPrice).to.equal(tokenPrice);
      expect(droplet.maxTokensPerOwner).to.equal(maxTokensPerOwner);
      expect(droplet.presaleStart).to.equal(presaleStart);
      expect(droplet.presaleEnd).to.equal(presaleEnd);
      expect(droplet.saleStart).to.equal(saleStart);
    });

    it("should optionally set configuration for a token gate", async () => {
      const gateNFT = await deployMockERC721();
      const freshNFT = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokensPerOwner,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        {
          tokenAddress: gateNFT.address,
          minBalance: 1337,
          saleType: 2,
        }
      );

      const { tokenGate } = await freshNFT.droplets(0);
      expect(tokenGate.tokenAddress).to.equal(gateNFT.address);
      expect(tokenGate.minBalance).to.equal(1337);
      expect(tokenGate.saleType).to.equal(2);
    });
  });

  describe("tokenPrice()", async () => {
    it("should return the token price in native currency", async () => {
      expect(await clone.tokenPrice(0)).to.equal(tokenPrice);
    });

    it("should optionally return dynamic pricing using price feed oracles", async () => {
      const decimals = 2 + Math.floor(Math.random() * (35)) // random precision 10^2 through 10^36
      const ethPrice = ethers.BigNumber.from('1500' + '0'.repeat(decimals)); // ETH @ $1500.00 USD
      const oracle = await deployContract('MockV3Aggregator', [decimals, ethPrice]);
      const freshNFT = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        ethers.utils.parseEther('13.37'), // $13.37 USD
        maxTokensPerOwner,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        oracle.address,
        contractURI,
        metadataURI,
        tokenGateConfig
      );

      expect(await freshNFT.tokenPrice(0)).to.equal(
        ethers.utils.parseEther('13.37').div(1500) // $13.37 USD / ETH @ $1500.00 USD
      );
    });
  });

  describe("mint()", async () => {
    before(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      const sdk = await deployDCNTSDK();
      nft = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokensPerOwner,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        tokenGateConfig
      );
    });

    it("should not allow mints until after the start date", async () => {
      await expect(nft.connect(addr1).mint(0, addr1.address, 1)).to.be.revertedWith(
        'Sales are not active.'
      );
      await theFuture.travel(theFuture.oneDay);
      await theFuture.arrive();
    });

    it("should not allow more than 2 mints per owner", async () => {
      await expect(nft.connect(addr2).mint(0, addr2.address, 3, { value: tokenPrice.mul(3) })).to.be.revertedWith(
        "Exceeded max number per owner"
      );
    });

    it("should allow normal mint progression", async () => {
      await nft.connect(addr2).mint(0, addr2.address, 1, { value: tokenPrice });
      expect(await nft.balanceOf(addr2.address, 0)).to.equal(1);
    });

    it("should allow additonal mints", async () => {
      await nft.connect(addr3).mint(0, addr3.address, 2, { value: tokenPrice.mul(2) });
      expect(await nft.balanceOf(addr3.address, 0)).to.equal(2);
      await nft.connect(addr2).mint(0, addr2.address, 1, { value: tokenPrice });
      expect(await nft.balanceOf(addr2.address, 0)).to.equal(2);
    });

    it("should not allow mints after cap", async () => {
      await expect(nft.connect(addr4).mint(0, addr4.address, 1, { value: tokenPrice })).to.be.revertedWith(
        "Purchase would exceed max supply"
      );
    });

    it("should refund excess gas to the caller to allow for slippage", async () => {
      const decimals = 2 + Math.floor(Math.random() * (35)) // random precision 10^2 through 10^36
      const ethPrice = ethers.BigNumber.from('1500' + '0'.repeat(decimals)); // ETH @ $1500.00 USD
      const oracle = await deployContract('MockV3Aggregator', [decimals, ethPrice]);
      const freshNFT = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        ethers.utils.parseEther('13.37'), // $13.37 USD
        maxTokensPerOwner,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        oracle.address,
        contractURI,
        metadataURI,
        tokenGateConfig
      );

      // simulate pricing fluctuation on the oracle
      const initialPrice = await freshNFT.tokenPrice(0);
      const priceFluctuation = Math.random() * 2 + 99; // < 1% fluctuation
      const newEthPrice = ethPrice.mul(Math.floor(priceFluctuation * 100_00)).div(100_00);
      await oracle.updateAnswer(newEthPrice);
      const newPrice = await freshNFT.tokenPrice(0);
      expect(newPrice).to.equal(initialPrice.mul(ethPrice).div(newEthPrice));

      // mint a token with an additional 1% slippage
      const priceWithSlippage = initialPrice.mul(101_00).div(100_00);
      const initialBalance = await ethers.provider.getBalance(addr1.address);
      const contractBalance = await ethers.provider.getBalance(freshNFT.address);
      const tx = await freshNFT.mint(0, addr1.address, 1, { value: priceWithSlippage });
      expect(tx).to.changeEtherBalance(freshNFT, newPrice);

      // Expect the transaction to refund excess value
      const receipt = await tx.wait();
      const gasUsed = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
      const expectedRefund = priceWithSlippage.sub(newPrice);
      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance).to.equal(
        initialBalance.sub(priceWithSlippage).sub(gasUsed).add(expectedRefund)
      );
    });

    it("should optionally use a token gate to restrict mints for all sales", async () => {
      const gateNFT = await deployMockERC721();
      const freshNFT = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokensPerOwner,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        {
          tokenAddress: gateNFT.address,
          minBalance: 1,
          saleType: 0,
        }
      );

      await expect(freshNFT.mint(0, addr1.address, 1, { value: tokenPrice })).to.be.revertedWith(
        'do not own required token'
      );
      await gateNFT.mintNft(1);
      await freshNFT.mint(0, addr1.address, 1, { value: tokenPrice });
      expect(await freshNFT.balanceOf(addr1.address, 0)).to.equal(1);
    });
  });

  describe("burn()", async () => {
    it("should reduce owner balance and total supply for a given tokenId", async () => {
      expect(await nft.balanceOf(addr2.address, 0)).to.equal(2);
      expect(await nft.totalSupply(0)).to.equal(4);

      await nft.connect(addr2).burn(0, 2);
      expect(await nft.balanceOf(addr2.address, 0)).to.equal(0);
      expect(await nft.totalSupply(0)).to.equal(2);
    });

    it("should only burn owned tokens", async () => {
      await expect(nft.connect(addr2).burn(0, 1)).to.be.revertedWith(
        'Burn exceeds owned tokens'
      );
    });
  });

  describe("mintAirdrop()", async () => {
    it("should mint tokens to the specified recipients", async () => {
      const freshNFT = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokensPerOwner,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        tokenGateConfig
      );

      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      expect(await freshNFT.balanceOf(addr1.address, 0)).to.equal(0);
      expect(await freshNFT.balanceOf(addr2.address, 0)).to.equal(0);
      expect(await freshNFT.balanceOf(addr3.address, 0)).to.equal(0);
      expect(await freshNFT.balanceOf(addr4.address, 0)).to.equal(0);

      await freshNFT.mintAirdrop(0, [addr1.address, addr2.address, addr3.address, addr4.address]);
      expect(await freshNFT.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await freshNFT.balanceOf(addr2.address, 0)).to.equal(1);
      expect(await freshNFT.balanceOf(addr3.address, 0)).to.equal(1);
      expect(await freshNFT.balanceOf(addr4.address, 0)).to.equal(1);
    });

    it("should prevent an airdrop which would exceed max supply", async () => {
      await nft.connect(addr2).mint(0, addr2.address, 2, { value: tokenPrice.mul(2) });
      await expect(nft.mintAirdrop(0, [addr1.address])).to.be.revertedWith(
        'Purchase would exceed max supply'
      );
    });

    it("should prevent non-admin from minting an airdrop", async () => {
      await expect(nft.connect(addr2).mintAirdrop(0, [])).to.be.revertedWith(
        'onlyAdmin'
      );
    });
  });

  describe("mintPresale()", async () => {
    it("should mint tokens to recipients providing a valid merkle proof", async () => {
      snapshot = [
        [addr1.address, 1, tokenPrice],
        [addr2.address, 2, tokenPrice],
        [addr3.address, 3, tokenPrice],
        [addr4.address, 4, tokenPrice],
      ];

      leaves = snapshot.map((leaf: any[]) => {
        return ethers.utils.solidityKeccak256(
          ["address", "uint256", "uint256"],
          [leaf[0], leaf[1], leaf[2]]
        );
      });

      tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

      presaleNFT = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        20,
        tokenPrice,
        maxTokensPerOwner,
        tree.getHexRoot(),
        theFuture.time(),
        theFuture.time() + theFuture.oneDay,
        theFuture.time() + theFuture.oneMonth,
        theFuture.time() + theFuture.oneYear,
        royaltyBPS,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        tokenGateConfig
      );

      expect(await presaleNFT.balanceOf(owner.address, 0)).to.equal(0);

      for ( let i = 0; i < snapshot.length; i++ ) {
        let quantity, maxQuantity;
        quantity = maxQuantity = snapshot[i][1];
        const merkleProof = tree.getHexProof(leaves[i]);
        const allowlist = [addr1, addr2, addr3, addr4];
        await presaleNFT.connect(allowlist[i]).mintPresale(
          0,
          quantity,
          maxQuantity,
          tokenPrice,
          merkleProof,
          { value: tokenPrice.mul(quantity) }
        );
      }

      expect(await presaleNFT.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await presaleNFT.balanceOf(addr2.address, 0)).to.equal(2);
      expect(await presaleNFT.balanceOf(addr3.address, 0)).to.equal(3);
      expect(await presaleNFT.balanceOf(addr4.address, 0)).to.equal(4);
    });

    it("should prevent minting without a valid merkle proof", async () => {
      expect(await presaleNFT.balanceOf(addr1.address, 0)).to.equal(1);

      const snapshot = [
        [addr1.address, 10, tokenPrice],
        [addr2.address, 10, tokenPrice],
      ];

      const badLeaves = snapshot.map((leaf: any[]) => {
        return ethers.utils.solidityKeccak256(
          ["address", "uint256", "uint256"],
          [leaf[0], leaf[1], leaf[2]]
        );
      });

      for ( let i = 0; i < snapshot.length; i++ ) {
        let quantity, maxQuantity;
        quantity = maxQuantity = snapshot[i][1];
        const merkleProof = tree.getHexProof(badLeaves[i]);
        const allowlist = [addr1, addr2, addr3, addr4];
        await expect(
          presaleNFT.connect(allowlist[i]).mintPresale(
            0,
            quantity,
            maxQuantity,
            tokenPrice,
            merkleProof,
            { value: tokenPrice.mul(quantity) }
          )
        ).to.be.revertedWith('not approved');
      }

      expect(await presaleNFT.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await presaleNFT.balanceOf(addr2.address, 0)).to.equal(2);
    });

    it("should prevent minting more tokens than allowed", async () => {
      expect(await presaleNFT.balanceOf(addr1.address, 0)).to.equal(1);

      for ( let i = 0; i < snapshot.length; i++ ) {
        let quantity, maxQuantity;
        quantity = maxQuantity = snapshot[i][1];
        const merkleProof = tree.getHexProof(leaves[i]);
        const allowlist = [addr1, addr2, addr3, addr4];
        await expect(
          presaleNFT.connect(allowlist[i]).mintPresale(
            0,
            1,
            maxQuantity,
            tokenPrice,
            merkleProof,
            { value: tokenPrice }
          )
        ).to.be.revertedWith('minted too many');
      }

      expect(await presaleNFT.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await presaleNFT.balanceOf(addr2.address, 0)).to.equal(2);
    });
  });

  describe("pause()", async () => {
    it("should prevent non-admin from pausing", async () => {
      await expect(nft.connect(addr2).pause()).to.be.revertedWith(
        'onlyAdmin'
      );
    });

    it("should prevent a user from minting", async () => {
      await nft.pause();
      await expect(nft.connect(addr1).mint(0, addr1.address, 1)).to.be.revertedWith(
        'Pausable: paused'
      );
      await nft.unpause();
    });
  });

  describe("safeTransferFrom()", async () => {
    it('should allow transfers by the owner or approved operator', async function () {
      const freshNFT = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokensPerOwner,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        tokenGateConfig
      );

      await freshNFT.mint(0, addr1.address, 1, { value: tokenPrice });
      expect(await freshNFT.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await freshNFT.balanceOf(addr2.address, 0)).to.equal(0);

      await freshNFT.connect(addr1).safeTransferFrom(addr1.address, addr2.address, 0, 1, []);
      expect(await freshNFT.balanceOf(addr1.address, 0)).to.equal(0);
      expect(await freshNFT.balanceOf(addr2.address, 0)).to.equal(1);

      await freshNFT.connect(addr2).setApprovalForAll(addr3.address, true);
      await freshNFT.connect(addr3).safeTransferFrom(addr2.address, addr4.address, 0, 1, []);
      expect(await freshNFT.balanceOf(addr2.address, 0)).to.equal(0);
      expect(await freshNFT.balanceOf(addr4.address, 0)).to.equal(1);

      await expect(
        freshNFT.connect(addr2).safeTransferFrom(addr4.address, addr2.address, 0, 1, [])
      ).to.be.revertedWith('NOT_AUTHORIZED');
    });

    it('should revert for soulbound tokens', async function () {
      const freshNFT = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        true,
        maxTokens,
        tokenPrice,
        maxTokensPerOwner,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        tokenGateConfig
      );

      await freshNFT.mint(0, addr1.address, 1, { value: tokenPrice });
      await expect(
        freshNFT.safeTransferFrom(addr1.address, addr2.address, 0, 1, [])
      ).to.be.revertedWith('soulbound');
    });
  });

  describe("setDroplet()", async () => {
    it("should adjust the cap on nfts with an adjustable cap", async () => {
      let droplet = await nft.droplets(0);
      expect(droplet.maxTokens).to.equal(maxTokens);

      await nft.setDroplets([0], [{
        hasAdjustableCap,
        maxTokens: maxTokens*2,
        tokenPrice,
        maxTokensPerOwner,
        presaleMerkleRoot: ethers.constants.HashZero,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        tokenGate: tokenGateConfig
      }]);

      droplet = await nft.droplets(0);
      expect(droplet.maxTokens).to.equal(maxTokens*2);
    });

    it("should prevent adjusting the cap on nfts without an adjustable cap", async () => {
      const freshNFT = await deployDCNT1155(
        sdk,
        name,
        symbol,
        false, // hasAdjustableCap
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokensPerOwner,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        tokenGateConfig
      );

      let droplet = await freshNFT.droplets(0);
      expect(droplet.maxTokens).to.equal(maxTokens);

      await expect(
        freshNFT.setDroplets([0], [{
          hasAdjustableCap: true,
          maxTokens: maxTokens*2,
          tokenPrice,
          maxTokensPerOwner,
          presaleMerkleRoot: ethers.constants.HashZero,
          presaleStart,
          presaleEnd,
          saleStart,
          saleEnd,
          tokenGate: tokenGateConfig
        }])
      ).to.be.revertedWith(
        'caps are locked'
      );

      droplet = await freshNFT.droplets(0);
      expect(droplet.maxTokens).to.equal(maxTokens);

      await expect(
        freshNFT.setDroplets([0], [{
          hasAdjustableCap,
          maxTokens: maxTokens*2,
          tokenPrice,
          maxTokensPerOwner,
          presaleMerkleRoot: ethers.constants.HashZero,
          presaleStart,
          presaleEnd,
          saleStart,
          saleEnd,
          tokenGate: tokenGateConfig
        }])
      ).to.be.revertedWith(
        'caps are locked'
      );
    });

    it("should prevent non-admin from setting droplet", async () => {
      await expect(
        nft.connect(addr2).setDroplets([0], [{
          hasAdjustableCap,
          maxTokens,
          tokenPrice,
          maxTokensPerOwner,
          presaleMerkleRoot: ethers.constants.HashZero,
          presaleStart,
          presaleEnd,
          saleStart,
          saleEnd,
          tokenGate: tokenGateConfig
        }])
      ).to.be.revertedWith(
        'onlyAdmin'
      );
    });
  });

  describe("withdraw()", async () => {
    it("should allow admin to withdraw", async () => {
      const before = await addr1.getBalance();
      const tx = await nft.connect(addr1).withdraw();
      const receipt = await tx.wait();
      const gas = receipt.cumulativeGasUsed * receipt.effectiveGasPrice;
      const after = await addr1.getBalance();
      const withdrawn = after.sub(before).add(gas);
      expect(withdrawn).to.equal(tokenPrice.mul(6));
    });

    it("should optionally withdraw to the payout address", async () => {
      await nft.mint(0, addr1.address, 2, { value: tokenPrice.mul(2) });
      await nft.setPayoutAddress(addr2.address);
      const before = await addr2.getBalance();
      const tx = await nft.connect(addr1).withdraw();
      const receipt = await tx.wait();
      const after = await addr2.getBalance();
      const withdrawn = after.sub(before);
      expect(withdrawn).to.equal(ethers.utils.parseEther("0.02"));
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
      nft = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokensPerOwner,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        tokenGateConfig
      );
      await nft.mint(0, addr1.address, 1, { value: tokenPrice });
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
      const freshNFT: Contract = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokensPerOwner,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        tokenGateConfig
      );

      await expect(
        freshNFT.distributeAndWithdraw(addr2.address, 1, [], ...split, addr1.address)
      ).to.be.revertedWith('Split not created yet');
    });
  });

  describe("supportsInterface()", async () => {
    it('should support the interface for ERC1155', async function () {
      expect(await nft.supportsInterface('0xd9b67a26')).to.eq(true);
    });

    it('should support the interface for ERC2981', async function () {
      expect(await nft.supportsInterface('0x2a55205a')).to.eq(true);
    });
  });

  describe("royaltyInfo()", async () => {
    it('should calculate the royalty for the secondary sale', async function () {
      const royalty = await nft.royaltyInfo(0, tokenPrice);
      expect(royalty.royaltyAmount).to.eq(tokenPrice.div(10_000).mul(royaltyBPS));
    });

    it('should set owner as the receiver, unless there is a split', async function () {
      const freshNFT: Contract = await deployDCNT1155(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokensPerOwner,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        tokenGateConfig
      );

      await freshNFT.mint(0, addr1.address, 1, { value: tokenPrice });

      const ownerRoyalty = await freshNFT.royaltyInfo(0, tokenPrice);
      expect(ownerRoyalty.receiver).to.eq(owner.address);

      await freshNFT.createSplit(...split);
      const splitRoyalty = await freshNFT.royaltyInfo(0, tokenPrice);
      expect(splitRoyalty.receiver).to.eq(await freshNFT.splitWallet());
    });
  });

});
