import { ethers, network } from "hardhat";
import { deployContract, getSDKAddresses } from "../core";

const GAS_INCREASE_BPS = 1_00; // 1%

const UPGRADES = {
  DCNTSDK: true,
  DCNT721A: false,
  DCNT4907A: false,
  DCNTSeries: true,
  DCNTCrescendo: false,
  DCNTVault: false,
  DCNTStaking: false,
  DCNTMetadataRenderer: false,
  DCNTRegistry: false,
  DCNTVaultNFT: false,
  DCNTRentalMarket: false,
  ZKEdition: false,
}

const getOverrides = async () => {
  if ( network.name != 'mainnet' && network.name != 'goerli' )  return {};

  const increase = (num: ethers.BigNumber) => num.add(num.mul(GAS_INCREASE_BPS).div(10000));

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = increase(feeData.gasPrice);
  const maxPriorityFeePerGas = increase(feeData.maxPriorityFeePerGas);
  const maxFeePerGas = gasPrice.add(maxPriorityFeePerGas);

  return { gasPrice, maxPriorityFeePerGas, maxFeePerGas };
}

const getUpgradedContractAt = async (contract: string, address: string, args: any[] = []) => {
  let contractKey = contract as keyof typeof UPGRADES;
  if ( UPGRADES[contractKey] ) {
    console.log(`Deploying contract: ${contract}`);
    const overrides = await getOverrides();
    return await deployContract(contract, args, overrides);
  } else {
    console.log(`Existing contract: ${contract}`);
    return await ethers.getContractAt(contract, address);
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();

  var addresses = getSDKAddresses();

  const DCNT721A = await getUpgradedContractAt('DCNT721A', addresses.DCNT721A);
  const DCNT4907A = await getUpgradedContractAt('DCNT4907A', addresses.DCNT4907A);
  const DCNTSeries = await getUpgradedContractAt('DCNTSeries', addresses.DCNTSeries);
  const DCNTCrescendo = await getUpgradedContractAt('DCNTCrescendo', addresses.DCNTCrescendo);
  const DCNTVault = await getUpgradedContractAt('DCNTVault', addresses.DCNTVault);
  const DCNTStaking = await getUpgradedContractAt('DCNTStaking', addresses.DCNTStaking);
  const ZKEdition = await getUpgradedContractAt('ZKEdition', addresses?.ZKEdition);

  let DCNTMetadataRenderer;
  if ( UPGRADES.DCNTMetadataRenderer ) {
    const SharedNFTLogic = await deployContract('SharedNFTLogic');
    DCNTMetadataRenderer = await deployContract('DCNTMetadataRenderer', [SharedNFTLogic.address]);
  } else {
    DCNTMetadataRenderer = await ethers.getContractAt('DCNTMetadataRenderer', addresses.DCNTMetadataRenderer);
  }

  const DCNTRegistry = await getUpgradedContractAt('DCNTRegistry', addresses.DCNTRegistry);

  const DCNTSDK = await getUpgradedContractAt('DCNTSDK', addresses.DCNTSDK, [
    DCNT721A.address,
    DCNT4907A.address,
    DCNTSeries.address,
    DCNTCrescendo.address,
    DCNTVault.address,
    DCNTStaking.address,
    DCNTMetadataRenderer.address,
    DCNTRegistry.address,
    ZKEdition.address,
  ]);

  const DCNTVaultNFT = await getUpgradedContractAt('DCNTVaultNFT', addresses.DCNTVaultNFT, [DCNTSDK.address]);

  const DCNTRentalMarket = await getUpgradedContractAt('DCNTRentalMarket', addresses.DCNTRentalMarket);

  const contracts = {
    DCNTSDK: DCNTSDK.address,
    DCNT721A: DCNT721A.address,
    DCNT4907A: DCNT4907A.address,
    DCNTSeries: DCNTSeries.address,
    DCNTCrescendo: DCNTCrescendo.address,
    DCNTVault: DCNTVault.address,
    DCNTStaking: DCNTStaking.address,
    DCNTMetadataRenderer: DCNTMetadataRenderer.address,
    DCNTRegistry: DCNTRegistry.address,
    DCNTVaultNFT: DCNTVaultNFT.address,
    DCNTRentalMarket: DCNTRentalMarket.address,
    ZKEdition: ZKEdition.address,
  }

  console.log(JSON.stringify(contracts, null, 2),'\n');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
