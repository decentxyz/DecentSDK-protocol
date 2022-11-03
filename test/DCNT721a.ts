import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNT721A,deployMockERC721, sortByAddress, base64decode } from "../core";

const name = 'Decent';
const symbol = 'DCNT';
const maxTokens = 4;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;
const royaltyBPS = 10_00;
const metadataRendererInit = {
  description: "This is the Decent unit test NFT",
  imageURI: "http://localhost/image.jpg",
  animationURI: "http://localhost/song.mp3",
};
const metadataURI = "http://localhost/metadata/";

describe("DCNT721A", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      nft: Contract,
      metadataRenderer: Contract,
      split: any[],
      parentIP: Contract;

  let overrides = { value: ethers.utils.parseEther("0.01") };
  let overrides2 = { value: ethers.utils.parseEther("0.02") };
  let overrides3 = { value: ethers.utils.parseEther("0.03") };

  describe("initialize()", async () => {
    before(async () => {
      [owner] = await ethers.getSigners();
      sdk = await deployDCNTSDK();
      parentIP = await deployMockERC721();
      metadataRenderer = await ethers.getContractAt('DCNTMetadataRenderer', sdk.metadataRenderer());
      clone = await deployDCNT721A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        royaltyBPS,
        metadataURI,
        metadataRendererInit,
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
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        royaltyBPS,
        metadataURI,
        metadataRendererInit,
        
      );
      expect(await nftWithNoParent.parentIP()).to.equal('0x0000000000000000000000000000000000000000');
    });

    it("should initialize state which would otherwise be set in constructor", async () => {
      expect(await clone.name()).to.equal(name);
      expect(await clone.symbol()).to.equal(symbol);
      expect(await clone.MAX_TOKENS()).to.equal(maxTokens);
      expect(await clone.tokenPrice()).to.equal(tokenPrice);
      expect(await clone.maxTokenPurchase()).to.equal(maxTokenPurchase);
    });

    it("should initialize the edition with the metadata renderer", async () => {
      const response = await metadataRenderer.tokenURITarget(0, clone.address);
      let decoded = base64decode(response);
      const meta = JSON.parse(decoded);
      expect(meta.name).to.equal(`${name} 0`);
    });

    it("should allow empty parent IP", async () => {
      clone = await deployDCNT721A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        royaltyBPS,
        metadataURI,
        null,
      );

      expect(await clone.parentIP()).to.equal('0x0000000000000000000000000000000000000000');
    });
    it("should optionally set the base token URI", async () => {
      clone = await deployDCNT721A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        royaltyBPS,
        metadataURI,
        null,
      );

      await clone.flipSaleState();
      await clone.mint(1, { value: tokenPrice });
      expect(await clone.tokenURI(0)).to.equal(`${metadataURI}0`);
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
        maxTokenPurchase,
        royaltyBPS,
        metadataURI,
        metadataRendererInit,
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

    it("should allow unlimited mints if maxTokenPurchase is set to 0", async () => {
      const freshNFT: Contract = await deployDCNT721A(
        sdk,
        name,
        symbol,
        maxTokens,
        tokenPrice,
        maxTokens,
        royaltyBPS,
        metadataURI,
        metadataRendererInit,
      );

      await freshNFT.flipSaleState();
      await freshNFT.mint(maxTokens, { value: tokenPrice.mul(maxTokens) });
      expect(await freshNFT.balanceOf(addr1.address)).to.equal(maxTokens);
    });
  });

  describe("flipSaleState()", async () => {
    it("should prevent non-owner from flipping state", async () => {
      await expect(nft.connect(addr2).flipSaleState()).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
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
        maxTokenPurchase,
        royaltyBPS,
        metadataURI,
        metadataRendererInit,
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
        maxTokenPurchase,
        royaltyBPS,
        metadataURI,
        metadataRendererInit,
      );

      await expect(
        freshNFT.distributeAndWithdraw(addr2.address, 1, [], ...split, addr1.address)
      ).to.be.revertedWith('Split not created yet');
    });
  });

  describe("supportsInterface()", async () => {
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
        maxTokens,
        tokenPrice,
        maxTokenPurchase,
        royaltyBPS,
        metadataURI,
        metadataRendererInit,
      );

      await freshNFT.flipSaleState();
      await freshNFT.mint(1, { value: tokenPrice });

      const ownerRoyalty = await freshNFT.royaltyInfo(0, tokenPrice);
      expect(ownerRoyalty.receiver).to.eq(owner.address);

      await freshNFT.createSplit(...split);
      const splitRoyalty = await freshNFT.royaltyInfo(0, tokenPrice);
      expect(splitRoyalty.receiver).to.eq(await freshNFT.splitWallet());
    });
  });
});
