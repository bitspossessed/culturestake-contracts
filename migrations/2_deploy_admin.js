const Culturestake = artifacts.require('Culturestake');

module.exports = function (deployer, network, accounts) {
  const address1 = process.env.ADDR1 || accounts[0];
  const address2 = process.env.ADDR2 || accounts[1];
  deployer.deploy(Culturestake, [address1, address2]);
};

