import { ethers, network } from "hardhat";
import { getSDKAddresses } from "../core";
const { execSync } = require('child_process');

const run = (command: string) => {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(error);
  }
}

async function main() {
  const addresses = getSDKAddresses();
  const DCNTSDK = await ethers.getContractAt('DCNTSDK', addresses.DCNTSDK);
  const DCNT721A = await ethers.getContractAt('DCNT721A', addresses.DCNT721A);
  const DCNT4907A = await ethers.getContractAt('DCNT4907A', addresses.DCNT4907A);
  const DCNTSeries = await ethers.getContractAt('DCNTSeries', addresses.DCNTSeries);
  const DCNTCrescendo = await ethers.getContractAt('DCNTCrescendo', addresses.DCNTCrescendo);
  const DCNTVault = await ethers.getContractAt('DCNTVault', addresses.DCNTVault);
  const DCNTStaking = await ethers.getContractAt('DCNTStaking', addresses.DCNTStaking);
  const DCNTMetadataRenderer = await ethers.getContractAt('DCNTMetadataRenderer', addresses.DCNTMetadataRenderer);
  const SharedNFTLogic = await ethers.getContractAt('DCNTMetadataRenderer', await DCNTMetadataRenderer.sharedNFTLogic());
  const DCNTRegistry = await ethers.getContractAt('DCNTRegistry', addresses.DCNTRegistry);
  const DCNTVaultNFT = await ethers.getContractAt('DCNTVaultNFT', addresses.DCNTVaultNFT);
  const DCNTRentalMarket = await ethers.getContractAt('DCNTRentalMarket', addresses.DCNTRentalMarket);
  const ZKEdition = await ethers.getContractAt('ZKEdition', addresses.ZKEdition);

  console.log('\nVerifying DCNTSDK...\n');
  run(`npx hardhat verify --network ${network.name} `
    +`${DCNTSDK.address} `
    +`${DCNT721A.address} `
    +`${DCNT4907A.address} `
    +`${DCNTSeries.address} `
    +`${DCNTCrescendo.address} `
    +`${DCNTVault.address} `
    +`${DCNTStaking.address} `
    +`${DCNTMetadataRenderer.address} `
    +`${DCNTRegistry.address} `
    +`${ZKEdition.address}`
  );

  console.log('\nVerifying DCNT721A...\n');
  await run(`npx hardhat verify --network ${network.name} ${DCNT721A.address}`);

  console.log('\nVerifying DCNT4907A...');
  await run(`npx hardhat verify --network ${network.name} ${DCNT4907A.address}`);

  console.log('\nVerifying DCNTSeries...');
  await run(`npx hardhat verify --network ${network.name} ${DCNTSeries.address}`);

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

  console.log('\nVerifying ZKEdition...\n');
  await run(`npx hardhat verify --network ${network.name} ${ZKEdition.address}\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
