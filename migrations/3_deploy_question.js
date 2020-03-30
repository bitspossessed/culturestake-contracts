const Culturestake = artifacts.require('Culturestake');

module.exports = function (deployer) {
  const question = web3.utils.sha3('my question');
  const festival = web3.utils.sha3('festival');
  Culturestake.deployed()
    .then(async (culturestake) => {
      await culturestake.initFestival(festival, 10000);
      await culturestake.initQuestion(1, question, 100, festival);
      await culturestake.initVotingBooth(festival, process.env.BOOTH);
    });
};
