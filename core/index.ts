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
    reset: async () => {
      future = await time.latest();
    },
    oneDay: 60 * 60 * 24,
    oneMonth: 60 * 60 * 24 * 30,
    oneYear: 60 * 60 * 24 * 365,
  };
})();

export type Implementations = {
  DCNT721A: Contract;
  DCNT4907A: Contract;
  DCNTSeries: Contract;
  DCNTCrescendo: Contract;
  DCNTVault: Contract;
  DCNTStaking: Contract;
  ZKEdition: Contract;
};

export type MetadataInit = {
  description: string;
  imageURI: string;
  animationURI: string;
}

export type TokenGateConfig = {
  tokenAddress: string;
  minBalance: number;
  saleType: number;
}

export const deployDCNTSDK = async (
  implementations?: Implementations | null,
  metadataRenderer?: Contract | null,
  contractRegistry?: Contract | null,
) => {
  implementations = implementations ?? await deployImplementations();
  metadataRenderer = metadataRenderer ?? await deployDCNTMetadataRenderer();
  contractRegistry = contractRegistry ?? await deployContract('DCNTRegistry');
  const decentSDKFactory = await ethers.getContractFactory('DCNTSDK');
  const decentSDK = await decentSDKFactory.deploy(
    implementations.DCNT721A.address,
    implementations.DCNT4907A.address,
    implementations.DCNTSeries.address,
    implementations.DCNTCrescendo.address,
    implementations.DCNTVault.address,
    implementations.DCNTStaking.address,
    metadataRenderer.address,
    contractRegistry.address,
    implementations.ZKEdition.address
  );
  return await decentSDK.deployed();
}

export const deployDCNTMetadataRenderer = async (
  sharedNFTLogic?: Contract
) => {
  sharedNFTLogic = sharedNFTLogic ?? await deployContract('SharedNFTLogic');
  const decentMetadataRendererFactory = await ethers.getContractFactory('DCNTMetadataRenderer');
  const decentMetadataRenderer = await decentMetadataRendererFactory.deploy(sharedNFTLogic.address);
  return await decentMetadataRenderer.deployed();
}

export const deployImplementations = async () => {
  const DCNT721A = await deployContract('DCNT721A');
  const DCNT4907A = await deployContract('DCNT4907A');
  const DCNTSeries = await deployContract('DCNTSeries');
  const DCNTCrescendo = await deployContract('DCNTCrescendo');
  const DCNTVault = await deployContract('DCNTVault');
  const DCNTStaking = await deployContract('DCNTStaking');
  const ZKEdition = await deployContract('ZKEdition')
  return {
    DCNT721A,
    DCNT4907A,
    DCNTSeries,
    DCNTCrescendo,
    DCNTVault,
    DCNTStaking,
    ZKEdition
  };
}

export const deployContract = async (contract: string, args: any[] = [], overrides: any = {}) => {
  const factory = await ethers.getContractFactory(contract);
  const tx = await factory.deploy(...args, overrides);
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
  hasAdjustableCap: boolean,
  isSoulbound: boolean,
  maxTokens: number,
  tokenPrice: BigNumber,
  maxTokenPurchase: number,
  presaleMerkleRoot: string | null,
  presaleStart: number,
  presaleEnd: number,
  saleStart: number,
  saleEnd: number | BigNumber,
  royaltyBPS: number,
  payoutAddress: string | null,
  contractURI: string,
  metadataURI: string,
  metadata: MetadataInit | null,
  tokenGateConfig: TokenGateConfig | null,
  parentIP: string = ethers.constants.AddressZero
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
      hasAdjustableCap,
      isSoulbound,
      maxTokens,
      tokenPrice,
      maxTokenPurchase,
      presaleMerkleRoot: presaleMerkleRoot || ethers.constants.HashZero,
      presaleStart,
      presaleEnd,
      saleStart,
      saleEnd,
      royaltyBPS,
      payoutAddress,
    },
    {
      contractURI,
      metadataURI,
      metadataRendererInit,
      parentIP,
    },
    tokenGateConfig || {
      tokenAddress: ethers.constants.AddressZero,
      minBalance: 0,
      saleType: 0,
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
  hasAdjustableCap: boolean,
  isSoulbound: boolean,
  maxTokens: number,
  tokenPrice: BigNumber,
  maxTokenPurchase: number,
  presaleMerkleRoot: string | null,
  presaleStart: number,
  presaleEnd: number,
  saleStart: number,
  saleEnd: number | BigNumber,
  royaltyBPS: number,
  payoutAddress: string | null,
  contractURI: string,
  metadataURI: string,
  metadata: MetadataInit | null,
  tokenGateConfig: TokenGateConfig | null,
  parentIP: string= ethers.constants.AddressZero
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
      hasAdjustableCap,
      isSoulbound,
      maxTokens,
      tokenPrice,
      maxTokenPurchase,
      presaleMerkleRoot: presaleMerkleRoot || ethers.constants.HashZero,
      presaleStart,
      presaleEnd,
      saleStart,
      saleEnd,
      royaltyBPS,
      payoutAddress,
    },
    {
      contractURI,
      metadataURI,
      metadataRendererInit,
      parentIP
    },
    tokenGateConfig || {
      tokenAddress: ethers.constants.AddressZero,
      minBalance: 0,
      saleType: 0,
    }
  );

  const receipt = await deployTx.wait();
  const address = receipt.events.find((x: any) => x.event === 'DeployDCNT4907A').args.DCNT4907A;
  return ethers.getContractAt("DCNT4907A", address);
}

export type DropConfig = {
  maxTokens: number,
  tokenPrice: BigNumber,
  maxTokensPerOwner: number,
  presaleMerkleRoot: string,
  presaleStart: number,
  presaleEnd: number,
  saleStart: number,
  saleEnd: number | BigNumber,
  tokenGateConfig: TokenGateConfig
}

export type DropMap = {
  tokenIds: number[];
  tokenIdDropIds: number[];
  dropIds: number[];
  drops: DropConfig[];
}

export const deployDCNTSeries = async (
  decentSDK: Contract,
  name: string,
  symbol: string,
  hasAdjustableCaps: boolean,
  isSoulbound: boolean,
  startTokenId: number,
  endTokenId: number,
  royaltyBPS: number,
  feeManager: string | null,
  payoutAddress: string | null,
  currencyOracle: string | null,
  contractURI: string,
  metadataURI: string,
  defaultDrop: DropConfig,
  dropOverrides: DropMap | null,
) => {
  const deployTx = await decentSDK.deployDCNTSeries(
    {
      name,
      symbol,
      contractURI,
      metadataURI,
      startTokenId,
      endTokenId,
      royaltyBPS,
      feeManager: feeManager || ethers.constants.AddressZero,
      payoutAddress: payoutAddress || ethers.constants.AddressZero,
      currencyOracle: currencyOracle || ethers.constants.AddressZero,
      isSoulbound,
      hasAdjustableCaps,
    },
    {
      ...defaultDrop,
      presaleMerkleRoot: defaultDrop.presaleMerkleRoot || ethers.constants.HashZero,
      tokenGate: defaultDrop.tokenGateConfig || {
        tokenAddress: ethers.constants.AddressZero,
        minBalance: 0,
        saleType: 0,
      }
    },
    dropOverrides || {
      tokenIds: [],
      tokenIdDropIds: [],
      dropIds: [],
      drops: [],
    }
  );

  const receipt = await deployTx.wait();
  const address = receipt.events.find((x: any) => x.event === 'DeployDCNTSeries').args.DCNTSeries;
  return ethers.getContractAt("DCNTSeries", address);
}

export const deployDCNTCrescendo = async (
  decentSDK: Contract,
  name: string,
  symbol: string,
  initialPrice: BigNumber,
  step1: BigNumber,
  step2: BigNumber,
  hitch: number,
  takeRateBPS: number,
  unlockDate: number,
  saleStart: number,
  royaltyBPS: number,
  contractURI: string,
  metadataURI: string,
  metadata: MetadataInit | null,
  parentIP: string= ethers.constants.AddressZero
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

  const deployTx = await decentSDK.deployDCNTCrescendo(
    {
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
    },
    {
      contractURI,
      metadataURI,
      metadataRendererInit,
      parentIP
    }
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
  hasAdjustableCap: boolean,
  isSoulbound: boolean,
  maxTokens: number,
  tokenPrice: BigNumber,
  maxTokenPurchase: number,
  presaleMerkleRoot: string | null,
  presaleStart: number,
  presaleEnd: number,
  saleStart: number,
  saleEnd: number | BigNumber,
  royaltyBPS: number,
  payoutAddress: string | null,
  contractURI: string,
  metadataURI: string,
  metadata: MetadataInit | null,
  tokenGateConfig: TokenGateConfig | null,
  vaultDistributionTokenAddress: string,
  unlockDate: number,
  supports4907: boolean,
  parentIP: string = ethers.constants.AddressZero
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
      hasAdjustableCap,
      isSoulbound,
      maxTokens,
      tokenPrice,
      maxTokenPurchase,
      presaleMerkleRoot: presaleMerkleRoot || ethers.constants.HashZero,
      presaleStart,
      presaleEnd,
      saleStart,
      saleEnd,
      royaltyBPS,
      payoutAddress,
    },
    {
      contractURI,
      metadataURI,
      metadataRendererInit,
      parentIP
    },
    tokenGateConfig || {
      tokenAddress: ethers.constants.AddressZero,
      minBalance: 0,
      saleType: 0,
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

export const deployZKEdition = async (
  decentSDK: Contract,
  name: string,
  symbol: string,
  hasAdjustableCap: boolean,
  isSoulbound: boolean,
  maxTokens: number,
  tokenPrice: BigNumber,
  maxTokenPurchase: number,
  presaleMerkleRoot: string | null,
  presaleStart: number,
  presaleEnd: number,
  saleStart: number,
  saleEnd: number | BigNumber,
  royaltyBPS: number,
  payoutAddress: string | null,
  contractURI: string,
  metadataURI: string,
  metadata: MetadataInit | null,
  tokenGateConfig: TokenGateConfig | null,
  zkVerifier: string,
  parentIP: string = ethers.constants.AddressZero
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

  const deployTx = await decentSDK.deployZKEdition(
    {
      name,
      symbol,
      hasAdjustableCap,
      isSoulbound,
      maxTokens,
      tokenPrice,
      maxTokenPurchase,
      presaleMerkleRoot: presaleMerkleRoot || ethers.constants.HashZero,
      presaleStart,
      presaleEnd,
      saleStart,
      saleEnd,
      royaltyBPS,
      payoutAddress,
    },
    {
      contractURI,
      metadataURI,
      metadataRendererInit,
      parentIP,
    },
    tokenGateConfig || {
      tokenAddress: ethers.constants.AddressZero,
      minBalance: 0,
      saleType: 0,
    },
    zkVerifier
  );

  const receipt = await deployTx.wait();
  const address = receipt.events.find((x: any) => x.event === 'DeployZKEdition').args.ZKEdition;
  return ethers.getContractAt("ZKEdition", address);
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

export const getSDKAddresses = () => {
  const fs = require('fs');
  const files = new Map();
  files.set('mainnet', '1-mainnet');
  files.set('polygon', '137-polygon');
  files.set('optimism', '10-optimism');
  files.set('arbitrum', '42161-arbitrum');
  files.set('goerli', '5-goerli');
  files.set('sepolia', '11155111-sepolia');
  files.set('polygon_testnet', '80001-polygonMumbai');
  files.set('optimism_testnet', '420-optimismGoerli');
  files.set('arbitrum_testnet', '421613-arbitrumGoerli');
  files.set('hardhat', '31337-hardhat');
  files.set('localhost', '31337-hardhat');
  const file = files.get(network.name);
  var path = process.env.PWD + '/addresses/';
  var addresses = JSON.parse(fs.readFileSync(`${path}${file}.json`, 'utf8'));
  return addresses;
}
