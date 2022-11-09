import { ethers } from "hardhat";
import { deployContract, theFuture } from "../core";

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
const contractURI = "http://localhost/contract/"
const metadataURI = "http://localhost/metadata/";
const metadataRendererInit: any[] = []; // null bytes
const tokenGateConfig = {
  tokenAddress: ethers.constants.AddressZero,
  minBalance: 0,
  saleType: 0,
}
const parentIP = ethers.constants.AddressZero;

// extra params for constructor
const owner = '0x1Dde6327a26e6740FdAb9780fBF0D059fc85EE33';
const metadataRenderer = ethers.constants.AddressZero;
const splitMain = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';

async function main() {

  const factory = await ethers.getContractFactory('DCNTSoulBound');
  const contract = await factory.deploy(
    owner,
    {
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
    },
    {
      contractURI,
      metadataURI,
      metadataRendererInit,
      parentIP,
    },
    tokenGateConfig,
    metadataRenderer,
    splitMain
  );
  const DCNTSoulBound = await contract.deployed();
  console.log('DCNTSoulBound deployed to: ', DCNTSoulBound.address);

  console.log(DCNTSoulBound.address, owner,
    {
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
    },
    {
      contractURI,
      metadataURI,
      metadataRendererInit,
      parentIP,
    },
    tokenGateConfig,
    metadataRenderer,
    splitMain)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
