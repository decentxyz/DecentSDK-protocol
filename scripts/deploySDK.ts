import { ethers } from "hardhat";
import { deploySDK, deployImplementations } from "../core";

async function main() {
  const sdk = await deploySDK();
  console.log("DCNTSDK deployed to: ", sdk.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
