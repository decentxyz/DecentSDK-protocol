import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNTVault, deployMockERC20, deployMockERC721, theFuture } from "../core";

describe("DCNTVault", async () => {
  let owner: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      token: Contract,
      nft: Contract;

  let addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      vault: Contract,
      unlockedVault: Contract;

  describe("initialize()", async () => {
    before(async () => {
      [owner] = await ethers.getSigners();
      sdk = await deployDCNTSDK();
      nft = await deployMockERC721();
      token = await deployMockERC20(100);
      clone = await deployDCNTVault(
        sdk,
        token.address,
        nft.address,
        100,
        theFuture.time()
      );
    });

    it("should have the owner set as the EOA deploying the contract", async () => {
      expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
    });

    it("should initialize state which would otherwise be set in constructor", async () => {
      expect(ethers.utils.getAddress(await clone.vaultDistributionToken())).to.equal(token.address);
      expect(ethers.utils.getAddress(await clone.nftVaultKey())).to.equal(nft.address);
      expect(await clone.unlockDate()).to.equal(theFuture.time());
    });
  });


  describe("vault functionality", async () => {
    beforeEach(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      sdk = await deployDCNTSDK();
      nft = await deployMockERC721();
      token = await deployMockERC20(100);
      vault = await deployDCNTVault(
        sdk,
        token.address,
        nft.address,
        100,
        theFuture.time()
      );
    })

    it("should have a vault balance of zero", async () => {
      expect(await vault.vaultBalance()).to.equal(0);
    });

    describe("and 50 tokens are added to the vault", async () => {
      it("should have a vault balance of 50", async () => {
        await token.connect(addr1).transfer(vault.address, 50);
        expect(await vault.vaultBalance()).to.equal(50);
      });
    });

    describe("and 50 more tokens are added to the vault", async () => {
      it("should have a vault balance of 100", async () => {
        await token.connect(addr1).transfer(vault.address, 100);
        expect(await vault.vaultBalance()).to.equal(100);
      });
    });
  });

describe("claiming core functionality", async () => {
    before(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      nft = await deployMockERC721();
      token = await deployMockERC20(100);
      let tomorrow = theFuture.time() + theFuture.oneDay;

      // mint 1 nft for 1 address and 2 for 2 more
      await nft.connect(addr1).mintNft(1);
      await nft.connect(addr2).mintNft(2);
      await nft.connect(addr3).mintNft(2);

      vault = await deployDCNTVault(
        sdk,
        token.address,
        nft.address,
        100,
        tomorrow
      );

      // send 100 tokens to the vault
      await token.connect(addr1).transfer(vault.address, 100);
    });

    describe("and the vault is locked", async () => {
      describe("and a user with an nft tries to pull out money", async () => {
        it("should produce a warning preventing this", async () => {
          await expect(vault.claim(addr1.address, 0)).to.be.revertedWith(
            'vault is still locked'
          );
        });
      });

      describe("and a user without an nft tries to pull out money", async () => {
        it("should produce a warning preventing this", async () => {
          await expect(vault.claim(addr4.address, 5)).to.be.revertedWith(
            'vault is still locked'
          );
        });
      });
    });

    before(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      nft = await deployMockERC721();
      token = await deployMockERC20(100);
      let yesterday = theFuture.time() - theFuture.oneDay;

      // set nft portions
      await nft.connect(addr1).mintNft(1);
      await nft.connect(addr2).mintNft(2);
      await nft.connect(addr3).mintNft(2);

      unlockedVault = await deployDCNTVault(
        sdk,
        token.address,
        nft.address,
        5,
        yesterday
      );

      // send 100 tokens to the vault
      await token.connect(addr1).transfer(unlockedVault.address, 100);
    });

    describe("and the vault is unlocked", async () => {
      describe("and a user without any nft keys tries to redeem tokens", async () => {
        it("he would recieve zero tokens", async () => {
          await expect(unlockedVault.claim(addr4.address, 0)).to.be.revertedWith(
            'address does not own token'
          );
        });
      });

      describe("and a user with one nft tries to redeem his tokens (1/5 nfts * 100 tokens)", async () => {
        it("should transfer 20 tokens to the user's account", async () => {
          await unlockedVault.claim(addr1.address, 0);
          expect(await token.balanceOf(addr1.address)).to.equal(20);
        });
      });

      describe("and a user who has already redeemed his tokens tries to redeem again", async () => {
        it("should prevent the user from doing this", async () => {
          await expect(unlockedVault.claim(addr1.address, 0)).to.be.revertedWith(
            'token already claimed'
          );
        });
      });

      describe("and a user with two nfts tries to redeem tokens (2/5 * 100)", async () => {
        it("should should transfer 40 tokens to the user's account", async () => {
          await unlockedVault.claimMany(addr2.address, [1, 2]);
          // balance will equal 40
          expect(await token.balanceOf(addr2.address)).to.equal(40);
        });
      });
    });
  });

  describe("claiming division tests", async () => {
    before(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      nft = await deployMockERC721();
      token = await deployMockERC20(73);
      let yesterday = theFuture.time() - theFuture.oneDay;

      await nft.connect(addr1).mintNft(3);
      await nft.connect(addr2).mintNft(1);
      await nft.connect(addr3).mintNft(1);
      await nft.connect(addr4).mintNft(6);

      unlockedVault = await deployDCNTVault(
        sdk,
        token.address,
        nft.address,
        11,
        yesterday
      );
      await token.connect(addr1).transfer(unlockedVault.address, 73);
    });

    describe("and a user with three of eleven nfts tries to redeem tokens (3 * 73)/11", async () => {
      it("should should transfer 19 tokens to the user's account", async () => {
        await unlockedVault.claimMany(addr1.address, [0, 1, 2]);
        expect(await token.balanceOf(addr1.address)).to.equal(19);
      });
    });

    describe("and he then receives another one and tries to redeem it", async () => {
      it("should should transfer 6 tokens to the user's account (1 * 73)/11", async () => {
        await nft.connect(addr2)["safeTransferFrom(address,address,uint256)"](addr2.address, addr1.address, 3);
        await unlockedVault.claim(addr1.address, 3);
        expect(await token.balanceOf(addr1.address)).to.equal(25);
      });
    });

    describe("and he then receives another one thats already been claimed and tries to redeem it", async () => {
      it("should return an error", async () => {
        await unlockedVault.claim(addr3.address, 4);
        await nft.connect(addr3)["safeTransferFrom(address,address,uint256)"](addr3.address, addr1.address, 4);
        await expect(unlockedVault.claim(addr1.address, 4)).to.be.revertedWith(
          'token already claimed'
        );
      });
    });

    describe("and a user tries to claim an already claimed token", async () => {
      it("should revert with token already claimed", async () => {
        await expect(unlockedVault.claim(addr1.address, 1)).to.be.revertedWith(
          "token already claimed"
        );
      });
    });

    describe("and a user tries to claim one token using claim", async () => {
      it("should show user w balance of 1/11 * 73 tokens (~6)", async () => {
        await unlockedVault.claim(addr4.address, 6);
        expect(await token.balanceOf(addr4.address)).to.equal(6);
      });
    });
  });
});
