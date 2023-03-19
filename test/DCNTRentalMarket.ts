import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNT4907A, deployMockERC721, deployContract, theFuture } from "../core";

const rentalPrice = ethers.utils.parseEther('0.01');
const name = 'Decent';
const symbol = 'DCNT';
const hasAdjustableCap = false;
const isSoulbound = false;
const maxTokens = 100;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;
const presaleMerkleRoot = null;
const presaleStart = theFuture.time();
const presaleEnd = theFuture.time();
const saleStart = theFuture.time();
const saleEnd = 2 ** 32 - 1;
const royaltyBPS = 10_00;
const payoutAddress = ethers.constants.AddressZero;
const contractURI = "http://localhost/contract/";
const metadataURI = "http://localhost/metadata/";
const metadataRendererInit = null;
const tokenGateConfig = null;

describe("DCNTRentalMarket", async () => {
  let owner: SignerWithAddress,
      fan: SignerWithAddress,
      renter: SignerWithAddress,
      sdk: Contract,
      nft: Contract,
      rentalMarket: Contract,
      parentIP: Contract

  describe("constructor()", async () => {
    before(async () => {
      [owner, fan, renter] = await ethers.getSigners();
      sdk = await deployDCNTSDK();
      parentIP = await deployMockERC721();
      nft = await deployDCNT4907A(
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
      await nft.connect(fan).mint(fan.address, 1, { value: tokenPrice });
      rentalMarket = await deployContract('DCNTRentalMarket');
    });

    it("should result in a properly deployed contract", async () => {
      expect(rentalMarket.address).to.be.properAddress;
    });
  });

  describe("setRentable()", async () => {
    it("should set the rental details for a specific token", async () => {
      let rentable = await rentalMarket.getRentable(nft.address, 0);
      expect(rentable.isListed).to.equal(false);
      expect(rentable.pricePerDay).to.equal(0);

      await nft.connect(fan).approve(rentalMarket.address, 0);
      await rentalMarket.connect(fan).setRentable(nft.address, 0, true, rentalPrice, 1, 30);
      rentable = await rentalMarket.getRentable(nft.address, 0);
      expect(rentable.isListed).to.equal(true);
      expect(rentable.pricePerDay).to.equal(rentalPrice);
    });

    it("should revert if nft does not support the interface for ERC4907", async () => {
      const mock = await deployMockERC721();
      await mock.connect(fan).mintNft(1);
      await expect(
        rentalMarket.connect(fan).setRentable(mock.address, 0, true, rentalPrice, 1, 30)
      ).to.be.revertedWith('NFT does not support ERC4907');
    });

    it("should revert if the rental market is not approved for token or not an approved operator", async () => {
      await nft.connect(fan).mint(fan.address, 1, { value: tokenPrice });

      await expect(
        rentalMarket.connect(fan).setRentable(nft.address, 1, true, rentalPrice, 1, 30)
      ).to.be.revertedWith('Token is not approved for rentals');

      await nft.connect(fan).approve(rentalMarket.address, 1);
      await rentalMarket.connect(fan).setRentable(nft.address, 1, true, rentalPrice, 1, 30);
      await nft.connect(fan).approve(ethers.constants.AddressZero, 1);

      await expect(
        rentalMarket.connect(fan).setRentable(nft.address, 1, true, rentalPrice, 1, 30)
      ).to.be.revertedWith('Token is not approved for rentals');

      await nft.connect(fan).setApprovalForAll(rentalMarket.address, true);
      await rentalMarket.connect(fan).setRentable(nft.address, 1, true, rentalPrice, 1, 30);
      await nft.connect(fan).setApprovalForAll(rentalMarket.address, false);
    });

    it("should revert if called by an account other than token owner", async () => {
      await expect(
        rentalMarket.connect(renter).setRentable(nft.address, 0, true, rentalPrice, 1, 30)
      ).to.be.revertedWith('Must be token owner to set rentable');
    });
  });

  describe("setRentables()", async () => {
    it("should set the rental details for multiple tokens", async () => {
      const expectRentable = (rentable, expected) => {
        expect(rentable.isListed).to.equal(expected.isListed);
        expect(rentable.pricePerDay).to.equal(expected.pricePerDay);
        expect(rentable.minDays).to.equal(expected.minDays);
        expect(rentable.maxDays).to.equal(expected.maxDays);
      }

      await nft.connect(fan).setApprovalForAll(rentalMarket.address, true);
      await rentalMarket.connect(fan).setRentable(nft.address, 0, false, 0, 7, 14);
      await rentalMarket.connect(fan).setRentable(nft.address, 1, false, 0, 7, 14);

      let expected = { isListed: false, pricePerDay: 0, minDays: 7, maxDays: 14 }
      expectRentable(await rentalMarket.getRentable(nft.address, 0), expected);
      expectRentable(await rentalMarket.getRentable(nft.address, 1), expected);

      await rentalMarket.connect(fan).setRentables([
        {
          nft: nft.address,
          tokenId: 0,
          isListed: true,
          pricePerDay: rentalPrice,
          minDays: 1,
          maxDays: 30
        },
        {
          nft: nft.address,
          tokenId: 1,
          isListed: true,
          pricePerDay: rentalPrice,
          minDays: 1,
          maxDays: 30
        },
      ]);

      expected = { isListed: true, pricePerDay: rentalPrice, minDays: 1, maxDays: 30 }
      expectRentable(await rentalMarket.getRentable(nft.address, 0), expected);
      expectRentable(await rentalMarket.getRentable(nft.address, 1), expected);
    });
  });

  describe("setListed()", async () => {
    it("should toggle the listed state of the rentable", async () => {
      await rentalMarket.connect(fan).setListed(nft.address, 0, false);
      let rentable = await rentalMarket.getRentable(nft.address, 0);
      expect(rentable.isListed).to.equal(false);

      await rentalMarket.connect(fan).setListed(nft.address, 0, true);
      rentable = await rentalMarket.getRentable(nft.address, 0);
      expect(rentable.isListed).to.equal(true);
    });
  });

  describe("setListedBatch()", async () => {
    it("should toggle the listed state of multiple rentables", async () => {
      await rentalMarket.connect(fan).setListedBatch(nft.address, [0,1], false);

      let [rentable0, rentable1] = await rentalMarket.getRentables(nft.address, [0,1]);
      expect(rentable0.isListed).to.equal(false);
      expect(rentable1.isListed).to.equal(false);

      await rentalMarket.connect(fan).setListedBatch(nft.address, [0,1], true);
      [rentable0, rentable1] = await rentalMarket.getRentables(nft.address, [0,1]);
      expect(rentable0.isListed).to.equal(true);
      expect(rentable1.isListed).to.equal(true);
    });
  });

  describe("rent()", async () => {
    it("should allow a user to rent the specified token", async () => {
      await nft.connect(fan).approve(rentalMarket.address, 0);
      await theFuture.travel(theFuture.oneDay);
      await rentalMarket.connect(renter).rent(nft.address, 0, 1, { value: rentalPrice });
      expect(await nft.userOf(0)).to.equal(renter.address);
    });

    it("should set rental expiration to the expected timestamp", async () => {
      expect(await nft.userExpires(0)).to.equal(theFuture.time() + theFuture.oneDay);
    });

    it("should transfer royalty amount to the royalty recipient", async () => {
      await nft.connect(fan).mint(fan.address, 1, { value: tokenPrice });
      await nft.connect(fan).approve(rentalMarket.address, 2);
      await rentalMarket.connect(fan).setRentable(nft.address, 2, true, rentalPrice, 1, 30);

      const before = await ethers.provider.getBalance(owner.address);
      await rentalMarket.connect(renter).rent(nft.address, 2, 1, { value: rentalPrice });
      const after = await ethers.provider.getBalance(owner.address);
      expect(before).to.equal(after.sub(rentalPrice.div(100_00).mul(royaltyBPS)));
    });

    it("should transfer rental fee less royalty amount to the token owner", async () => {
      await nft.connect(fan).approve(rentalMarket.address, 1);
      await rentalMarket.connect(fan).setRentable(nft.address, 1, true, rentalPrice, 1, 30);

      const before = await ethers.provider.getBalance(fan.address);
      await rentalMarket.connect(renter).rent(nft.address, 1, 1, { value: rentalPrice });
      const after = await ethers.provider.getBalance(fan.address);
      expect(before).to.equal(after.sub(rentalPrice.div(100_00).mul(100_00-royaltyBPS)));
    });

    it("should revert if the token has already been rented", async () => {
      await expect(
        rentalMarket.connect(renter).rent(nft.address, 2, 1, { value: rentalPrice })
      ).to.be.revertedWith('Token is already rented');
    });

    it("should revert if the rental market is no longer approved by token owner", async () => {
      await nft.connect(fan).setApprovalForAll(rentalMarket.address, false);
      await nft.connect(fan).mint(fan.address, 1, { value: tokenPrice });
      await nft.connect(fan).approve(rentalMarket.address, 3);
      await rentalMarket.connect(fan).setRentable(nft.address, 3, true, rentalPrice, 1, 30);
      await nft.connect(fan).approve(ethers.constants.AddressZero, 3);

      await expect(
        rentalMarket.connect(renter).rent(nft.address, 3, 1, { value: rentalPrice })
      ).to.be.revertedWith('Token is not approved for rentals');

      await nft.connect(fan).setApprovalForAll(rentalMarket.address, true);
      await rentalMarket.connect(renter).rent(nft.address, 3, 1, { value: rentalPrice })
      await nft.connect(fan).setApprovalForAll(rentalMarket.address, false);

      await nft.connect(fan).mint(fan.address, 1, { value: tokenPrice });
      await expect(
        rentalMarket.connect(renter).rent(nft.address, 4, 1, { value: rentalPrice })
      ).to.be.revertedWith('Token is not approved for rentals');
    });

    it("should revert if the rental fee has not been set", async () => {

      await nft.connect(fan).approve(rentalMarket.address, 4);
      await rentalMarket.connect(fan).setRentable(nft.address, 4, true, 0, 1, 30);

      await expect(
        rentalMarket.connect(renter).rent(nft.address, 4, 1, { value: rentalPrice })
      ).to.be.revertedWith('Rental fee has not been set');
    });

    it("should revert if the amount transferred does not cover the rental fee", async () => {
      await rentalMarket.connect(fan).setRentable(nft.address, 4, true, rentalPrice, 1, 30);

      await expect(
        rentalMarket.connect(renter).rent(nft.address, 4, 1, { value: rentalPrice.sub(1) })
      ).to.be.revertedWith('Not enough funds sent for rental');
    });

    it("should revert if the token owner has disabled rentals", async () => {
      await nft.connect(fan).approve(rentalMarket.address, 4);
      await rentalMarket.connect(fan).setRentable(nft.address, 4, false, rentalPrice, 1, 30);

      await expect(
        rentalMarket.connect(renter).rent(nft.address, 4, 1, { value: rentalPrice })
      ).to.be.revertedWith('Rentals are not active for this token');
    });


    it("should revert if the rental duration is outside of owner specified boundaries", async () => {
      await rentalMarket.connect(fan).setRentable(nft.address, 4, true, rentalPrice, 2, 7);

      await expect(
        rentalMarket.connect(renter).rent(nft.address, 4, 1, { value: rentalPrice })
      ).to.be.revertedWith('Invalid rental duration');

      await expect(
        rentalMarket.connect(renter).rent(nft.address, 4, 8, { value: rentalPrice })
      ).to.be.revertedWith('Invalid rental duration');
    });
  });
});
