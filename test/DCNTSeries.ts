import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNTSeries, deployMockERC721, deployContract, theFuture, sortByAddress, base64decode } from "../core";
import { MerkleTree } from "merkletreejs";
const keccak256 = require("keccak256");

const name = 'Decent';
const symbol = 'DCNT';
const hasAdjustableCaps = true;
const isSoulbound = false;
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokensPerOwner = 2;
const presaleMerkleRoot = null;
const presaleStart = theFuture.time();
const presaleEnd = theFuture.time();
let saleStart = theFuture.time();
let saleEnd = theFuture.time() + theFuture.oneYear;
const startTokenId = 0;
const endTokenId = 1;
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

describe("DCNTSeries", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      nft: Contract,
      presaleNFT: Contract,
      splitMain: Contract,
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
      saleStart = theFuture.time() + theFuture.oneDay;
      saleEnd = theFuture.time() + theFuture.oneYear;
      clone = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
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
          tokenGateConfig,
        }
      );
    });

    it("should have the owner set as the EOA deploying the contract", async () => {
      expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
    });

    it("should initialize state which would otherwise be set in constructor", async () => {
      expect(await clone.name()).to.equal(name);
      expect(await clone.symbol()).to.equal(symbol);
      const drop = await clone.tokenDrop(0);
      expect(drop.maxTokens).to.equal(maxTokens);
      expect(drop.tokenPrice).to.equal(tokenPrice);
      expect(drop.maxTokensPerOwner).to.equal(maxTokensPerOwner);
      expect(drop.presaleStart).to.equal(presaleStart);
      expect(drop.presaleEnd).to.equal(presaleEnd);
      expect(drop.saleStart).to.equal(saleStart);

      const [start, end] = await clone.tokenRange();
      expect(start).to.equal(startTokenId);
      expect(end).to.equal(endTokenId);
    });

    it("should optionally set configuration for a token gate", async () => {
      const gateNFT = await deployMockERC721();
      const freshNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
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
          tokenGateConfig: {
            tokenAddress: gateNFT.address,
            minBalance: 1337,
            saleType: 2,
          }
        }
      );

      const { tokenGate } = await freshNFT.tokenDrop(0);
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
      const freshNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
        payoutAddress,
        oracle.address,
        contractURI,
        metadataURI,
        {
          maxTokens,
          tokenPrice: ethers.utils.parseEther('13.37'), // $13.37 USD
          maxTokensPerOwner,
          presaleMerkleRoot,
          presaleStart,
          presaleEnd,
          saleStart,
          saleEnd,
          tokenGateConfig
        }
      );

      expect(await freshNFT.tokenPrice(0)).to.equal(
        ethers.utils.parseEther('13.37').div(1500) // $13.37 USD / ETH @ $1500.00 USD
      );
    });
  });

  describe("mintFee()", async () => {
    it("should return the mint fee", async () => {
      const fixedFee = ethers.utils.parseEther('0.0005'); // $1.00 USD in ETH at $2000 USD
      const commissionBPS = 10_00; // 10% in BPS
      const feeManager = await deployContract('FeeManager', [fixedFee, commissionBPS]);

      const freshNFT: Contract = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
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

      expect(await freshNFT.mintFee(0, 1)).to.equal(fixedFee);
    });
  });

  describe("mint()", async () => {
    before(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      const sdk = await deployDCNTSDK();
      nft = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
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
    });

    it("should not allow mints until after the start date", async () => {
      await expect(nft.connect(addr1).mint(0, addr1.address, 1)).to.be.revertedWithCustomError(
        nft,
        'SaleNotActive'
      );
      await theFuture.travel(theFuture.oneDay);
      await theFuture.arrive();
    });

    it("should not allow more than 2 mints per owner", async () => {
      await expect(
        nft.connect(addr2).mint(0, addr2.address, 3, { value: tokenPrice.mul(3) })
      ).to.be.revertedWithCustomError(
        nft,
        'MintExceedsMaxTokensPerOwner'
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
      await expect(
        nft.connect(addr4).mint(0, addr4.address, 1, { value: tokenPrice })
      ).to.be.revertedWithCustomError(
        nft,
        'MintExceedsMaxSupply'
      );
    });

    it("should payout fees and commission to the optional fee manager", async () => {
      const fixedFee = ethers.utils.parseEther('0.0005'); // $1.00 USD in ETH at $2000 USD
      const commissionBPS = 10_00; // 10% in BPS
      const feeManager = await deployContract('FeeManager', [fixedFee, commissionBPS]);

      const freshNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
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

      expect(await freshNFT.mintFee(0, 1)).to.equal(fixedFee);
      expect(await feeManager.fee()).to.equal(fixedFee);

      const initialBalance = await ethers.provider.getBalance(feeManager.address);
      expect(initialBalance).to.equal(0);

      await freshNFT.mint(0, addr1.address, 1, { value: tokenPrice.add(fixedFee) });
      const commission = tokenPrice.mul(commissionBPS).div(100_00);
      const totalFees = commission.add(fixedFee);
      const finalBalance = await ethers.provider.getBalance(feeManager.address);
      expect(finalBalance).to.equal(totalFees);
    });

    it("should refund excess gas to the caller to allow for slippage", async () => {
      const decimals = 2 + Math.floor(Math.random() * (35)) // random precision 10^2 through 10^36
      const ethPrice = ethers.BigNumber.from('1500' + '0'.repeat(decimals)); // ETH @ $1500.00 USD
      const oracle = await deployContract('MockV3Aggregator', [decimals, ethPrice]);
      const freshNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
        payoutAddress,
        oracle.address,
        contractURI,
        metadataURI,
        {
          maxTokens,
          tokenPrice: ethers.utils.parseEther('13.37'), // $13.37 USD
          maxTokensPerOwner,
          presaleMerkleRoot,
          presaleStart,
          presaleEnd,
          saleStart,
          saleEnd,
          tokenGateConfig
        }
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
      const freshNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
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
          tokenGateConfig: {
            tokenAddress: gateNFT.address,
            minBalance: 1,
            saleType: 0,
          }
        }
      );

      await expect(
        freshNFT.mint(0, addr1.address, 1, { value: tokenPrice })
      ).to.be.revertedWithCustomError(
        freshNFT,
        'TokenGateDenied'
      );
      await gateNFT.mintNft(1);
      await freshNFT.mint(0, addr1.address, 1, { value: tokenPrice });
      expect(await freshNFT.balanceOf(addr1.address, 0)).to.equal(1);
    });
  });

  describe("mintBatch()", async () => {
    it("should allow minting a batch of tokens", async () => {
      const fixedFee = ethers.utils.parseEther('0.0005'); // $1.00 USD in ETH at $2000 USD
      const commissionBPS = 10_00; // 10% in BPS
      const feeManager = await deployContract('FeeManager', [fixedFee, commissionBPS]);

      const freshNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        1,  // startTokenId
        10, // endTokenId
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

      const numDrops = 10;
      const owners = Array(numDrops).fill(addr1.address);
      const tokenIds = Array.from(Array(numDrops), (e, i) => i + 1);
      const quantities = Array(numDrops).fill(ethers.BigNumber.from(1));
      const mintFee = await freshNFT.mintFee(1, 10);
      const totalCost = tokenPrice.mul(10).add(mintFee)

      await freshNFT.mintBatch(
        addr1.address,
        tokenIds,
        quantities,
        { value: totalCost }
      );

      const balances = await freshNFT.balanceOfBatch(owners,tokenIds);
      expect(balances).to.eql(quantities);
    });

    it("should allow minting batches with dynamic pricing using price feed oracles", async () => {
      const decimals = 2 + Math.floor(Math.random() * (35)) // random precision 10^2 through 10^36
      const ethPrice = ethers.BigNumber.from('1500' + '0'.repeat(decimals)); // ETH @ $1500.00 USD
      const oracle = await deployContract('MockV3Aggregator', [decimals, ethPrice]);
      const freshNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        1,  // startTokenId
        10, // endTokenId
        royaltyBPS,
        feeManager,
        payoutAddress,
        oracle.address,
        contractURI,
        metadataURI,
        {
          maxTokens,
          tokenPrice: ethers.utils.parseEther('13.37'), // $13.37 USD
          maxTokensPerOwner,
          presaleMerkleRoot,
          presaleStart,
          presaleEnd,
          saleStart,
          saleEnd,
          tokenGateConfig
        }
      );

      const currentPrice = await freshNFT.tokenPrice(1);
      expect(currentPrice).to.equal(
        ethers.utils.parseEther('13.37').div(1500) // $13.37 USD / ETH @ $1500.00 USD
      );

      const numDrops = 10;
      const owners = Array(numDrops).fill(addr1.address);
      const tokenIds = Array.from(Array(numDrops), (e, i) => i + 1);
      const quantities = Array(numDrops).fill(ethers.BigNumber.from(1));
      const mintFee = await freshNFT.mintFee(1, 10);
      const totalCost = currentPrice.mul(10).add(mintFee);

      await freshNFT.mintBatch(
        addr1.address,
        tokenIds,
        quantities,
        { value: totalCost }
      );

      const balances = await freshNFT.balanceOfBatch(owners,tokenIds);
      expect(balances).to.eql(quantities);
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
      await expect(nft.connect(addr2).burn(0, 1)).to.be.revertedWithCustomError(
        nft,
        'BurnExceedsOwnedTokens'
      );
    });
  });

  describe("mintAirdrop()", async () => {
    it("should mint tokens to the specified recipients", async () => {
      const freshNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
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
      await expect(nft.mintAirdrop(0, [addr1.address])).to.be.revertedWithCustomError(
        nft,
        'AirdropExceedsMaxSupply'
      );
    });

    it("should prevent non-admin from minting an airdrop", async () => {
      await expect(nft.connect(addr2).mintAirdrop(0, [])).to.be.revertedWithCustomError(
        nft,
        'OnlyAdmin'
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

      presaleNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
        payoutAddress,
        currencyOracle,
        contractURI,
        metadataURI,
        {
          maxTokens: 20,
          tokenPrice,
          maxTokensPerOwner,
          presaleMerkleRoot: tree.getHexRoot(),
          presaleStart: theFuture.time(),
          presaleEnd: theFuture.time() + theFuture.oneDay,
          saleStart: theFuture.time() + theFuture.oneMonth,
          saleEnd: theFuture.time() + theFuture.oneYear,
          tokenGateConfig
        }
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
        ).to.be.revertedWithCustomError(presaleNFT, 'PresaleVerificationFailed');
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
        ).to.be.revertedWithCustomError(presaleNFT, 'MintExceedsMaxTokensPerOwner');
      }

      expect(await presaleNFT.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await presaleNFT.balanceOf(addr2.address, 0)).to.equal(2);
    });
  });

  describe("pause()", async () => {
    it("should prevent non-admin from pausing", async () => {
      await expect(nft.connect(addr2).pause()).to.be.revertedWithCustomError(
        nft,
        'OnlyAdmin'
      );
    });

    it("should prevent a user from minting", async () => {
      await nft.pause();
      await expect(nft.connect(addr1).mint(0, addr1.address, 1)).to.be.revertedWithCustomError(
        nft,
        'Paused'
      );
      await nft.unpause();
    });
  });

  describe("safeTransferFrom()", async () => {
    it('should allow transfers by the owner or approved operator', async function () {
      const freshNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
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
      const freshNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        true, // isSoulbound
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
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

      await freshNFT.mint(0, addr1.address, 1, { value: tokenPrice });
      await expect(
        freshNFT.safeTransferFrom(addr1.address, addr2.address, 0, 1, [])
      ).to.be.revertedWithCustomError(freshNFT, 'CannotTransferSoulbound');
    });
  });

  describe("setTokenDrops()", async () => {
    it("should increase the token range", async () => {
      let start, endBefore, endAfter;
      [start, endBefore] = await nft.tokenRange();
      await nft.setTokenDrops(10, {
          tokenIds: [],
          tokenIdDropIds: [],
          dropIds: [],
          drops: [],
      });
      [start, endAfter] = await nft.tokenRange();
      expect(endAfter).to.equal(endBefore.add(10))
    });

    it("should handle setting drops with a rolling release schedule", async () => {
      const freshNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        0,
        4,
        royaltyBPS,
        feeManager,
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
          saleStart: theFuture.time(),
          saleEnd: theFuture.time() + theFuture.oneDay,
          tokenGateConfig
        },
        {
          tokenIds: [1,2,3,4],
          tokenIdDropIds: [1,2,3,4],
          dropIds: [1,2,3,4],
          drops: Array(4).fill(0).map((e, i) => {
            const saleStart = theFuture.time() + (theFuture.oneDay*(i+1));
            const saleEnd = theFuture.time() + (theFuture.oneDay*(i+2));
            return {
              maxTokens,
              tokenPrice,
              maxTokensPerOwner,
              presaleMerkleRoot: presaleMerkleRoot || ethers.constants.HashZero,
              presaleStart,
              presaleEnd,
              saleStart,
              saleEnd,
              tokenGate: tokenGateConfig
            }
          }),
        }
      );

      for ( let i = 1; i <= 4; i++ ) {
        const drop = await freshNFT.tokenDrop(i);

        await expect(
          freshNFT.mint(i, addr1.address, 1, { value: tokenPrice })
        ).to.be.revertedWithCustomError(freshNFT, 'SaleNotActive');

        await theFuture.travel(theFuture.oneDay);
        await theFuture.arrive();
        await freshNFT.mint(i, addr1.address, 1, { value: tokenPrice });
      }

      const numDrops = 4;
      const owners = Array(numDrops).fill(addr1.address);
      const tokenIds = Array.from(Array(numDrops), (e, i) => i + 1);
      const quantities = Array(numDrops).fill(ethers.BigNumber.from(1));
      const balances = await freshNFT.balanceOfBatch(owners,tokenIds);
      expect(balances).to.eql(quantities);
    });

    it("should override drop configurations for specified tokens", async () => {
      const freshNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        startTokenId,
        1337,
        royaltyBPS,
        feeManager,
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

      const defaultDrop = await freshNFT.tokenDrop(0);
      expect(defaultDrop.maxTokens).to.equal(maxTokens);

      await freshNFT.setTokenDrops(0, {
        tokenIds: [1337],
        tokenIdDropIds: [1337],
        dropIds: [1337],
        drops: [{
          maxTokens: maxTokens*2,
          tokenPrice,
          maxTokensPerOwner,
          presaleMerkleRoot: ethers.constants.HashZero,
          presaleStart,
          presaleEnd,
          saleStart,
          saleEnd,
          tokenGate: tokenGateConfig
        }]
      });

      const drop = await freshNFT.tokenDrop(1337);
      expect(drop.maxTokens).to.equal(maxTokens*2);
    });

    it("should adjust the cap on nfts with an adjustable cap", async () => {
      let drop = await nft.tokenDrop(0);
      expect(drop.maxTokens).to.equal(maxTokens);

      await nft.setTokenDrops(0, {
        tokenIds: [],
        tokenIdDropIds: [],
        dropIds: [0],
        drops: [{
          maxTokens: maxTokens*2,
          tokenPrice,
          maxTokensPerOwner,
          presaleMerkleRoot: ethers.constants.HashZero,
          presaleStart,
          presaleEnd,
          saleStart,
          saleEnd,
          tokenGate: tokenGateConfig
        }]
      });

      drop = await nft.tokenDrop(0);
      expect(drop.maxTokens).to.equal(maxTokens*2);
    });

    it("should prevent adjusting the caps on nfts without adjustable caps", async () => {
      const freshNFT = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        false, // hasAdjustableCaps
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
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

      let drop = await freshNFT.tokenDrop(0);
      expect(drop.maxTokens).to.equal(maxTokens);

      await expect(
        freshNFT.setTokenDrops(0, {
          tokenIds: [],
          tokenIdDropIds: [],
          dropIds: [0],
          drops: [{
            maxTokens: maxTokens*2,
            tokenPrice,
            maxTokensPerOwner,
            presaleMerkleRoot: ethers.constants.HashZero,
            presaleStart,
            presaleEnd,
            saleStart,
            saleEnd,
            tokenGate: tokenGateConfig
          }]
        })
      ).to.be.revertedWithCustomError(
        freshNFT,
        'CapsAreLocked'
      );

      drop = await freshNFT.tokenDrop(0);
      expect(drop.maxTokens).to.equal(maxTokens);

      await expect(
        freshNFT.setTokenDrops(0, {
          tokenIds: [],
          tokenIdDropIds: [],
          dropIds: [0],
          drops: [{
            maxTokens: maxTokens*2,
            tokenPrice,
            maxTokensPerOwner,
            presaleMerkleRoot: ethers.constants.HashZero,
            presaleStart,
            presaleEnd,
            saleStart,
            saleEnd,
            tokenGate: tokenGateConfig
          }]
        })
      ).to.be.revertedWithCustomError(
        freshNFT,
        'CapsAreLocked'
      );
    });

    it("should prevent non-admin from setting drops", async () => {
      await expect(
        nft.connect(addr2).setTokenDrops(0, {
          tokenIds: [],
          tokenIdDropIds: [],
          dropIds: [0],
          drops: [{
            maxTokens,
            tokenPrice,
            maxTokensPerOwner,
            presaleMerkleRoot: ethers.constants.HashZero,
            presaleStart,
            presaleEnd,
            saleStart,
            saleEnd,
            tokenGate: tokenGateConfig
          }]
        })
      ).to.be.revertedWithCustomError(
        nft,
        'OnlyAdmin'
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

      splitMain = await deployContract('SplitMain');
      await nft.createSplit(splitMain.address, ...split);
      await expect(nft.withdraw()).to.be.revertedWithCustomError(nft, 'SplitsAreActive');
    });
  });

  describe("distributeAndWithdraw()", async () => {
    before(async () => {
      nft = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
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
      await nft.mint(0, addr1.address, 1, { value: tokenPrice });
    });

    it("should transfer ETH to the split, distribute to receipients, and withdraw", async () => {
      await nft.createSplit(splitMain.address, ...split);
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
      const freshNFT: Contract = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
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
      const freshNFT: Contract = await deployDCNTSeries(
        sdk,
        name,
        symbol,
        hasAdjustableCaps,
        isSoulbound,
        startTokenId,
        endTokenId,
        royaltyBPS,
        feeManager,
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

      await freshNFT.mint(0, addr1.address, 1, { value: tokenPrice });

      const ownerRoyalty = await freshNFT.royaltyInfo(0, tokenPrice);
      expect(ownerRoyalty.receiver).to.eq(owner.address);

      await freshNFT.createSplit(splitMain.address, ...split);
      const splitRoyalty = await freshNFT.royaltyInfo(0, tokenPrice);
      expect(splitRoyalty.receiver).to.eq(await freshNFT.splitWallet());
    });
  });

});
