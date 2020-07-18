const Culturestake = artifacts.require('Culturestake');

module.exports = function (deployer, network, accounts) {
  const address0 = accounts[0];
  const address1 = process.env.GANACHE_ACCOUNT || accounts[1];
  const address2 = process.env.METAMASK || accounts[2];
  deployer.deploy(Culturestake, [address1, address2]);
};

