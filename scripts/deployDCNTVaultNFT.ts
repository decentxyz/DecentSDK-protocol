import { ethers } from "hardhat";
import { deployDCNTVaultNFT } from "../core";

// set up DCNTSDK
const DCNTSDK_ENDPOINT = '';

async function main() {
  const DCNTSDK = await ethers.getContractAt("DCNTSDK", DCNTSDK_ENDPOINT);
  const dcntVaultNFT = await deployDCNTVaultNFT(DCNTSDK);
  console.log("DCNTVaultNFT deployed to: ", dcntVaultNFT.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
