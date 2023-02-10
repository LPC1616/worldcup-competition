import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades"

require('dotenv').config()
require('@openzeppelin/hardhat-upgrades')

let GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || ''
let PRIVATE_KEY = process.env.PRIVATE_KEY || ''
let ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''

// set proxy
// const proxyUrl = "http://127.0.0.1:7890" // change to yours, With the global proxy enabled, change the proxyUrl to your own proxy link. The port may be different for each client.
// const { ProxyAgent, setGlobalDispatcher } = require("undici")
// const proxyAgent = new ProxyAgent(proxyUrl)
// setGlobalDispatcher(proxyAgent)

const config: HardhatUserConfig = {

  networks: {
    hardhat: {
    },
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY]
    },
  },

  etherscan: {
    apiKey: {
      goerli: ETHERSCAN_API_KEY
    }
  },

  solidity: {
    version: "0.8.9",
    settings:{
      optimizer:{
        enabled: true,
        runs: 200
      }
    }
  },
};

export default config;
