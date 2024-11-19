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
    sepolia: {
      url: process.env.SEPOLIA_PROVIDER,
      accounts: [process.env.DEPLOYER_KEY]
    },
    optimism: {
      url: process.env.OPTIMISM_PROVIDER,
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
    iota: {
      url: process.env.IOTA_EVM_PROVIDER,
      accounts: [process.env.DEPLOYER_KEY]
    },
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
        url: process.env.AVALANCHE_PROVIDER
      }
    }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHER_SCAN_KEY,
      bsc: process.env.BSC_SCAN_KEY,
      arbitrumOne: process.env.ARBI_SCAN_KEY,
      polygon: process.env.POLYGON_SCAN_KEY,
      sepolia: process.env.SEPOLIA_SCAN_KEY,
      optimisticEthereum: process.env.OPTIMISTIC_SCAN_KEY,
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