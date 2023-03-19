import { expect } from "chai";
import { ethers } from "hardhat";
import { before, beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDCNTSDK, deployDCNTCrescendo, theFuture, sortByAddress, deployDCNTMetadataRenderer, deployMockERC721, base64decode } from "../core";

const name = 'Decent';
const symbol = 'DCNT';
const initialPrice = ethers.utils.parseEther('0.05');
const step1 = ethers.utils.parseEther("0.005");
const step2 = ethers.utils.parseEther("0.05");
const hitch = 20;
const takeRateBPS = 15_00;
let unlockDate = theFuture.time() + theFuture.oneYear;
let saleStart = theFuture.time();
const royaltyBPS = 10_00;
const bps = 100_00;
const metadataRendererInit = {
  description: "This is the Decent unit test NFT",
  imageURI: "http://localhost/image.jpg",
  animationURI: "http://localhost/song.mp3",
};
const contractURI = 'http://localhost/contract.json';
const metadataURI = 'http://localhost/{id}.json';

const calculateCurvedBurnReturn = (price: BigNumber) => price.mul(bps-takeRateBPS).div(bps);

describe("DCNTCrescendo", async () => {
  let owner: SignerWithAddress,
      addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      sdk: Contract,
      clone: Contract,
      crescendo: Contract,
      metadataRenderer: Contract,
      split: any[],
      parentIP: Contract;

  before(async () => {
    [owner, addr2] = await ethers.getSigners();
    sdk = await deployDCNTSDK();
    await theFuture.reset();
    saleStart = theFuture.time() + theFuture.oneDay
    parentIP = await deployMockERC721();
    clone = await deployDCNTCrescendo(
      sdk,
      name,
      symbol,
      initialPrice,
      step1,
      step2,
      hitch,
      takeRateBPS,
      unlockDate,
      saleStart,
      royaltyBPS,
      contractURI,
      metadataURI,
      null,
      parentIP.address
    );
  });

  describe("initialize()", async () => {
    it("should have the owner set as the EOA deploying the contract", async () => {
      expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
    });

    it("should initialize state which would otherwise be set in constructor", async () => {
      // public state
      expect(await clone.name()).to.equal(name);
      expect(await clone.symbol()).to.equal(symbol);
      expect(await clone.uri(0)).to.equal(metadataURI);

      //EIP 5553 parent IP
      expect(await clone.parentIP()).to.equal(parentIP.address);

      // private state
      const key = ethers.utils.defaultAbiCoder.encode(["uint256","uint256"],[0,15]);
      const slot = ethers.utils.keccak256(key);
      const expectedInitialPrice = await ethers.provider.getStorageAt(clone.address, slot);
      expect(expectedInitialPrice).to.equal(initialPrice);

      // public state
      expect(await clone.step1()).to.equal(step1);
      expect(await clone.step2()).to.equal(step2);
      expect(await clone.hitch()).to.equal(hitch);
      expect(await clone.takeRateBPS()).to.equal(takeRateBPS);
    });
  });

  describe("buy()", async () => {
    before(async () => {
      crescendo = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        unlockDate,
        saleStart,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit
      );
    });

    it("should not allow sales until after the start date", async () => {
      await expect(crescendo.buy(0)).to.be.revertedWith(
        'Sales are not active yet.'
      );
      await expect(crescendo.sell(0)).to.be.revertedWith(
        'Sales are not active yet.'
      );
      await theFuture.travel(theFuture.oneDay);
      await theFuture.arrive();
    });

    it("should mint the user an nft", async () => {
      await crescendo.buy(0, { value: initialPrice });
      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(initialPrice.add(step1));
      expect(await crescendo.balanceOf(owner.address,0)).to.equal(1);
    });

    it("should increase the total supply", async () => {
      expect(await crescendo.totalSupply(0)).to.equal(1);
    });

    it("should increase contract balance by price of nft", async () => {
      expect(await ethers.provider.getBalance(crescendo.address)).to.equal(initialPrice);
    });

    it("should increase current price by primary step pre-hitch", async () => {
      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(initialPrice.add(step1));
    });

    it("should increase current price by secondary step post-hitch", async () => {
      let price = initialPrice.add(step1);
      for (let i = 2; i <= hitch; i++) {
        await crescendo.buy(0, { value: price });
        price = price.add(step1);
      }

      const postHitch = initialPrice.add(step1.mul(hitch-1)).add(step2);
      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(postHitch);
    });
  });

  describe("sell()", async () => {
    beforeEach(async () => {
      crescendo = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        unlockDate,
        saleStart,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit
      );

      await crescendo.buy(0, { value: initialPrice });
    });

    it("should burn a user's nft", async () => {
      expect(await crescendo.balanceOf(owner.address,0)).to.equal(1);
      await crescendo.sell(0);
      expect(await crescendo.balanceOf(owner.address,0)).to.equal(0);
    });

    it("should decrease the total supply", async () => {
      expect(await crescendo.totalSupply(0)).to.equal(1);
      await crescendo.sell(0);
      expect(await crescendo.totalSupply(0)).to.equal(0);
    });

    it("should decrease contract balance by curved burn rate", async () => {
      expect(await ethers.provider.getBalance(crescendo.address)).to.equal(initialPrice);
      await crescendo.sell(0);
      const returned = calculateCurvedBurnReturn(initialPrice.add(step1));
      expect(await ethers.provider.getBalance(crescendo.address)).to.equal(initialPrice.sub(returned));
    });

    it("should decrease current price by primary step pre-hitch", async () => {
      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(initialPrice.add(step1));
      await crescendo.sell(0);
      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(initialPrice);
    });

    it("should decrease current price by secondary step post-hitch", async () => {
      // buy right up to the hitch
      let price = initialPrice.add(step1);
      for (let i = 2; i <= hitch; i++) {
        await crescendo.buy(0, { value: price });
        price = price.add(step1);
      }

      // first purchase after hitch
      const postHitch = initialPrice.add(step1.mul(hitch-1)).add(step2);
      await crescendo.buy(0, { value: postHitch });

      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(postHitch.add(step2));
      await crescendo.sell(0);
      expect(await crescendo.calculateCurvedMintReturn(1,0)).to.equal(postHitch);
    });
  });

  describe("flipSaleState()", async () => {
    it("should prevent non-owner from flipping state", async () => {
      await expect(crescendo.connect(addr2).flipSaleState()).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });

    it("should prevent a user from buying or selling", async () => {
      await crescendo.flipSaleState();
      await expect(crescendo.buy(0)).to.be.revertedWith(
        'Sale must be active to buy or sell'
      );
      await expect(crescendo.sell(0)).to.be.revertedWith(
        'Sale must be active to buy or sell'
      );
      await crescendo.flipSaleState();
    });
  });

  describe("withdraw()", async () => {
    before(async () => {
      [addr1, addr2, addr3] = await ethers.getSigners();
      crescendo = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        unlockDate,
        saleStart,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit
      );
    });

    it("should withdraw according to the specificed take rate", async () => {
      await crescendo.buy(0, { value: initialPrice });
      const before = await ethers.provider.getBalance(owner.address);

      const tx = await crescendo.withdraw();
      const receipt = await tx.wait();
      const gas = receipt.cumulativeGasUsed * receipt.effectiveGasPrice;

      const after = await ethers.provider.getBalance(owner.address);
      const withdrawn = after.sub(before).add(gas);
      expect(withdrawn).to.equal(initialPrice.div(bps).mul(takeRateBPS));
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

      await crescendo.createSplit(...split);
      await expect(crescendo.withdraw()).to.be.revertedWith('Cannot withdraw with an active split');
    });

    it("should revert if called by an account which is not the owner", async () => {
      await expect(
        crescendo.connect(addr2).withdraw()
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe("withdrawFund()", async () => {
    before(async () => {
      crescendo = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        unlockDate,
        saleStart,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit
      );
      await crescendo.buy(0, { value: initialPrice });
    });

    it("should withdraw all funds to the contract owner", async () => {
      await theFuture.travel(theFuture.oneYear);
      const before = await ethers.provider.getBalance(owner.address);

      const tx = await crescendo.withdrawFund();
      const receipt = await tx.wait();
      const gas = receipt.cumulativeGasUsed * receipt.effectiveGasPrice;

      const after = await ethers.provider.getBalance(owner.address);
      const withdrawn = after.sub(before).add(gas);
      expect(withdrawn).to.equal(initialPrice);
    });


    it("should revert if a split has already been created", async () => {
      await crescendo.createSplit(...split);
      await expect(crescendo.withdrawFund()).to.be.revertedWith('Cannot withdraw with an active split');
    });

    it("should revert if called by an account which is not the owner", async () => {
      await expect(
        crescendo.connect(addr2).withdrawFund()
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it("should revert if crescendo is still locked", async () => {
      crescendo = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        theFuture.time() + theFuture.oneDay,
        saleStart,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit
      );

      await crescendo.buy(0, { value: initialPrice });
      await expect(crescendo.withdrawFund()).to.be.revertedWith('Crescendo is still locked');
    });
  });

  describe("distributeAndWithdraw()", async () => {
    before(async () => {
      unlockDate = theFuture.time() + theFuture.oneYear;
      crescendo = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        unlockDate,
        saleStart,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit
      );
      await crescendo.buy(0, { value: initialPrice });
      await crescendo.createSplit(...split);
    });

    it("should transfer excess liquidity to the split, distribute to receipients, and withdraw", async () => {
      const liquidity = await crescendo.liquidity();
      const before2 = await ethers.provider.getBalance(addr2.address);
      const before3 = await ethers.provider.getBalance(addr3.address);

      await crescendo.distributeAndWithdraw(addr2.address, 1, [], ...split, addr1.address);
      const after2 = await ethers.provider.getBalance(addr2.address);
      expect(after2).to.equal(before2.add(liquidity.div(100).mul(90).sub(1)));

      await crescendo.distributeAndWithdraw(addr3.address, 1, [], ...split, addr1.address);
      const after3 = await ethers.provider.getBalance(addr3.address);
      expect(after3).to.equal(before3.add(liquidity.div(100).mul(10).sub(1)));
    });

    it("should revert if a split has not yet been created", async () => {
      const freshNFT: Contract = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        unlockDate,
        saleStart,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit
      );

      await expect(
        freshNFT.distributeAndWithdraw(addr2.address, 1, [], ...split, addr1.address)
      ).to.be.revertedWith('Split not created yet');
    });
  });

  describe("distributeAndWithdrawFund()", async () => {
    before(async () => {
      crescendo = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        unlockDate,
        saleStart,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit
      );
      await crescendo.buy(0, { value: initialPrice });
      await crescendo.createSplit(...split);
    });

    it("should transfer all funds to the split, distribute to receipients, and withdraw", async () => {
      await theFuture.travel(theFuture.oneYear);
      const before2 = await ethers.provider.getBalance(addr2.address);
      const before3 = await ethers.provider.getBalance(addr3.address);

      await crescendo.distributeAndWithdrawFund(addr2.address, 1, [], ...split, addr1.address);
      const after2 = await ethers.provider.getBalance(addr2.address);
      expect(after2).to.equal(before2.add(initialPrice.div(100).mul(90)));

      await crescendo.distributeAndWithdrawFund(addr3.address, 1, [], ...split, addr1.address);
      const after3 = await ethers.provider.getBalance(addr3.address);
      expect(after3).to.equal(before3.add(initialPrice.div(100).mul(10)));
    });

    it("should revert if a split has not yet been created", async () => {
      const freshNFT: Contract = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        unlockDate,
        saleStart,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit
      );

      await expect(
        freshNFT.distributeAndWithdrawFund(addr2.address, 1, [], ...split, addr1.address)
      ).to.be.revertedWith('Split not created yet');
    });

    it("should revert if crescendo is still locked", async () => {
      crescendo = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        theFuture.time() + theFuture.oneDay,
        saleStart,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit
      );

      await crescendo.buy(0, { value: initialPrice });
      await crescendo.createSplit(...split);

      await expect(
        crescendo.distributeAndWithdrawFund(addr2.address, 1, [], ...split, addr1.address)
      ).to.be.revertedWith('Crescendo is still locked');
    });
  });

  describe("transferFundToSplit()", async () => {
    it("should transfer ETH and ERC20 to the split", async () => {
      await theFuture.travel(theFuture.oneDay);
      await theFuture.arrive();
      expect(await ethers.provider.getBalance(crescendo.address)).to.equal(initialPrice);
      await crescendo.transferFundToSplit(1, []);
      expect(await ethers.provider.getBalance(crescendo.splitWallet())).to.equal(initialPrice);
    });

    it("should revert if a split has not yet been created", async () => {
      crescendo = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        theFuture.time() + theFuture.oneDay,
        saleStart,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit
      );

      await expect(
        crescendo.transferFundToSplit(1, [])
      ).to.be.revertedWith('Split not created yet');
    });

    it("should revert if crescendo is still locked", async () => {
      await crescendo.createSplit(...split);
      await expect(
        crescendo.transferFundToSplit(1, [])
      ).to.be.revertedWith('Crescendo is still locked');
    });
  });

  describe("supportsInterface()", async () => {
    it('should support the interface for ERC2981', async function () {
      expect(await crescendo.supportsInterface('0x2a55205a')).to.eq(true);
    });
  });

  describe("royaltyInfo()", async () => {
    it('should calculate the royalty for the secondary sale', async function () {
      const royalty = await crescendo.royaltyInfo(0, initialPrice);
      expect(royalty.royaltyAmount).to.eq(initialPrice.div(10_000).mul(royaltyBPS));
    });

    it('should set owner as the receiver, unless there is a split', async function () {
      unlockDate = theFuture.time() + theFuture.oneYear;
      const freshNFT: Contract = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        unlockDate,
        saleStart,
        royaltyBPS,
        contractURI,
        metadataURI,
        metadataRendererInit
      );

      await freshNFT.buy(0, { value: initialPrice });

      const ownerRoyalty = await freshNFT.royaltyInfo(0, initialPrice);
      expect(ownerRoyalty.receiver).to.eq(owner.address);

      await freshNFT.createSplit(...split);
      const splitRoyalty = await freshNFT.royaltyInfo(0, initialPrice);
      expect(splitRoyalty.receiver).to.eq(await freshNFT.splitWallet());
    });
  });

  describe("contractURI()", async () => {
    it("should return basic on chain contract-level metadata rendered as a base64 url", async () => {
      const response = await crescendo.contractURI();
      const decoded = base64decode(response);
      const meta = JSON.parse(decoded);

      expect(meta.name).to.equal(name);
      expect(meta.description).to.equal(metadataRendererInit.description);
      expect(meta.image).to.equal(metadataRendererInit.imageURI);
    });

    it("should optionally return an off chain metadata url", async () => {
      const freshNFT: Contract = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        unlockDate,
        saleStart,
        royaltyBPS,
        contractURI,
        metadataURI,
        null
      );

      const response = await freshNFT.contractURI();
      expect(response).to.equal(contractURI);
    });
  });

  describe("metadataRenderer()", async () => {
    before(async () => {
      crescendo = await deployDCNTCrescendo(
        sdk,
        name,
        symbol,
        initialPrice,
        step1,
        step2,
        hitch,
        takeRateBPS,
        unlockDate,
        royaltyBPS,
        saleStart,
        contractURI,
        metadataURI,
        null
      );

      metadataRenderer = await deployDCNTMetadataRenderer();
    });

    it("should have metadataRenderer", async () => {
      expect(await crescendo.metadataRenderer()).to.equal(ethers.constants.AddressZero);
    });

    it("should setMetadataRenderer", async () => {
      await crescendo.setMetadataRenderer(metadataRenderer.address);
      expect(await crescendo.metadataRenderer()).to.equal(metadataRenderer.address);
    });

    it("should revert if non-owner tries to setmetadataRenderer", async () => {
      await expect(crescendo.connect(addr3).setMetadataRenderer(addr3.address)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it("should use metadataRenderer for uri response", async () => {
      expect(await crescendo.metadataRenderer()).to.equal(metadataRenderer.address);
      const nullMetadataRendererURI = "data:application/json;base64,eyJuYW1lIjogIkRlY2VudCAxIiwgImRlc2NyaXB0aW9uIjogIiIsICJwcm9wZXJ0aWVzIjogeyJudW1iZXIiOiAxLCAibmFtZSI6ICJEZWNlbnQifX0=";
      expect(await crescendo.uri(0)).to.equal(nullMetadataRendererURI);
    });

    it("should remove metadata renderer", async () => {
      expect(await crescendo.setMetadataRenderer(ethers.constants.AddressZero))
      expect(await crescendo.metadataRenderer()).to.equal(ethers.constants.AddressZero);
      expect(await crescendo.uri(0)).to.equal(metadataURI);
    });
  });
});
