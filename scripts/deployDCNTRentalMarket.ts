import { deployContract } from "../core";

async function main() {
  const rentalMarket = await deployContract('DCNTRentalMarket');
  console.log("DCNTRentalMarket deployed to: ", rentalMarket.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
