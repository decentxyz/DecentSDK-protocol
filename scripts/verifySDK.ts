import { ethers, network } from "hardhat";
const fs = require('fs');
const { execSync } = require('child_process');

const run = (command: string) => {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(error);
  }
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
  const file = files.get(network.name);
  var path = process.env.PWD + '/addresses/';
  var addresses = JSON.parse(fs.readFileSync(`${path}${file}.json`, 'utf8'));
  return addresses;
}

async function main() {
  const addresses = getSDKAddresses();
  const DCNTSDK = await ethers.getContractAt('DCNTSDK', addresses.DCNTSDK);
  const DCNT721A = await ethers.getContractAt('DCNT721A', addresses.DCNT721A);
  const DCNT4907A = await ethers.getContractAt('DCNT4907A', addresses.DCNT4907A);
  const DCNTCrescendo = await ethers.getContractAt('DCNTCrescendo', addresses.DCNTCrescendo);
  const DCNTVault = await ethers.getContractAt('DCNTVault', addresses.DCNTVault);
  const DCNTStaking = await ethers.getContractAt('DCNTStaking', addresses.DCNTStaking);
  const DCNTMetadataRenderer = await ethers.getContractAt('DCNTMetadataRenderer', addresses.DCNTMetadataRenderer);
  const SharedNFTLogic = await ethers.getContractAt('DCNTMetadataRenderer', await DCNTMetadataRenderer.sharedNFTLogic());
  const DCNTRegistry = await ethers.getContractAt('DCNTRegistry', addresses.DCNTRegistry);
  const DCNTVaultNFT = await ethers.getContractAt('DCNTVaultNFT', addresses.DCNTVaultNFT);
  const DCNTRentalMarket = await ethers.getContractAt('DCNTRentalMarket', addresses.DCNTRentalMarket);
  const SplitMain = await ethers.getContractAt('SplitMain', addresses.SplitMain);

  console.log('\nVerifying DCNTSDK...\n');
  run(`npx hardhat verify --network ${network.name} `
    +`${DCNTSDK.address} `
    +`${DCNT721A.address} `
    +`${DCNT4907A.address} `
    +`${DCNTCrescendo.address} `
    +`${DCNTVault.address} `
    +`${DCNTStaking.address} `
    +`${DCNTMetadataRenderer.address} `
    +`${DCNTRegistry.address} `
    +`${SplitMain.address}`
  );

  console.log('\nVerifying DCNT721A...\n');
  await run(`npx hardhat verify --network ${network.name} ${DCNT721A.address}`);

  console.log('\nVerifying DCNT4907A...');
  await run(`npx hardhat verify --network ${network.name} ${DCNT4907A.address}`);

  console.log('\nVerify DCNTCrescendo...\n');
  await run(`npx hardhat verify --network ${network.name} ${DCNTCrescendo.address}`);

  console.log('\nVerifying DCNTVault...\n');
  await run(`npx hardhat verify --network ${network.name} ${DCNTVault.address}`);

  console.log('\nVerifying DCNTStaking...\n');
  await run(`npx hardhat verify --network ${network.name} ${DCNTStaking.address}`);

  console.log('\nVerifying DCNTRegistry...\n');
  await run(`npx hardhat verify --network ${network.name} ${DCNTRegistry.address}`);

  console.log('\nVerifying SharedNFTLogic...\n');
  await run(`npx hardhat verify --network ${network.name} ${SharedNFTLogic.address}`);

  console.log('\nVerifying DCNTMetadataRenderer...\n');
  await run(`npx hardhat verify --network ${network.name} ${DCNTMetadataRenderer.address} ${SharedNFTLogic.address}`);

  console.log('\nVerifying DCNTVaultNFT...\n');
  await run(`npx hardhat verify --network ${network.name} ${DCNTVaultNFT.address} ${DCNTSDK.address}`);

  console.log('\nVerifying DCNTRentalMarket...\n');
  await run(`npx hardhat verify --network ${network.name} ${DCNTRentalMarket.address}\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
