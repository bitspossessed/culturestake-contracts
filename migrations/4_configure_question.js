const Culturestake = artifacts.require('Culturestake');
const Question = artifacts.require('Question');

module.exports = function (deployer) {
  const answer1 = web3.utils.sha3('an answer');
  const answer2 = web3.utils.sha3('another answer');
  const answer3 = web3.utils.sha3('third answer');
  return Culturestake.deployed()
    .then(async (culturestake) => {
      const logs = await culturestake.getPastEvents('InitQuestion', { fromBlock: 0, toBlock: 'latest' });
      const question = await Question.at(logs[0].returnValues.questionAddress);
      const isOwner = await culturestake.isOwner('0x1Db6159dC5BD96883c20B172648670dD253ED63E');
      console.log('isOwner', isOwner);
      await question.initAnswer(answer1);
      await question.initAnswer(answer2);
      await question.initAnswer(answer3);
    });
};
