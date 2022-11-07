import { ethers } from "hardhat";
import { deployDCNTCrescendo, theFuture } from "../core";

// set up DCNTSDK
const DCNTSDK_ENDPOINT = '';

// set up DCNTCrescendo
const name = 'Token Name';
const symbol = 'TOKEN';
const initialPrice = ethers.utils.parseEther('0.05');
const step1 = ethers.utils.parseEther("0.005");
const step2 = ethers.utils.parseEther("0.05");
const hitch = 20;
const takeRateBPS = 15_00;
const unlockDate = theFuture.time();
const saleStart = theFuture.time();
const royaltyBPS = 10_00;
const metadataRendererInit = {
  description: "This is the description for TOKEN.",
  imageURI: "http://localhost/image.jpg",
  animationURI: "http://localhost/song.mp3",
};
const metadataURI = "http://localhost/{id}.json";

async function main() {
  const DCNTSDK = await ethers.getContractAt("DCNTSDK", DCNTSDK_ENDPOINT);
  const DCNTCrescendo = await deployDCNTCrescendo(
    DCNTSDK,
    name,
    symbol,
    initialPrice,
    step1,
    step2,
    hitch,
    takeRateBPS,
    unlockDate,
    saleStart,
    royaltyBPS,
    metadataURI,
    metadataRendererInit
  );
  console.log("DCNTCrescendo deployed to: ", DCNTCrescendo.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
