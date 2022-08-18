import { ethers } from "hardhat";
import { deployCrescendo } from "../core";

// set up DCNTSDK
const DCNTSDK_ENDPOINT = '';

// set up DCNTCrescendo
const name = 'Token Name';
const symbol = 'TOKEN';
const uri = 'http://localhost/{id}.json';
const initialPrice = ethers.utils.parseEther('0.05');
const step1 = ethers.utils.parseEther("0.005");
const step2 = ethers.utils.parseEther("0.05");
const hitch = 20;
const [trNum,trDenom] = [3,20];
const payouts = ethers.constants.AddressZero;

async function main() {
  const DCNTSDK = await ethers.getContractAt("DCNTSDK", DCNTSDK_ENDPOINT);
  const DCNTCrescendo = await deployCrescendo(
    DCNTSDK,
    name,
    symbol,
    uri,
    initialPrice,
    step1,
    step2,
    hitch,
    trNum,
    trDenom,
    payouts
  );
  console.log("DCNTCrescendo deployed to: ", DCNTCrescendo.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
