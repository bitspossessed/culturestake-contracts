const Culturestake = artifacts.require('Culturestake');
const Question = artifacts.require('Question');

module.exports = async function (deployer, network, accounts) {
  const address0 = accounts[0];
  const address1 = process.env.GANACHE_ACCOUNT || accounts[1];
  const address2 = process.env.METAMASK || accounts[2];
  const questionMasterCopy = await Question.deployed();
  deployer.deploy(Culturestake, [address0, address1, address2], questionMasterCopy.address);
};
