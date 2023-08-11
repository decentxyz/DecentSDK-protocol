import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require('hardhat-contract-sizer');
require("dotenv").config();
import './tasks'

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mainnet: {
      url: process.env.MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY as string],
    },
    goerli: {
      url: process.env.GOERLI_URL,
      accounts: [process.env.PRIVATE_KEY as string]
    },
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: [process.env.PRIVATE_KEY as string]
    },
    polygon: {
      url: process.env.POLYGON_MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY as string]
    },
    polygon_testnet: {
      url: process.env.POLYGON_TESTNET_URL,
      accounts: [process.env.PRIVATE_KEY as string]
    },
    optimism: {
      url: process.env.OPTIMISM_MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY as string]
    },
    optimism_testnet: {
      url: process.env.OPTIMISM_TESTNET_URL,
      accounts: [process.env.PRIVATE_KEY as string]
    },
    arbitrum: {
      url: process.env.ARBITRUM_MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY as string]
    },
    arbitrum_testnet: {
      url: process.env.ARBITRUM_TESTNET_URL,
      accounts: [process.env.PRIVATE_KEY as string]
    },
    base: {
      url: process.env.BASE_MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY as string],
      gasPrice: 1000000000,
    },
    base_testnet: {
      url: process.env.BASE_TESTNET_URL,
      accounts: [process.env.PRIVATE_KEY as string],
      gasPrice: 1000000000,
    },
    zora: {
      url: process.env.ZORA_MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY as string],
    },
    zora_testnet: {
      url: process.env.ZORA_TESTNET_URL,
      accounts: [process.env.PRIVATE_KEY as string],
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_KEY as string,
      goerli: process.env.ETHERSCAN_KEY as string,
      sepolia: process.env.ETHERSCAN_KEY as string,
      polygon: process.env.POLYGONSCAN_KEY as string,
      polygonMumbai: process.env.POLYGONSCAN_KEY as string,
      optimisticEthereum: process.env.OPTIMISMSCAN_KEY as string,
      optimism_testnet: process.env.OPTIMISMSCAN_KEY as string,
      arbitrumOne: process.env.ARBISCAN_KEY as string,
      arbitrum_testnet: process.env.ARBISCAN_KEY as string,
      base: process.env.BASESCAN_KEY as string,
      base_testnet: process.env.BASESCAN_KEY as string,
      zora: process.env.BLOCKSCOUT_KEY as string,
      zora_testnet: process.env.BLOCKSCOUT_KEY as string,
    },
    customChains: [
      {
        network: "optimism_testnet",
        chainId: 420,
        urls: {
          apiURL: "https://api-goerli-optimism.etherscan.io/api",
          browserURL: "https://goerli-optimism.etherscan.io/"
        }
      },
      {
        network: "arbitrum_testnet",
        chainId: 421613,
        urls: {
          apiURL: "https://api-goerli.arbiscan.io/api",
          browserURL: "https://goerli.arbiscan.io/"
        }
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
         apiURL: "https://api.basescan.org/api",
         browserURL: "https://basescan.org"
        }
      },
      {
        network: "base_testnet",
        chainId: 84531,
        urls: {
         apiURL: "https://api-goerli.basescan.org/api",
         browserURL: "https://goerli.basescan.org"
        }
      },
      {
        network: "zora",
        chainId: 7777777,
        urls: {
          apiURL: "https://explorer.zora.energy/api",
          browserURL: "https://explorer.zora.energy"
        }
      },
      {
        network: "zora_testnet",
        chainId: 999,
        urls: {
          apiURL: "https://testnet.explorer.zora.energy/api",
          browserURL: "https://testnet.explorer.zora.energy"
        }
      }
    ],
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_KEY,
    enabled: false,
    gasPrice: 15
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
    only: [':DCNT'],
  }
};

export default config;
