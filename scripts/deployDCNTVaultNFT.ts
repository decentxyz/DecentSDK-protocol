import { deployContract } from "../core";

async function main() {
  const dcntVaultNFT = await deployContract('DCNTVaultNFT');
  console.log("DCNTVaultNFT deployed to: ", dcntVaultNFT.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
