import { ethers, network } from "hardhat";
import { deployContract } from "../core";

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

async function main() {
  const fees = getFees();
  console.log(fees);
  const FeeManager = await deployContract('FeeManager', [
    ethers.utils.parseEther(fees.fee),
    fees.commissionBPS,
  ]);

  console.log("FeeManager deployed to: ", FeeManager.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
