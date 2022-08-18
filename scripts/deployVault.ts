import { ethers } from "hardhat";
import { deployVault, theFuture } from "../core";

// set up DCNTSDK
const DCNTSDK_ENDPOINT = '';

// set up DCNTVault
const vaultDistributionTokenAddress = ethers.constants.AddressZero;
const nftVaultKeyAddress = ethers.constants.AddressZero;
const nftTotalSupply = 25;
const unlockDate = theFuture.time() + theFuture.oneMonth;

async function main() {
  const DCNTSDK = await ethers.getContractAt("DCNTSDK", DCNTSDK_ENDPOINT);
  const DCNTVault = await deployVault(
    DCNTSDK,
    vaultDistributionTokenAddress,
    nftVaultKeyAddress,
    nftTotalSupply,
    unlockDate
  );
  console.log("DCNTVault deployed to: ", DCNTVault.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
