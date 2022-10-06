import { task } from "hardhat/config";

task("balance", "Prints deployer's balance")
  .setAction(async (taskArgs, { ethers, network }) => {
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`${network.name} ${ethers.utils.formatEther(balance)} ETH`);
  });

task("nonce", "Prints deployer's nonce")
  .setAction(async (taskArgs, { ethers, network }) => {
    const [deployer] = await ethers.getSigners();
    const nonce = await ethers.provider.getTransactionCount(deployer.address);
    console.log(`${network.name} nonce: ${nonce}`);
  });

task("account", "Prints deployer's account")
  .setAction(async (taskArgs, { ethers, network }) => {
    const [deployer] = await ethers.getSigners();
    const nonce = await ethers.provider.getTransactionCount(deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`${network.name} nonce: ${nonce}`);
    console.log(`balance: ${ethers.utils.formatEther(balance)} ETH`);
    console.log();
  });
