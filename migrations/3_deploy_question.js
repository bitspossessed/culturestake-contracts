const Culturestake = artifacts.require('Culturestake');

module.exports = function (deployer) {
  const question = web3.utils.sha3('my question');
  const festival = web3.utils.sha3('my festival');
  Culturestake.deployed()
    .then((culturestake) => {
      culturestake.initQuestion(1, question, 100, festival);
    });
};
