const web3 = require('web3'); // eslint-disable-line import/no-extraneous-dependencies

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const SENTINEL_OWNERS = '0x0000000000000000000000000000000000000001';

const BN = web3.utils.BN;

const bn = number => new BN(number);

module.exports = {
  ZERO_ADDRESS,
  SENTINEL_OWNERS,
  bn,
};
