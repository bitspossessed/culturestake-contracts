require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
    },
  },
  mocha: {
  },
  compilers: {
    solc: {
    },
  },
};
