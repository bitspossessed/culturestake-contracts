const Question = artifacts.require('Question');

module.exports = function (deployer) {
  const question = web3.utils.sha3('my question');
  const festival = web3.utils.sha3('my festival');
  deployer.deploy(Question, 1, question, 100, festival);
};
