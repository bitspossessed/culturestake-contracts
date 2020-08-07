const Question = artifacts.require('Question');
const { ZERO_ADDRESS } = require('../test/helpers/constants');

module.exports = async function (deployer) {
  const festival = web3.utils.sha3('festival');
  const question = web3.utils.sha3('question');
  await deployer.deploy(Question);
  const questionMasterCopy = await Question.deployed();
  await questionMasterCopy.setup(ZERO_ADDRESS, question, 0, festival);
};

