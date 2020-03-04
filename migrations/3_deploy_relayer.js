const Relayer = artifacts.require('Relayer');

module.exports = function (deployer, network, accounts) {
  deployer.deploy(Relayer);
};
