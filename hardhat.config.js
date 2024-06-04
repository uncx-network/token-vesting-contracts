require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("hardhat-gas-reporter");
require("dotenv/config");
require('hardhat-contract-sizer');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  gasReporter: {
    enabled: false,
    currency: 'EUR',
    gasPrice: 54, // https://ethgasstation.info/
    token: "ETH",
    coinmarketcap: process.env.CMC_KEY
  },

  networks: {

    eth: {
      url: process.env.ETHEREUM_PROVIDER,
      accounts: [process.env.DEPLOYER_KEY]
    },

    bsc: {
      url: process.env.BSC_PROVIDER,
      accounts: [process.env.DEPLOYER_KEY]
    },

    arb: {
      url: process.env.ARBITRUM_PROVIDER,
      accounts: [process.env.DEPLOYER_KEY]
    },

    poly: {
      url: process.env.POLYGON_PROVIDER,
      accounts: [process.env.DEPLOYER_KEY]
    },

    goerli: {
      url: process.env.GOERLI_PROVIDER,
      accounts: [process.env.DEPLOYER_KEY]
    },

    base: {
      url: process.env.BASE_PROVIDER,
      accounts: [process.env.DEPLOYER_KEY]
    },

    avax: {
      url: process.env.AVALANCHE_PROVIDER,
      accounts: [process.env.DEPLOYER_KEY]
    },

    // this network is used for forked mainnet UI tests and requires starting a node in a seperate terminal first
    // Example:
    // npx hardhat node
    // npx hardhat run --network forked scripts/sendNft.js
    forked: {
      chainId: 1337,
      url: "http://127.0.0.1:8545/",
      forking: {
        url: process.env.ETHEREUM_PROVIDER
      }
    },

    hardhat: {
      chainId: 1337,
      forking: {
        // BSC
        // url: process.env.BSC_PROVIDER

        // Eth Mainnet
        // url: process.env.ETHEREUM_PROVIDER

        // Avalanche
        url: process.env.AVALANCHE_PROVIDER

        // Base
        // url: process.env.BASE_PROVIDER

        // Arbitrum Mainnet
        // url: process.env.ARBITRUM_PROVIDER

        // Polygon
        // url: process.env.POLYGON_PROVIDER
      }
    }
  },

  // https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify
  // npx hardhat verify --list-networks
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHER_SCAN_KEY,
      bsc: process.env.BSC_SCAN_KEY,
      // optimisticEthereum: "YOUR_OPTIMISTIC_ETHERSCAN_API_KEY",
      arbitrumOne: process.env.ARBI_SCAN_KEY,
      polygon: process.env.POLYGON_SCAN_KEY,
      goerli: process.env.GOERLI_SCAN_KEY,
      base: process.env.BASE_SCAN_KEY,
      avalanche: process.env.AVALANCHE_SNOWTRACE_KEY
    }
  },

  solidity: {
    compilers: [
      {
        version: "0.5.0"
      },
      {
        version: "0.6.12"
      },
      {
        version: "0.8.3",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  }
};

