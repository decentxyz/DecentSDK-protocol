import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

export const theFuture = (() => {
  // the future is now
  let future = Math.floor((new Date()).getTime() / 1000);
  return {
    // an arbitrary point in the future
    time: () => {
      return future;
    },
    // travel to the future, arrival on next block mined
    travel: async (travel: number = 0) => {
      await ethers.provider.send('evm_setNextBlockTimestamp', [future += travel]);
      return future;
    },
    // mine a block in the future
    arrive: async () => {
      if ( future > await time.latest() ) {
        await ethers.provider.send('evm_mine', []);
      }
    },
    oneDay: 60 * 60 * 24,
    oneMonth: 60 * 60 * 24 * 30,
    oneYear: 60 * 60 * 24 * 365,
  };
})();

export type Implementations = {
  DCNT721A: Contract;
  DCNT4907A: Contract;
  DCNTCrescendo: Contract;
  DCNTVault: Contract;
  DCNTStaking: Contract;
};

export const deployDCNTSDK = async (
  implementations?: Implementations
) => {
  implementations = implementations ?? await deployImplementations();
  const decentSDKFactory = await ethers.getContractFactory('DCNTSDK');
  const decentSDK = await decentSDKFactory.deploy(
    implementations.DCNT721A.address,
    implementations.DCNT4907A.address,
    implementations.DCNTCrescendo.address,
    implementations.DCNTVault.address,
    implementations.DCNTStaking.address,
  );
  return await decentSDK.deployed();
}

export const deployDCNTMetadataRenderer = async (
  implementations?: Implementations
) => {
  implementations = implementations ?? await deployImplementations();
  const sharedNFTLogic = await deploySharedNFTLogic();
  console.log("SharedNFTLogic deployed to: ", sharedNFTLogic.address);
  const decentMetadataRendererFactory = await ethers.getContractFactory('DCNTMetadataRenderer');
  const decentMetadataRenderer = await decentMetadataRendererFactory.deploy(sharedNFTLogic.address);
  return await decentMetadataRenderer.deployed();
}

export const deploySharedNFTLogic = async (
  implementations?: Implementations
) => {
  implementations = implementations ?? await deployImplementations();
  const decentMetadataRendererFactory = await ethers.getContractFactory('SharedNFTLogic');
  const decentMetadataRenderer = await decentMetadataRendererFactory.deploy();
  return await decentMetadataRenderer.deployed();
}

export const deployImplementations = async () => {
  const DCNT721A = await deployContract('DCNT721A');
  const DCNT4907A = await deployContract('DCNT4907A');
  const DCNTCrescendo = await deployContract('DCNTCrescendo');
  const DCNTVault = await deployContract('DCNTVault');
  const DCNTStaking = await deployContract('DCNTStaking');
  return {
    DCNT721A,
    DCNT4907A,
    DCNTCrescendo,
    DCNTVault,
    DCNTStaking
  };
}

export const deployContract = async (contract: string) => {
  const factory = await ethers.getContractFactory(contract);
  const tx = await factory.deploy();
  return await tx.deployed();
}

export const deployDCNT721A = async (
  decentSDK: Contract,
  name: string,
  symbol: string,
  maxTokens: number,
  tokenPrice: BigNumber,
  maxTokenPurchase: number
) => {
  const deployTx = await decentSDK.deployDCNT721A(
    name,
    symbol,
    maxTokens,
    tokenPrice,
    maxTokenPurchase
  );

  const receipt = await deployTx.wait();
  const address = receipt.events.find((x: any) => x.event === 'DeployDCNT721A').args.DCNT721A;
  return ethers.getContractAt("DCNT721A", address);
}

export const deployDCNT4907A = async (
  decentSDK: Contract,
  name: string,
  symbol: string,
  maxTokens: number,
  tokenPrice: BigNumber,
  maxTokenPurchase: number
) => {
  const deployTx = await decentSDK.deployDCNT4907A(
    name,
    symbol,
    maxTokens,
    tokenPrice,
    maxTokenPurchase
  );

  const receipt = await deployTx.wait();
  const address = receipt.events.find((x: any) => x.event === 'DeployDCNT4907A').args.DCNT4907A;
  return ethers.getContractAt("DCNT4907A", address);
}

export const deployDCNTCrescendo = async (
  decentSDK: Contract,
  name: string,
  symbol: string,
  uri: string,
  initialPrice: BigNumber,
  step1: BigNumber,
  step2: BigNumber,
  hitch: number,
  trNum: number,
  trDenom: number,
  payouts: string
) => {
  const deployTx = await decentSDK.deployDCNTCrescendo(
    name,
    symbol,
    uri,
    initialPrice,
    step1,
    step2,
    hitch,
    trNum,
    trDenom,
    payouts
  );

  const receipt = await deployTx.wait();
  const address = receipt.events.find((x: any) => x.event === 'DeployDCNTCrescendo').args.DCNTCrescendo;
  return ethers.getContractAt('DCNTCrescendo', address);
}

export const deployDCNTVault = async (
  decentSDK: Contract,
  _vaultDistributionTokenAddress: string,
  _nftVaultKeyAddress: string,
  _nftTotalSupply: number,
  _unlockDate: number
) => {
  const deployTx = await decentSDK.deployDCNTVault(
    _vaultDistributionTokenAddress,
    _nftVaultKeyAddress,
    _nftTotalSupply,
    _unlockDate
  );

  const receipt = await deployTx.wait();
  const address = receipt.events.find((x: any) => x.event === 'DeployDCNTVault').args.DCNTVault;
  return ethers.getContractAt("DCNTVault", address);
}

export const deployDCNTStaking = async (
  decentSDK: Contract,
  nft: string,
  token: string,
  vaultDuration: number,
  totalSupply: number
) => {
  const deployTx = await decentSDK.deployDCNTStaking(
    nft,
    token,
    vaultDuration,
    totalSupply
  );

  const receipt = await deployTx.wait();
  const address = receipt.events.find((x: any) => x.event === 'DeployDCNTStaking').args.DCNTStaking;
  return ethers.getContractAt("DCNTStaking", address);
}

export const deployMockERC20 = async (amountToMint: BigNumber | number) => {
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const erc20Token = await MockERC20.deploy(
    "token",
    "TKN",
    amountToMint
  );
  return await erc20Token.deployed();
}

export const deployMockERC721 = async () => {
  const MockERC721 = await ethers.getContractFactory("MockERC721");
  const erc721Token = await MockERC721.deploy(
    "nft",
    "NFT",
  );
  return await erc721Token.deployed();
}
