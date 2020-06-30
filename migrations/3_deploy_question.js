const Culturestake = artifacts.require('Culturestake');

module.exports = function (deployer) {
  const festival = web3.utils.sha3('festival');
  Culturestake.deployed()
    .then(async (culturestake) => {
      await culturestake.initFestival(festival, Math.floor((new Date()).getTime() / 1000), 10000);
      await culturestake.initQuestion(100, festival);
      await culturestake.initVotingBooth(festival, process.env.BOOTH);
    });
};
