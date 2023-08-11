import { ethers, network } from "hardhat";
import { getFees } from './deployFeeManager';
const { execSync } = require('child_process');

const run = (command: string) => {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(error);
  }
}

export const getFeeManager = () => {
  const feeManagers = new Map();
  feeManagers.set('mainnet', "0x3B1d860AC03aa4FaAC49E1AEd2ca36cEb3dA506C");
  feeManagers.set('polygon', "0x3B1d860AC03aa4FaAC49E1AEd2ca36cEb3dA506C");
  feeManagers.set('optimism', "0x3B1d860AC03aa4FaAC49E1AEd2ca36cEb3dA506C");
  feeManagers.set('arbitrum', "0x3B1d860AC03aa4FaAC49E1AEd2ca36cEb3dA506C");
  feeManagers.set('base', "0x2983589C067B36078Ab65a603D9cE4BFba5e115c");
  feeManagers.set('zora', "0x2983589C067B36078Ab65a603D9cE4BFba5e115c");
  feeManagers.set('goerli', "0x97D80ff75F7bddeDb9663a3eC7C5492108466a59");
  feeManagers.set('sepolia', "0x36C3a2b8550558fe7Eb86541DaFed469CACd2Ff9");
  feeManagers.set('polygon_testnet', "0x97D80ff75F7bddeDb9663a3eC7C5492108466a59");
  feeManagers.set('optimism_testnet', "0x97D80ff75F7bddeDb9663a3eC7C5492108466a59");
  feeManagers.set('arbitrum_testnet', "0x97D80ff75F7bddeDb9663a3eC7C5492108466a59");
  feeManagers.set('base_testnet', "0x2983589C067B36078Ab65a603D9cE4BFba5e115c");
  feeManagers.set('zora_testnet', "0x36C3a2b8550558fe7Eb86541DaFed469CACd2Ff9");
  return feeManagers.get(network.name);
}

async function main() {
  console.log('\nVerifying FeeManager...\n');
  const { fee, commissionBPS } = getFees();
  await run(`npx hardhat verify --network ${network.name} ${getFeeManager()} ${ethers.utils.parseEther(fee)} ${commissionBPS}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
