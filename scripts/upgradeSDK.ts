import { ethers, network } from "hardhat";
import { deployContract, deployDCNTVaultNFT } from "../core";
const fs = require('fs');

const UPGRADES = {
  DCNTSDK: true,
  DCNT721A: false,
  DCNT4907A: false,
  DCNTCrescendo: false,
  DCNTVault: false,
  DCNTStaking: false,
  DCNTMetadataRenderer: false,
  DCNTRegistry: false,
  DCNTVaultNFT: false,
  DCNTRentalMarket: false,
}

const getSDKAddresses = () => {
  const files = new Map();
  files.set('mainnet', '1-mainnet');
  files.set('polygon', '137-polygon');
  files.set('optimism', '10-optimism');
  files.set('arbitrum', '42161-arbitrum');
  files.set('goerli', '5-goerli');
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

const getUpgradedContractAt = async (contract: string, address: string, args: any[] = []) => {
  let contractKey = contract as keyof typeof UPGRADES;
  if ( UPGRADES[contractKey] ) {
    console.log(`Deploying contract: ${contract}`);
    return await deployContract(contract, args);
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
  const DCNTCrescendo = await getUpgradedContractAt('DCNTCrescendo', addresses.DCNTCrescendo);
  const DCNTVault = await getUpgradedContractAt('DCNTVault', addresses.DCNTVault);
  const DCNTStaking = await getUpgradedContractAt('DCNTStaking', addresses.DCNTStaking);

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
    DCNTCrescendo.address,
    DCNTVault.address,
    DCNTStaking.address,
    DCNTMetadataRenderer.address,
    DCNTRegistry.address,
    addresses.SplitMain
  ]);

  const DCNTVaultNFT = await getUpgradedContractAt('DCNTVaultNFT', addresses.DCNTVaultNFT, [DCNTSDK.address]);

  const DCNTRentalMarket = await getUpgradedContractAt('DCNTRentalMarket', addresses.DCNTRentalMarket);

  const contracts = {
    DCNTSDK: DCNTSDK.address,
    DCNT721A: DCNT721A.address,
    DCNT4907A: DCNT4907A.address,
    DCNTCrescendo: DCNTCrescendo.address,
    DCNTVault: DCNTVault.address,
    DCNTStaking: DCNTStaking.address,
    DCNTMetadataRenderer: DCNTMetadataRenderer.address,
    DCNTRegistry: DCNTRegistry.address,
    DCNTVaultNFT: DCNTVaultNFT.address,
    DCNTRentalMarket: DCNTRentalMarket.address,
    SplitMain: addresses.SplitMain,
  }

  console.log(JSON.stringify(contracts, null, 2),'\n');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
