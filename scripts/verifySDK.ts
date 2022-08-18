const hre = require("hardhat");
import { ethers } from "hardhat";

// set up DCNTSDK
const DCNTSDK_ENDPOINT = '';

async function main() {
  const DCNTSDK = await ethers.getContractAt("DCNTSDK", DCNTSDK_ENDPOINT);
  const DCNT721A = await DCNTSDK.nftImplementation();
  const DCNTCrescendo = await DCNTSDK.crescendoImplementation();
  const DCNTVault = await DCNTSDK.vaultImplementation();
  const DCNTStaking = await DCNTSDK.stakingImplementation();

  console.log('\nVerify DCNTSDK:');
  console.log(`npx hardhat verify --network ${hre.network.name}`,
    DCNTSDK_ENDPOINT,
    DCNT721A,
    DCNTCrescendo,
    DCNTVault,
    DCNTStaking
  );

  console.log('\nVerify DCNT721A:');
  console.log(`npx hardhat verify --network ${hre.network.name} ${DCNT721A}`);

  console.log('\nVerify DCNTCrescendo:');
  console.log(`npx hardhat verify --network ${hre.network.name} ${DCNTCrescendo}`);

  console.log('\nVerify DCNTVault:');
  console.log(`npx hardhat verify --network ${hre.network.name} ${DCNTVault}`);

  console.log('\nVerify DCNTStaking:');
  console.log(`npx hardhat verify --network ${hre.network.name} ${DCNTStaking}\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
