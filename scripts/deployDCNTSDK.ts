import { ethers } from "hardhat";
import { deployDCNTSDK, deployImplementations } from "../core";

async function main() {
  const sdk = await deployDCNTSDK();
  console.log("DCNTSDK deployed to: ", sdk.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
