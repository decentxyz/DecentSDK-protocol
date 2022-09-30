import { ethers, network } from "hardhat";
import { deployDCNTSDK, deployContract, deployDCNTVaultNFT } from "../core";

async function main() {
  // get split main contract or deploy our own for local testing
  const splitMain = ['localhost', 'hardhat'].includes(network.name)
    ? await deployContract('SplitMain')
    : await ethers.getContractAt('SplitMain', '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE');

  const sdk = await deployDCNTSDK(
    null, // proxy implementations
    null, // metadata renderer
    null, // contract registry
    splitMain, // split main
  );

  const metadataRenderer = await ethers.getContractAt('DCNTMetadataRenderer', await sdk.metadataRenderer());
  const registry = await ethers.getContractAt('DCNTRegistry', await sdk.contractRegistry());
  const vaultNFT = await deployDCNTVaultNFT(sdk);
  const rentalMarket = await deployContract('DCNTRentalMarket');

  const contracts = {
    DCNTSDK: sdk.address,
    DCNT721A: await sdk.DCNT721AImplementation(),
    DCNT4907A: await sdk.DCNT4907AImplementation(),
    DCNTCrescendo: await sdk.DCNTCrescendoImplementation(),
    DCNTVault: await sdk.DCNTVaultImplementation(),
    DCNTStaking: await sdk.DCNTStakingImplementation(),
    DCNTMetadataRenderer: metadataRenderer.address,
    DCNTRegistry: registry.address,
    DCNTVaultNFT: vaultNFT.address,
    DCNTRentalMarket: rentalMarket.address,
    SplitMain: await sdk.SplitMain(),
  }

  console.log(JSON.stringify(contracts, null, 2));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
