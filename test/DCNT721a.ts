import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNT721A, deployContract, deployMockERC721, theFuture, sortByAddress, base64decode } from "../core";
import { MerkleTree } from "merkletreejs";
const keccak256 = require("keccak256");

const name = 'Decent';
const symbol = 'DCNT';
const hasAdjustableCap = true;
const isSoulbound = false;
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;
const presaleMerkleRoot = null;
const presaleStart = theFuture.time();
const presaleEnd = theFuture.time();
let saleStart = theFuture.time();
const saleEnd = theFuture.time() + theFuture.oneYear;
const royaltyBPS = 10_00;
const payoutAddress = ethers.constants.AddressZero;
const metadataRendererInit = {
  description: "This is the Decent unit test NFT",
  imageURI: "http://localhost/image.jpg",
  animationURI: "http://localhost/song.mp3",
};
const contractURI = "http://localhost/contract/";
const metadataURI = "http://localhost/metadata/";
const tokenGateConfig = {
  tokenAddress: ethers.constants.AddressZero,
  minBalance: 0,
  saleType: 0,
}

describe("DCNT721A", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      nft: Contract,
      presaleNFT: Contract,
      metadataRenderer: Contract,
      splitMain: Contract,
      split: any[],
      parentIP: Contract,
      tree: MerkleTree,
      leaves: string[],
      snapshot: any[];

  let overrides = { value: ethers.utils.parseEther("0.01") };
  let overrides2 = { value: ethers.utils.parseEther("0.02") };
  let overrides3 = { value: ethers.utils.parseEther("0.03") };

  describe("initialize()", async () => {
    before(async () => {
      [owner] = await ethers.getSigners();
      sdk = await deployDCNTSDK();
      parentIP = await deployMockERC721();
      metadataRenderer = await ethers.getContractAt('DCNTMetadataRenderer', sdk.metadataRenderer());
      await theFuture.reset();
      saleStart = theFuture.time() + theFuture.oneDay
      clone = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig,
        parentIP.address
      );
    });

    it("should have the owner set as the EOA deploying the contract", async () => {
      expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
    });

    it("should have the EIP-5553 based parent IP set", async () => {
      expect(await clone.parentIP()).to.equal(parentIP.address);
    });

    it("should optionally allow the EIP-5553 based parent IP to be empty", async () => {
      const nftWithNoParent = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig
      );
      expect(await nftWithNoParent.parentIP()).to.equal(ethers.constants.AddressZero);
    });

    it("should initialize state which would otherwise be set in constructor", async () => {
      expect(await clone.name()).to.equal(name);
      expect(await clone.symbol()).to.equal(symbol);
      expect(await clone.hasAdjustableCap()).to.equal(hasAdjustableCap);
      expect(await clone.isSoulbound()).to.equal(isSoulbound);
      expect(await clone.MAX_TOKENS()).to.equal(maxTokens);
      expect(await clone.tokenPrice()).to.equal(tokenPrice);
      expect(await clone.maxTokenPurchase()).to.equal(maxTokenPurchase);
      expect(await clone.presaleStart()).to.equal(presaleStart);
      expect(await clone.presaleEnd()).to.equal(presaleEnd);
      expect(await clone.saleStart()).to.equal(saleStart);
    });

    it("should initialize the edition with the metadata renderer", async () => {
      const response = await metadataRenderer.tokenURITarget(0, clone.address);
      let decoded = base64decode(response);
      const meta = JSON.parse(decoded);
      expect(meta.name).to.equal(`${name} 0`);
    });

    it("should optionally set the base token URI", async () => {
      clone = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        null,
        tokenGateConfig
      );

      expect(await clone.baseURI()).to.equal(metadataURI);
    });

    it("should optionally set configuration for a token gate", async () => {
      const gateNFT = await deployMockERC721();
      const freshNFT = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        null,
        {
          tokenAddress: gateNFT.address,
          minBalance: 1337,
          saleType: 2,
        }
      );

      const config = await freshNFT.tokenGateConfig();
      expect(config.tokenAddress).to.equal(gateNFT.address);
      expect(config.minBalance).to.equal(1337);
      expect(config.saleType).to.equal(2);
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
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig
      );
    });

    it("should not allow mints until after the start date", async () => {
      await expect(nft.connect(addr1).mint(addr1.address, 1)).to.be.revertedWith(
        'Sales are not active.'
      );
      await theFuture.travel(theFuture.oneDay);
      await theFuture.arrive();
    });

    it("should not allow more than 2 mints at a time", async () => {
      await expect(nft.connect(addr2).mint(addr2.address, 3, overrides3)).to.be.revertedWith(
        "Exceeded max number per mint"
      );
    });

    it("should allow normal mint progression", async () => {
      await nft.connect(addr2).mint(addr2.address, 1, overrides);
      expect(await nft.ownerOf(0)).to.equal(addr2.address);
    });

    it("should allow additonal mints", async () => {
      await nft.connect(addr3).mint(addr3.address, 2, overrides2);
      expect(await nft.ownerOf(1)).to.equal(addr3.address);
      expect(await nft.ownerOf(2)).to.equal(addr3.address);
      await nft.connect(addr2).mint(addr2.address, 1, overrides);
      expect(await nft.ownerOf(3)).to.equal(addr2.address);
    });

    it("should not allow mints after cap", async () => {
      await expect(nft.connect(addr4).mint(addr4.address, 1, overrides)).to.be.revertedWith(
        "Purchase would exceed max supply"
      );
    });

    it("should allow unlimited mints if maxTokenPurchase is set to 0", async () => {
      const freshNFT: Contract = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        0,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig
      );

      await freshNFT.mint(addr1.address, maxTokens, { value: tokenPrice.mul(maxTokens) });
      expect(await freshNFT.balanceOf(addr1.address)).to.equal(maxTokens);
    });

    it("should optionally use a token gate to restrict mints for all sales", async () => {
      const gateNFT = await deployMockERC721();
      const freshNFT = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        null,
        {
          tokenAddress: gateNFT.address,
          minBalance: 1,
          saleType: 0,
        }
      );

      await expect(freshNFT.mint(addr1.address, 1, { value: tokenPrice })).to.be.revertedWith(
        'do not own required token'
      );
      await gateNFT.mintNft(1);
      await freshNFT.mint(addr1.address, 1, { value: tokenPrice });
      expect(await freshNFT.balanceOf(addr1.address)).to.equal(1);
    });
  });

  describe("mintAirdrop()", async () => {
    it("should mint tokens to the specified recipients", async () => {
      const freshNFT = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig
      );

      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      expect(await freshNFT.balanceOf(addr1.address)).to.equal(0);
      expect(await freshNFT.balanceOf(addr2.address)).to.equal(0);
      expect(await freshNFT.balanceOf(addr3.address)).to.equal(0);
      expect(await freshNFT.balanceOf(addr4.address)).to.equal(0);

      await freshNFT.mintAirdrop([addr1.address, addr2.address, addr3.address, addr4.address]);
      expect(await freshNFT.balanceOf(addr1.address)).to.equal(1);
      expect(await freshNFT.balanceOf(addr2.address)).to.equal(1);
      expect(await freshNFT.balanceOf(addr3.address)).to.equal(1);
      expect(await freshNFT.balanceOf(addr4.address)).to.equal(1);
    });

    it("should prevent an airdrop which would exceed max supply", async () => {
      await expect(nft.mintAirdrop([addr1.address])).to.be.revertedWith(
        'Purchase would exceed max supply'
      );
    });

    it("should prevent non-admin from minting an airdrop", async () => {
      await expect(nft.connect(addr2).mintAirdrop([])).to.be.revertedWith(
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

      presaleNFT = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        20,
        tokenPrice,
        maxTokenPurchase,
        tree.getHexRoot(),
        theFuture.time(),
        theFuture.time() + theFuture.oneDay,
        theFuture.time() + theFuture.oneMonth,
        theFuture.time() + theFuture.oneYear,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig
      );

      expect(await presaleNFT.balanceOf(owner.address)).to.equal(0);


      await presaleNFT.setPresaleMerkleRoot(tree.getHexRoot());

      for ( let i = 0; i < snapshot.length; i++ ) {
        let quantity, maxQuantity;
        quantity = maxQuantity = snapshot[i][1];
        const merkleProof = tree.getHexProof(leaves[i]);
        const allowlist = [addr1, addr2, addr3, addr4];
        await presaleNFT.connect(allowlist[i]).mintPresale(
          quantity,
          maxQuantity,
          tokenPrice,
          merkleProof,
          { value: tokenPrice.mul(quantity) }
        );
      }

      expect(await presaleNFT.balanceOf(addr1.address)).to.equal(1);
      expect(await presaleNFT.balanceOf(addr2.address)).to.equal(2);
      expect(await presaleNFT.balanceOf(addr3.address)).to.equal(3);
      expect(await presaleNFT.balanceOf(addr4.address)).to.equal(4);
    });

    it("should prevent minting without a valid merkle proof", async () => {
      expect(await presaleNFT.balanceOf(addr1.address)).to.equal(1);

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
            quantity,
            maxQuantity,
            tokenPrice,
            merkleProof,
            { value: tokenPrice.mul(quantity) }
          )
        ).to.be.revertedWith('not approved');
      }

      expect(await presaleNFT.balanceOf(addr1.address)).to.equal(1);
      expect(await presaleNFT.balanceOf(addr2.address)).to.equal(2);
    });

    it("should prevent minting more tokens than allowed", async () => {
      expect(await presaleNFT.balanceOf(addr1.address)).to.equal(1);

      for ( let i = 0; i < snapshot.length; i++ ) {
        let quantity, maxQuantity;
        quantity = maxQuantity = snapshot[i][1];
        const merkleProof = tree.getHexProof(leaves[i]);
        const allowlist = [addr1, addr2, addr3, addr4];
        await expect(
          presaleNFT.connect(allowlist[i]).mintPresale(
            1,
            maxQuantity,
            tokenPrice,
            merkleProof,
            { value: tokenPrice }
          )
        ).to.be.revertedWith('minted too many');
      }

      expect(await presaleNFT.balanceOf(addr1.address)).to.equal(1);
      expect(await presaleNFT.balanceOf(addr2.address)).to.equal(2);
    });
  });

  describe("adjustCap()", async() => {
    it("should adjust the cap on nfts with an adjustable cap", async () => {
      expect(await nft.MAX_TOKENS()).to.equal(maxTokens);
      await nft.adjustCap(maxTokens*2);
      expect(await nft.MAX_TOKENS()).to.equal(maxTokens*2);
    });

    it("should prevent adjusting the cap on nfts without an adjustable cap", async () => {
      const freshNFT = await deployDCNT721A(
        sdk,
        name,
        symbol,
        false,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig
      );

      expect(await freshNFT.MAX_TOKENS()).to.equal(maxTokens);
      await expect(freshNFT.adjustCap(maxTokens*2)).to.be.revertedWith(
        'cannot adjust size of this collection'
      );
      expect(await freshNFT.MAX_TOKENS()).to.equal(maxTokens);
    });

    it("should prevent non-admin from adjusting cap", async () => {
      await expect(nft.connect(addr2).adjustCap(0)).to.be.revertedWith(
        'onlyAdmin'
      );
    });
  });

  describe("flipSaleState()", async () => {
    it("should prevent non-admin from flipping state", async () => {
      await expect(nft.connect(addr2).flipSaleState()).to.be.revertedWith(
        'onlyAdmin'
      );
    });

    it("should prevent a user from minting", async () => {
      await nft.flipSaleState();
      await expect(nft.connect(addr1).mint(addr1.address, 1)).to.be.revertedWith(
        'Sale must be active to mint'
      );
      await nft.flipSaleState();
    });
  });

  describe("transferFrom()", async () => {
    it('should allow transfers by the owner or approved operator', async function () {
      const freshNFT = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig
      );

      await freshNFT.mint(addr1.address, 1, { value: tokenPrice });
      expect(await freshNFT.ownerOf(0)).to.equal(addr1.address);

      await freshNFT.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      expect(await freshNFT.ownerOf(0)).to.equal(addr2.address);

      await freshNFT.connect(addr2).approve(addr3.address, 0);
      await freshNFT.connect(addr3).transferFrom(addr2.address, addr4.address, 0);
      expect(await freshNFT.ownerOf(0)).to.equal(addr4.address);

      await expect(
        freshNFT.connect(addr2).transferFrom(addr4.address, addr2.address, 0)
      ).to.be.revertedWithCustomError(freshNFT, 'TransferCallerNotOwnerNorApproved');
    });
  });

  describe("tokenURI()", async () => {
    it("should return basic on chain matadata rendered as a base64 url", async () => {
      const response = await nft.tokenURI(0);
      const decoded = base64decode(response);
      const meta = JSON.parse(decoded);

      expect(meta.name).to.equal(`${name} 0`);
      expect(meta.description).to.equal(metadataRendererInit.description);
      expect(meta.image).to.equal(`${metadataRendererInit.imageURI}?id=0`);
      expect(meta.animation_url).to.equal(`${metadataRendererInit.animationURI}?id=0`);
    });

    it("should optionally return an off chain matadata url", async () => {
      const freshNFT: Contract = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        null,
        tokenGateConfig
      );

      await freshNFT.mint(addr1.address, 1, { value: tokenPrice });
      const response = await freshNFT.tokenURI(0);
      expect(response).to.equal(`${metadataURI}0`);
    });
  });

  describe("contractURI()", async () => {
    it("should return basic on chain contract-level matadata rendered as a base64 url", async () => {
      const response = await nft.contractURI();
      const decoded = base64decode(response);
      const meta = JSON.parse(decoded);

      expect(meta.name).to.equal(name);
      expect(meta.description).to.equal(metadataRendererInit.description);
      expect(meta.image).to.equal(metadataRendererInit.imageURI);
    });

    it("should optionally return an off chain matadata url", async () => {
      const freshNFT: Contract = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        null,
        tokenGateConfig
      );

      const response = await freshNFT.contractURI();
      expect(response).to.equal(contractURI);
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
      expect(withdrawn).to.equal(ethers.utils.parseEther("0.04"));
    });

    it("should optionally withdraw to the payout address", async () => {
      await nft.mint(addr1.address, 2, { value: tokenPrice.mul(2) });
      await nft.setPayoutAddress(addr2.address);
      const before = await addr2.getBalance();
      const tx = await nft.connect(addr1).withdraw();
      const receipt = await tx.wait();
      // const gas = receipt.cumulativeGasUsed * receipt.effectiveGasPrice;
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
      await expect(nft.withdraw()).to.be.revertedWith('Cannot withdraw with an active split');
    });
  });

  describe("distributeAndWithdraw()", async () => {
    before(async () => {
      nft = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig
      );
      await nft.mint(addr1.address, 1, { value: tokenPrice });
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
      const freshNFT: Contract = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig
      );

      await expect(
        freshNFT.distributeAndWithdraw(addr2.address, 1, [], ...split, addr1.address)
      ).to.be.revertedWith('Split not created yet');
    });
  });

  describe("supportsInterface()", async () => {
    it('should support the interface for ERC721', async function () {
      expect(await nft.supportsInterface('0x80ac58cd')).to.eq(true);
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
      const freshNFT: Contract = await deployDCNT721A(
        sdk,
        name,
        symbol,
        hasAdjustableCap,
        isSoulbound,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        presaleMerkleRoot,
        presaleStart,
        presaleEnd,
        saleStart,
        saleEnd,
        royaltyBPS,
        payoutAddress,
        contractURI,
        metadataURI,
        metadataRendererInit,
        tokenGateConfig
      );

      await freshNFT.mint(addr1.address, 1, { value: tokenPrice });

      const ownerRoyalty = await freshNFT.royaltyInfo(0, tokenPrice);
      expect(ownerRoyalty.receiver).to.eq(owner.address);

      await freshNFT.createSplit(splitMain.address, ...split);
      const splitRoyalty = await freshNFT.royaltyInfo(0, tokenPrice);
      expect(splitRoyalty.receiver).to.eq(await freshNFT.splitWallet());
    });
  });
});
