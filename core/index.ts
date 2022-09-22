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

export type MetadataInit = {
  description: string;
  imageURI: string;
  animationURI: string;
}

export const deployDCNTSDK = async (
  implementations?: Implementations,
  metadataRenderer?: Contract,
  contractRegistry?: Contract,
  splitMain?: Contract,
) => {
  implementations = implementations ?? await deployImplementations();
  metadataRenderer = metadataRenderer ?? await deployDCNTMetadataRenderer();
  contractRegistry = contractRegistry ?? await deployContract('DCNTRegistry');
  splitMain = splitMain ?? await deployContract('SplitMain');
  const decentSDKFactory = await ethers.getContractFactory('DCNTSDK');
  const decentSDK = await decentSDKFactory.deploy(
    implementations.DCNT721A.address,
    implementations.DCNT4907A.address,
    implementations.DCNTCrescendo.address,
    implementations.DCNTVault.address,
    implementations.DCNTStaking.address,
    metadataRenderer.address,
    contractRegistry.address,
    splitMain.address
  );
  return await decentSDK.deployed();
}

export const deployDCNTMetadataRenderer = async () => {
  const sharedNFTLogic = await deployContract('SharedNFTLogic');
  const decentMetadataRendererFactory = await ethers.getContractFactory('DCNTMetadataRenderer');
  const decentMetadataRenderer = await decentMetadataRendererFactory.deploy(sharedNFTLogic.address);
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

export const deployDCNTVaultNFT = async (decentSDK: Contract) => {
  const factory = await ethers.getContractFactory('DCNTVaultNFT');
  const tx = await factory.deploy(decentSDK.address);
  return await tx.deployed();
}

export const deployDCNT721A = async (
  decentSDK: Contract,
  name: string,
  symbol: string,
  maxTokens: number,
  tokenPrice: BigNumber,
  maxTokenPurchase: number,
  royaltyBPS: number,
  metadataURI: string,
  metadata: MetadataInit | null
) => {
  const metadataRendererInit = metadata != null
    ? ethers.utils.AbiCoder.prototype.encode(
        ['string', 'string', 'string'],
        [
          metadata.description,
          metadata.imageURI,
          metadata.animationURI
        ]
      )
    : [];

  const deployTx = await decentSDK.deployDCNT721A(
    {
      name,
      symbol,
      maxTokens,
      tokenPrice,
      maxTokenPurchase,
      royaltyBPS,
    },
    {
      metadataURI,
      metadataRendererInit,
    }
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
  maxTokenPurchase: number,
  royaltyBPS: number,
  metadataURI: string,
  metadata: MetadataInit | null
) => {
  const metadataRendererInit = metadata != null
    ? ethers.utils.AbiCoder.prototype.encode(
        ['string', 'string', 'string'],
        [
          metadata.description,
          metadata.imageURI,
          metadata.animationURI
        ]
      )
    : [];

  const deployTx = await decentSDK.deployDCNT4907A(
    {
      name,
      symbol,
      maxTokens,
      tokenPrice,
      maxTokenPurchase,
      royaltyBPS,
    },
    {
      metadataURI,
      metadataRendererInit,
    }
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
  takeRateBPS: number,
  unlockDate: number,
  royaltyBPS: number,
) => {
  const deployTx = await decentSDK.deployDCNTCrescendo(
    name,
    symbol,
    uri,
    {
      initialPrice,
      step1,
      step2,
      hitch,
      takeRateBPS,
      unlockDate,
    },
    royaltyBPS
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

export const DCNTVaultNFTCreate = async (
  dcntVaultNFT: Contract,
  decentSDK: Contract,
  name: string,
  symbol: string,
  maxTokens: number,
  tokenPrice: BigNumber,
  maxTokenPurchase: number,
  royaltyBPS: number,
  metadataURI: string,
  metadata: MetadataInit | null,
  vaultDistributionTokenAddress: string,
  unlockDate: number,
  supports4907: boolean
) => {
  const metadataRendererInit = metadata != null
    ? ethers.utils.AbiCoder.prototype.encode(
        ['string', 'string', 'string'],
        [
          metadata.description,
          metadata.imageURI,
          metadata.animationURI
        ]
      )
    : [];

  const deployTx = await dcntVaultNFT.create(
    decentSDK.address,
    {
      name,
      symbol,
      maxTokens,
      tokenPrice,
      maxTokenPurchase,
      royaltyBPS,
    },
    {
      metadataURI,
      metadataRendererInit,
    },
    vaultDistributionTokenAddress,
    unlockDate,
    supports4907
  );

  const receipt = await deployTx.wait();

  const nftAddr = receipt.events.find((x: any) => x.event === 'Create').args.nft;
  const nft = await ethers.getContractAt("DCNT721A", nftAddr);

  const vaultAddr = receipt.events.find((x: any) => x.event === 'Create').args.vault;
  const vault = await ethers.getContractAt("DCNTVault", vaultAddr);

  return [nft, vault];
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

export const sortByAddress = (arr: any[]) => arr.sort((a: any, b: any) => {
  return a.address < b.address ? -1 : 1;
});

export const base64decode = (data: string) => {
  let decoded = data.replace('data:application/json;base64,','');
  decoded = Buffer.from(decoded, 'base64').toString('ascii');
  return decoded;
}
