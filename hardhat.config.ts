import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  gasReporter: {
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_KEY,
    enabled: false
  }
};

export default config;
