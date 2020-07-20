const Culturestake = artifacts.require('Culturestake');
const { timestamp } = require('../test/helpers/constants');

module.exports = function (deployer) {
  const festival = web3.utils.sha3('festival');
  const question = web3.utils.sha3('question');
  Culturestake.deployed()
    .then(async (culturestake) => {
      await culturestake.initFestival(festival, timestamp(), timestamp() + 10000);
      await culturestake.initQuestion(question, 100, festival);
      await culturestake.initVotingBooth(festival, process.env.BOOTH);
    });
};
