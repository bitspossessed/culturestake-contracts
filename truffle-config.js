require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
    },
    xdai: {
      provider: function() {
        return new HDWalletProvider(
        process.env.MNEMONIC,
        "https://dai.poa.network")
      },
      network_id: 100,
      gas: 12487794,
      gasPrice: 1000000000,
    },
  },
  mocha: {
  },
  compilers: {
    solc: {
    },
  },
};
