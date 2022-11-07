import { ethers } from "hardhat";
import { deployDCNT4907A, theFuture } from "../core";

// set up DCNTSDK
const DCNTSDK_ENDPOINT = '';

// set up DCNT4907A
const name = 'Token Name';
const symbol = 'TOKEN';
const maxTokens = 25;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;
const saleStart = theFuture.time();
const royaltyBPS = 10_00;
const metadataRendererInit = {
  description: "This is the description for TOKEN.",
  imageURI: "http://localhost/image.jpg",
  animationURI: "http://localhost/song.mp3",
};
const metadataURI = "http://localhost/metadata/";

async function main() {
  const DCNTSDK = await ethers.getContractAt("DCNTSDK", DCNTSDK_ENDPOINT);
  const DCNT4907A = await deployDCNT4907A(
    DCNTSDK,
    name,
    symbol,
    maxTokens,
    tokenPrice,
    maxTokenPurchase,
    saleStart,
    royaltyBPS,
    metadataURI,
    metadataRendererInit
  );
  console.log("DCNT4907A deployed to: ", DCNT4907A.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
