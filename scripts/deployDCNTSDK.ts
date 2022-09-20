import { ethers } from "hardhat";
import { deployDCNTSDK, deployImplementations } from "../core";

// set up splits for the chain you are deploying to
// const SPLIT_MAIN = '';

async function main() {
  // const implementations = await deployImplementations();
  // const splitMain = await ethers.getContractAt('SplitMain', SPLIT_MAIN);
  // const sdk = await deployDCNTSDK(implementations, splitMain);
  const sdk = await deployDCNTSDK();
  console.log("DCNTSDK deployed to: ", sdk.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
