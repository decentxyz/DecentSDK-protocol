const { network } = require("hardhat");
import { ethers } from "hardhat";

// set up DCNTSDK
const DCNTSDK_ENDPOINT = '0x7Bb8b7e30d5BEa38e0cacC07533aAF0D0ECb60B2';

async function main() {
  const DCNTSDK = await ethers.getContractAt("DCNTSDK", DCNTSDK_ENDPOINT);
  const DCNT721A = await DCNTSDK.DCNT721AImplementation();
  const DCNT4907A = await DCNTSDK.DCNT4907AImplementation();
  const DCNTCrescendo = await DCNTSDK.DCNTCrescendoImplementation();
  const DCNTVault = await DCNTSDK.DCNTVaultImplementation();
  const DCNTStaking = await DCNTSDK.DCNTStakingImplementation();
  const DCNTRegistry = await DCNTSDK.contractRegistry();
  const SplitMain = await DCNTSDK.SplitMain();

  console.log('\nVerify DCNTSDK:');
  console.log(`npx hardhat verify --network ${network.name}`,
    DCNTSDK_ENDPOINT,
    DCNT721A,
    DCNT4907A,
    DCNTCrescendo,
    DCNTVault,
    DCNTStaking,
    DCNTRegistry,
    SplitMain
  );

  console.log('\nVerify DCNT721A:');
  console.log(`npx hardhat verify --network ${network.name} ${DCNT721A}`);

  console.log('\nVerify DCNT4907A:');
  console.log(`npx hardhat verify --network ${network.name} ${DCNT4907A}`);

  console.log('\nVerify DCNTCrescendo:');
  console.log(`npx hardhat verify --network ${network.name} ${DCNTCrescendo}`);

  console.log('\nVerify DCNTVault:');
  console.log(`npx hardhat verify --network ${network.name} ${DCNTVault}`);

  console.log('\nVerify DCNTStaking:');
  console.log(`npx hardhat verify --network ${network.name} ${DCNTStaking}`);

  console.log('\nVerify DCNTRegistry:');
  console.log(`npx hardhat verify --network ${network.name} ${DCNTRegistry}\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
