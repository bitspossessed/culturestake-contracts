const Culturestake = artifacts.require('Culturestake');

module.exports = function (deployer, network, accounts) {
  const address1 = process.env.GANACHE_ACCOUNT_0 || accounts[0];
  const address2 = process.env.METAMASK || accounts[1];
  deployer.deploy(Culturestake, [address1, address2]);
};

