import { deployContract } from "../core";

async function main() {
  const registry = await deployContract('DCNTRegistry');
  console.log("DCNTRegistry deployed to: ", registry.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
