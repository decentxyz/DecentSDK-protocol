import { deployContract, deployDCNTMetadataRenderer } from "../core";

async function main() {
  const sharedNFTLogic = await deployContract('SharedNFTLogic');
  console.log("SharedNFTLogic deployed to: ", sharedNFTLogic.address);

  const metadataRenderer = await deployDCNTMetadataRenderer(sharedNFTLogic);
  console.log("DCNTMetadataRenderer deployed to: ", metadataRenderer.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
