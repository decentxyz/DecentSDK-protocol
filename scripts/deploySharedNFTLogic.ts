import { deploySharedNFTLogic } from "../core";

async function main() {
  const sharedNFTLogic = await deploySharedNFTLogic();
  console.log("SharedNFTLogic deployed to: ", sharedNFTLogic.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
