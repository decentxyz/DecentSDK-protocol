import { ethers } from "hardhat";
import { deployDCNTSeries, theFuture } from "../core";

// set up DCNTSDK
const DCNTSDK_ENDPOINT = '';

// set up DCNT721A
const name = 'Token Name';
const symbol = 'TOKEN';
const hasAdjustableCaps = false;
const isSoulbound = false;
const maxTokens = 25;
const tokenPrice = 1;
const maxTokensPerOwner = 5;
const presaleMerkleRoot = ethers.constants.HashZero;
const presaleStart = theFuture.time();
const presaleEnd = theFuture.time();
const saleStart = theFuture.time();
const saleEnd = theFuture.time() + theFuture.oneMonth;
const startTokenId = 0;
const endTokenId = 1;
const royaltyBPS = 10_00;
const payoutAddress = ethers.constants.AddressZero;
const feeManager = ethers.constants.AddressZero;
const currencyOracle = ethers.constants.AddressZero;
const contractURI = 'http://localhost/contract/';
const metadataURI = "http://localhost/metadata/";
const tokenGateConfig = {
  tokenAddress: ethers.constants.AddressZero,
  minBalance: 0,
  saleType: 0,
}

async function main() {
  const DCNTSDK = await ethers.getContractAt("DCNTSDK", DCNTSDK_ENDPOINT);
  const DCNTSeries = await deployDCNTSeries(
    DCNTSDK,
    name,
    symbol,
    hasAdjustableCaps,
    isSoulbound,
    startTokenId,
    endTokenId,
    royaltyBPS,
    feeManager,
    payoutAddress,
    currencyOracle,
    contractURI,
    metadataURI,
    {
      maxTokens,
      tokenPrice,
      maxTokensPerOwner,
      presaleMerkleRoot,
      presaleStart,
      presaleEnd,
      saleStart,
      saleEnd,
      tokenGateConfig,
    }
  );
  console.log("DCNTSeries deployed to: ", DCNTSeries.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
