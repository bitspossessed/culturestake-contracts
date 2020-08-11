require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
    },
    kovan: {
      provider: function() {
        return new HDWalletProvider(
          process.env.MNEMONIC,
          `https://kovan.infura.io/v3/${process.env.PROJECT_ID}`)
      },
      port: 8545,
      network_id: 42,
      gas: 10000000,
      gasPrice: 12500000000,
    },
  },
  mocha: {
  },
  compilers: {
    solc: {
    },
  },
};
