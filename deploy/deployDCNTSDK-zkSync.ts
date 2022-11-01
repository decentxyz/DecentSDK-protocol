import { ethers, network } from "hardhat";
import { utils, Wallet } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  const wallet = new Wallet(process.env.PRIVATE_KEY);
  const deployer = new Deployer(hre, wallet);

  const DCNT721A = await zk_deployContract(deployer, 'DCNT721A');
  const DCNT4907A = await zk_deployContract(deployer, 'DCNT4907A');
  const DCNTCrescendo = await zk_deployContract(deployer, 'DCNTCrescendo');
  const DCNTVault = await zk_deployContract(deployer, 'DCNTVault');
  const DCNTStaking = await zk_deployContract(deployer, 'DCNTStaking');
  const SharedNFTLogic = await zk_deployContract(deployer, 'SharedNFTLogic');
  const DCNTMetadataRenderer = await zk_deployContract(deployer, 'DCNTMetadataRenderer', [SharedNFTLogic.address]);
  const DCNTRegistry = await zk_deployContract(deployer, 'DCNTRegistry');
  const SplitMain = ethers.constants.AddressZero;

  const DCNTSDK = await zk_deployContract(deployer, 'DCNTSDK', [
    DCNT721A.address,
    DCNT4907A.address,
    DCNTCrescendo.address,
    DCNTVault.address,
    DCNTStaking.address,
    DCNTMetadataRenderer.address,
    DCNTRegistry.address,
    SplitMain
  ]);

  const DCNTVaultNFT = await zk_deployContract(deployer, 'DCNTVaultNFT', [DCNTSDK.address]);
  const DCNTRentalMarket = await zk_deployContract(deployer, 'DCNTRentalMarket');

  const contracts = {
    DCNTSDK: DCNTSDK.address,
    DCNT721A: await DCNTSDK.DCNT721AImplementation(),
    DCNT4907A: await DCNTSDK.DCNT4907AImplementation(),
    DCNTCrescendo: await DCNTSDK.DCNTCrescendoImplementation(),
    DCNTVault: await DCNTSDK.DCNTVaultImplementation(),
    DCNTStaking: await DCNTSDK.DCNTStakingImplementation(),
    DCNTMetadataRenderer: await DCNTSDK.metadataRenderer(),
    DCNTRegistry: await DCNTSDK.contractRegistry(),
    DCNTVaultNFT: DCNTVaultNFT.address,
    DCNTRentalMarket: DCNTRentalMarket.address,
    SplitMain: SplitMain,
  }

  console.log(JSON.stringify(contracts, null, 2));
}

const zk_deployContract = async (deployer: Deployer, contract: string, args?: any[]) => {
  const artifact = await deployer.loadArtifact(contract);
  return await deployer.deploy(artifact, args);
}