import { run, ethers } from "hardhat";

import * as dotenv from "dotenv";
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CONTRACT = 'DCNTSOULBOUND';
// const CONTRACT = 'Crescendo';
const PRICE = ethers.utils.parseEther("0.05"); 
const NAME = "Down&Low";
const TOKEN = "BUPPY";
const AMT = 20;
const permint = 2;
// const payouts = '0x9280dC655fF5cCa6Cc5Ea996DeF41853c680e6b1'
const metadata = 'https://gateway.pinata.cloud/ipfs/QmWwxRgzZfALZWrFLzxfhahoWAtoYfBvWeQFYD2VDGCaHd/';

const deployNft = async () => {
  // console.log(process.env.PRIVATE_ACCOUNT_KEY)
  // console.log(process.env.ALCHEMY_RINKEBY_RPC_URL)
  console.log('getting contract factory...')
  const nftContractFactory = await ethers.getContractFactory(CONTRACT);
  console.log('deploying...')
  const nftContract = await nftContractFactory.deploy(
    NAME,
    TOKEN,
    AMT,
    PRICE,
    permint
  );
  console.log('deployed...')
  return await nftContract.deployed();
}

async function main() {
  const nftContract = await deployNft();
  console.log("Contract deployed to: ", nftContract.address);
  console.log('setting base uri...');
  let txn1 = await nftContract.setBaseURI(metadata);
  await txn1.wait();
  console.log('flipping sale state');
  let txn2 = await nftContract.flipSaleState();
  await txn2.wait();
  console.log('minting 1 nfts..');
  let txn3 = await nftContract.reserveDCNT(1);
  await txn3.wait();
  console.log('done');

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });