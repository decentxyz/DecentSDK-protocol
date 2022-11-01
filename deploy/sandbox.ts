import * as zksync from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// local address of deployed contracvt in docker env
const DCNTSDK_ENDPOINT = '0x866Cd41453089a2610E67c440f2E73a3b6f794a7';

// inline the ABI for now
const ABI=[{"inputs":[{"internalType":"address","name":"_DCNT721AImplementation","type":"address"},{"internalType":"address","name":"_DCNT4907AImplementation","type":"address"},{"internalType":"address","name":"_DCNTCrescendoImplementation","type":"address"},{"internalType":"address","name":"_DCNTVaultImplementation","type":"address"},{"internalType":"address","name":"_DCNTStakingImplementation","type":"address"},{"internalType":"address","name":"_metadataRenderer","type":"address"},{"internalType":"address","name":"_contractRegistry","type":"address"},{"internalType":"address","name":"_SplitMain","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":!1,"inputs":[{"indexed":!1,"internalType":"address","name":"DCNT4907A","type":"address"}],"name":"DeployDCNT4907A","type":"event"},{"anonymous":!1,"inputs":[{"indexed":!1,"internalType":"address","name":"DCNT721A","type":"address"}],"name":"DeployDCNT721A","type":"event"},{"anonymous":!1,"inputs":[{"indexed":!1,"internalType":"address","name":"DCNTCrescendo","type":"address"}],"name":"DeployDCNTCrescendo","type":"event"},{"anonymous":!1,"inputs":[{"indexed":!1,"internalType":"address","name":"DCNTStaking","type":"address"}],"name":"DeployDCNTStaking","type":"event"},{"anonymous":!1,"inputs":[{"indexed":!1,"internalType":"address","name":"DCNTVault","type":"address"}],"name":"DeployDCNTVault","type":"event"},{"anonymous":!1,"inputs":[{"indexed":!0,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":!0,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"DCNT4907AImplementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DCNT721AImplementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DCNTCrescendoImplementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DCNTStakingImplementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DCNTVaultImplementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SplitMain","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"contractRegistry","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"},{"internalType":"uint256","name":"maxTokens","type":"uint256"},{"internalType":"uint256","name":"tokenPrice","type":"uint256"},{"internalType":"uint256","name":"maxTokenPurchase","type":"uint256"},{"internalType":"uint256","name":"royaltyBPS","type":"uint256"}],"internalType":"struct EditionConfig","name":"_editionConfig","type":"tuple"},{"components":[{"internalType":"string","name":"metadataURI","type":"string"},{"internalType":"bytes","name":"metadataRendererInit","type":"bytes"}],"internalType":"struct MetadataConfig","name":"_metadataConfig","type":"tuple"}],"name":"deployDCNT4907A","outputs":[{"internalType":"address","name":"clone","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"},{"internalType":"uint256","name":"maxTokens","type":"uint256"},{"internalType":"uint256","name":"tokenPrice","type":"uint256"},{"internalType":"uint256","name":"maxTokenPurchase","type":"uint256"},{"internalType":"uint256","name":"royaltyBPS","type":"uint256"}],"internalType":"struct EditionConfig","name":"_editionConfig","type":"tuple"},{"components":[{"internalType":"string","name":"metadataURI","type":"string"},{"internalType":"bytes","name":"metadataRendererInit","type":"bytes"}],"internalType":"struct MetadataConfig","name":"_metadataConfig","type":"tuple"}],"name":"deployDCNT721A","outputs":[{"internalType":"address","name":"clone","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"},{"internalType":"uint256","name":"initialPrice","type":"uint256"},{"internalType":"uint256","name":"step1","type":"uint256"},{"internalType":"uint256","name":"step2","type":"uint256"},{"internalType":"uint256","name":"hitch","type":"uint256"},{"internalType":"uint256","name":"takeRateBPS","type":"uint256"},{"internalType":"uint256","name":"unlockDate","type":"uint256"},{"internalType":"uint256","name":"royaltyBPS","type":"uint256"}],"internalType":"struct CrescendoConfig","name":"_config","type":"tuple"},{"components":[{"internalType":"string","name":"metadataURI","type":"string"},{"internalType":"bytes","name":"metadataRendererInit","type":"bytes"}],"internalType":"struct MetadataConfig","name":"_metadataConfig","type":"tuple"}],"name":"deployDCNTCrescendo","outputs":[{"internalType":"address","name":"clone","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_nft","type":"address"},{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_vaultDuration","type":"uint256"},{"internalType":"uint256","name":"_totalSupply","type":"uint256"}],"name":"deployDCNTStaking","outputs":[{"internalType":"address","name":"clone","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_vaultDistributionTokenAddress","type":"address"},{"internalType":"address","name":"_nftVaultKeyAddress","type":"address"},{"internalType":"uint256","name":"_nftTotalSupply","type":"uint256"},{"internalType":"uint256","name":"_unlockDate","type":"uint256"}],"name":"deployDCNTVault","outputs":[{"internalType":"address","name":"clone","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"metadataRenderer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}];

// initialization params for the minimal proxy clone
const name = 'Token Name';
const symbol = 'TOKEN';
const maxTokens = 25;
const tokenPrice = ethers.utils.parseEther('0.01');
const maxTokenPurchase = 2;
const royaltyBPS = 10_00;
const metadataRendererInit = {
  description: "This is the description for TOKEN.",
  imageURI: "http://localhost/image.jpg",
  animationURI: "http://localhost/song.mp3",
};
const metadataURI = "http://localhost/metadata/";

// export method for deploy-zksync
export default async function (hre: HardhatRuntimeEnvironment) {

  /// set up the zksync provider and wallet
  const syncProvider = new zksync.Provider("http://localhost:3050");
  const ethProvider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const syncWallet = new zksync.Wallet(process.env.PRIVATE_KEY, syncProvider, ethProvider);

  const decentSDK = new zksync.Contract(DCNTSDK_ENDPOINT, ABI, syncWallet);
  console.log("DCNT721A implementation deployed to: ", await decentSDK.DCNT721AImplementation());

  const myNFT = await deployDCNT721A(
    decentSDK,
    name,
    symbol,
    maxTokens,
    tokenPrice,
    maxTokenPurchase,
    royaltyBPS,
    metadataURI,
    metadataRendererInit
  );
  console.log("DCNT721A deployed to: ", myNFT.address);
}

const deployDCNT721A = async (
  decentSDK: Contract,
  name: string,
  symbol: string,
  maxTokens: number,
  tokenPrice: BigNumber,
  maxTokenPurchase: number,
  royaltyBPS: number,
  metadataURI: string,
  metadata: MetadataInit | null
) => {
  const metadataRendererInit = metadata != null
    ? ethers.utils.AbiCoder.prototype.encode(
        ['string', 'string', 'string'],
        [
          metadata.description,
          metadata.imageURI,
          metadata.animationURI
        ]
      )
    : [];

  const deployTx = await decentSDK.deployDCNT721A(
    {
      name,
      symbol,
      maxTokens,
      tokenPrice,
      maxTokenPurchase,
      royaltyBPS,
    },
    {
      metadataURI,
      metadataRendererInit,
    }
  );

  const receipt = await deployTx.wait();
  const address = receipt.events.find((x: any) => x.event === 'DeployDCNT721A').args.DCNT721A;
  return ethers.getContractAt("DCNT721A", address);
}
