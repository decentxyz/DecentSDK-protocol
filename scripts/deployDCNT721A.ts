import { ethers } from "hardhat";
import { deployDCNT721A, theFuture } from "../core";

// set up DCNTSDK
const DCNTSDK_ENDPOINT = '';

// set up DCNT721A
const name = 'Token Name';
const symbol = 'TOKEN';
const hasAdjustableCap = false;
const maxTokens = 25;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;
const presaleMerkleRoot = ethers.constants.HashZero;
const presaleStart = theFuture.time();
const presaleEnd = theFuture.time();
const saleStart = theFuture.time();
const saleEnd = theFuture.time() + theFuture.oneMonth;
const royaltyBPS = 10_00;
const contractURI = 'http://localhost/contract/';
const metadataURI = "http://localhost/metadata/";
const metadataRendererInit = {
  description: "This is the description for TOKEN.",
  imageURI: "http://localhost/image.jpg",
  animationURI: "http://localhost/song.mp3",
};
const tokenGateConfig = {
  tokenAddress: ethers.constants.AddressZero,
  minBalance: 0,
  saleType: 0,
}

async function main() {
  const DCNTSDK = await ethers.getContractAt("DCNTSDK", DCNTSDK_ENDPOINT);
  const DCNT721A = await deployDCNT721A(
    DCNTSDK,
    name,
    symbol,
    hasAdjustableCap,
    maxTokens,
    tokenPrice,
    maxTokenPurchase,
    presaleMerkleRoot,
    presaleStart,
    presaleEnd,
    saleStart,
    saleEnd,
    royaltyBPS,
    contractURI,
    metadataURI,
    metadataRendererInit,
    tokenGateConfig
  );
  console.log("DCNT721A deployed to: ", DCNT721A.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
