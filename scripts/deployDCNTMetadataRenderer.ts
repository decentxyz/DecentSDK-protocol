import { deployDCNTMetadataRenderer } from "../core";

async function main() {
  const metadataRenderer = await deployDCNTMetadataRenderer();
  console.log("DCNTMetadataRenderer deployed to: ", metadataRenderer.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
