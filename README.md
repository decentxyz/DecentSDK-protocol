# DecentSDK

### Getting Started :rainbow:

- `npm i` to install packages
- copy `.env.example` to `.env` and add your variables
- `npx hardhat run scripts/deployDCNTSDK.ts --network optimism_testnet` to deploy the DecentSDK

### Adding a new SDK Module

1. add contracts to `/contracts` folder
2. add interfaces to `/interfaces` folder
3. write deploy function in `core/index.js`
4. create an example interface to the sdk in `scripts/deploy{YOUR_CONTRACT_NAME}.ts`
5. test by running `npx hardhat run scripts/{YOUR_CONTRACT_NAME}.ts --network optimism_testnet`

### Verifying

- `npx hardhat verify {CONTRACT_ADDRESS} --network {NETWORK}`
- find full list of supported networks in `hardhat.config.js`
