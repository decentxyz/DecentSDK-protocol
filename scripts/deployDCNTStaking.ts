import { ethers } from "hardhat";
import { deployDCNTStaking } from "../core";

// set up DCNTSDK
const DCNTSDK_ENDPOINT = '';

// set up DCNTStaking
const nftAddress = ethers.constants.AddressZero;
const tokenAddress = ethers.constants.AddressZero;
const vaultDuration = 100;
const totalSupply = 25;

async function main() {
  const DCNTSDK = await ethers.getContractAt("DCNTSDK", DCNTSDK_ENDPOINT);
  const DCNTStaking = await deployDCNTStaking(
    DCNTSDK,
    nftAddress,
    tokenAddress,
    vaultDuration,
    totalSupply
  );
  console.log("DCNTStaking deployed to: ", DCNTStaking.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
