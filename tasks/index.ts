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

task("gas", "Prints network fees")
  .setAction(async (taskArgs, { ethers, network }) => {
    const [feeData, pending, latest] = await Promise.all([
      ethers.provider.getFeeData(),
      ethers.provider.getBlock('pending'),
      ethers.provider.getBlock('latest'),
    ]);
    const gasPrice = ethers.utils.formatUnits(feeData.gasPrice, 'gwei');
    const maxFeePerGas = ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei');
    const maxPriorityFeePerGas = ethers.utils.formatUnits(feeData.maxPriorityFeePerGas, 'gwei');
    const pendingBaseFee = ethers.utils.formatUnits(pending.baseFeePerGas, 'gwei');
    const latestBaseFee = ethers.utils.formatUnits(latest.baseFeePerGas, 'gwei');
    console.log(`gas price:                ${gasPrice}`);
    console.log(`max fee per gas:          ${maxFeePerGas}`);
    console.log(`max priority fee per gas: ${maxPriorityFeePerGas}`);
    console.log(`pending base fee per gas: ${pendingBaseFee}`);
    console.log(`latest base fee per gas:  ${latestBaseFee}`);
  });
