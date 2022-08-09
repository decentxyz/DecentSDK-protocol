import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";

export type Implementations = {
  nft: Contract;
  crescendo: Contract;
  vault: Contract;
  staking: Contract;
};

export const deploySDK = async (
  implementations?: Implementations
) => {
  implementations = implementations ?? await deployImplementations();
  const decentSDKFactory = await ethers.getContractFactory('DCNTSDK');
  const decentSDK = await decentSDKFactory.deploy(
    implementations.nft.address,
    implementations.crescendo.address,
    implementations.vault.address,
    implementations.staking.address,
  );
  return await decentSDK.deployed();
}

export const deployImplementations = async () => {
  const nft = await deployContract('DCNT721A');
  const crescendo = await deployContract('DCNTCrescendo');
  const vault = await deployContract('DCNTVault');
  const staking = await deployContract('DCNTStaking');
  return { nft, crescendo, vault, staking };
}

export const deployContract = async (contract: string) => {
  const factory = await ethers.getContractFactory(contract);
  const tx = await factory.deploy();
  return await tx.deployed();
}

export const deploy721A = async (
  decentSDK: Contract,
  name: string,
  symbol: string,
  maxTokens: number,
  tokenPrice: BigNumber,
  maxTokenPurchase: number
) => {
  const deployTx = await decentSDK.deploy721A(
    name,
    symbol,
    maxTokens,
    tokenPrice,
    maxTokenPurchase
  );

  const receipt = await deployTx.wait();
  const newNFTAddress = receipt.events.find((x: any) => x.event === 'NewNFT').args[0];
  return ethers.getContractAt("DCNT721A", newNFTAddress);
}

export const deployCrescendo = async (
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
  const deployTx = await decentSDK.deployCrescendo(
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
  const newCrescendoAddress = receipt.events.find((x: any) => x.event === 'NewCrescendo').args[0];
  return ethers.getContractAt('DCNTCrescendo', newCrescendoAddress);
}

export const deployVault = async (
  decentSDK: Contract,
  _vaultDistributionTokenAddress: string,
  _NftWrapperTokenAddress: string,
  _unlockDate: number
) => {
  const deployTx = await decentSDK.deployVault(
    _vaultDistributionTokenAddress,
    _NftWrapperTokenAddress,
    _unlockDate
  );

  const receipt = await deployTx.wait();
  const newVaultAddress = receipt.events.find((x: any) => x.event === 'NewVault').args[0];
  return ethers.getContractAt("DCNTVault", newVaultAddress);
}

export const deployStaking = async (
  decentSDK: Contract,
  nft: string,
  token: string,
  tokenDecimals: number,
  vaultEnd: number
) => {
  const deployTx = await decentSDK.deployStaking(
    nft,
    token,
    tokenDecimals,
    vaultEnd
  );

  const receipt = await deployTx.wait();
  const newNFTAddress = receipt.events.find((x: any) => x.event === 'NewStaking').args[0];
  return ethers.getContractAt("DCNTStaking", newNFTAddress);
}

export const deployTestERC20 = async (amountToMint: BigNumber | number) => {
  const TestERC20 = await ethers.getContractFactory("TestERC20");
  const erc20Token = await TestERC20.deploy(
    "token",
    "TKN",
    amountToMint
  );
  return await erc20Token.deployed();
}

export const deployTestERC721 = async () => {
  const TestERC721 = await ethers.getContractFactory("TestERC721");
  const erc721Token = await TestERC721.deploy(
    "nft",
    "NFT",
  );
  return await erc721Token.deployed();
}
