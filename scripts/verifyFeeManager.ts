import { ethers, network } from "hardhat";
const { execSync } = require('child_process');

const run = (command: string) => {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(error);
  }
}


export const getFees = () => {
  const fees = new Map();
  fees.set('localhost',         { fee: '0.00077', commissionBPS: 0 });
  fees.set('mainnet',           { fee: '0.00077', commissionBPS: 0 });
  fees.set('goerli',            { fee: '0.00077', commissionBPS: 0 });
  fees.set('sepolia',           { fee: '0.00077', commissionBPS: 0 });
  fees.set('polygon',           { fee: '0.81',    commissionBPS: 0 });
  fees.set('polygon_testnet',   { fee: '0.81',    commissionBPS: 0 });
  fees.set('optimism',          { fee: '0.00044', commissionBPS: 0 });
  fees.set('optimism_testnet',  { fee: '0.00044', commissionBPS: 0 });
  fees.set('arbitrum',          { fee: '0.00044', commissionBPS: 0 });
  fees.set('arbitrum_testnet',  { fee: '0.00044', commissionBPS: 0 });
  return fees.get(network.name);
}

export const getFeeManager = () => {
  const feeManagers = new Map();
  feeManagers.set('mainnet', "0x3B1d860AC03aa4FaAC49E1AEd2ca36cEb3dA506C");
  feeManagers.set('polygon', "0x3B1d860AC03aa4FaAC49E1AEd2ca36cEb3dA506C");
  feeManagers.set('optimism', "0x3B1d860AC03aa4FaAC49E1AEd2ca36cEb3dA506C");
  feeManagers.set('arbitrum', "0x3B1d860AC03aa4FaAC49E1AEd2ca36cEb3dA506C");
  feeManagers.set('goerli', "0x97D80ff75F7bddeDb9663a3eC7C5492108466a59");
  feeManagers.set('polygon_testnet', "0x97D80ff75F7bddeDb9663a3eC7C5492108466a59");
  feeManagers.set('optimism_testnet', "0x97D80ff75F7bddeDb9663a3eC7C5492108466a59");
  feeManagers.set('arbitrum_testnet', "0x97D80ff75F7bddeDb9663a3eC7C5492108466a59");
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
