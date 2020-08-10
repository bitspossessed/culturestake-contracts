const { assertRevert } = require('./helpers/assertRevert');
const { bn } = require('./helpers/constants');
const { refreshNonce } = require('./helpers/nonce');
const { ZERO_ADDRESS, timestamp } = require('./helpers/constants');
const expectEvent = require('./helpers/expectEvent');

require('chai')
  .use(require('chai-bn')(web3.utils.BN))
  .should();

const Culturestake = artifacts.require('MockCulturestake');
const Question = artifacts.require('Question');

const getQuestion = async (culturestake) => {
  const logs = await culturestake.getPastEvents('InitQuestion', { fromBlock: 0, toBlock: 'latest' });
  const event = expectEvent.inLogs(logs, 'InitQuestion');
  return Question.at(event.args.questionAddress);
};

contract('Question', ([_, owner, attacker]) => {
  let culturestake;
  let startTime;
  let endTime;
  let questionMasterCopy;
  let question;
  let voteRelayer;
  const maxVoteTokens = 10;
  const festival = web3.utils.sha3('my festival');
  const booth = web3.eth.accounts.create();
  const duration = 1000000;
  const questionId = web3.utils.sha3('a question');

  beforeEach(async () => {
    startTime = timestamp();
    endTime = startTime + duration;
    questionMasterCopy = await Question.new({ from: owner });
    await questionMasterCopy.setup(ZERO_ADDRESS, questionId, 0, festival);
    culturestake = await Culturestake.new([owner], questionMasterCopy.address, { from: owner });
    await culturestake.initFestival(festival, startTime, endTime, { from: owner });
    await culturestake.initVotingBooth(festival, booth.address, { from: owner });
  });

  it('owner can create question', async () => {
    await culturestake.initQuestion(questionId, maxVoteTokens, festival, { from: owner });
    const logs = await culturestake.getPastEvents('InitQuestion', { fromBlock: 0, toBlock: 'latest' });
    const event = expectEvent.inLogs(logs, 'InitQuestion');
    return event.args.festival.should.be.equal(festival);
  });


  it('question is configured when deployed', async () => {
    await culturestake.initQuestion(questionId, maxVoteTokens, festival, { from: owner });
    question = await getQuestion(culturestake);
    (await question.configured()).should.be.equal(true);
  });

  it('question has the correct id when deployed', async () => {
    await culturestake.initQuestion(questionId, maxVoteTokens, festival, { from: owner });
    question = await getQuestion(culturestake);
    (await question.id()).should.be.equal(questionId);
  });

  describe('vote tests', () => {
    beforeEach(async () => {
      await culturestake.initQuestion(questionId, maxVoteTokens, festival, { from: owner });
      question = await getQuestion(culturestake);
      voteRelayer = web3.eth.accounts.create();
      await culturestake.setVoteRelayer(voteRelayer.address, { from: owner });
    });

    it('vote relayer can send a vote', async () => {
      const answer = web3.utils.sha3('answer');
      const to = question.address;
      await question.initAnswer(answer, { from: owner });
      const data = question.contract.methods.recordUnsignedVote(
        [answer], [10], [3], booth.address, refreshNonce(),
      ).encodeABI();

      const gas = await web3.eth.estimateGas({
        to,
        data,
        from: voteRelayer.address,
      });
      const nonce = await web3.eth.getTransactionCount(voteRelayer.address);

      const signed = await web3.eth.accounts.signTransaction({
        to,
        data,
        gas,
        nonce,
        from: voteRelayer.address,
      }, voteRelayer.privateKey);
      await web3.eth.sendTransaction({
        from: owner,
        to: voteRelayer.address,
        value: bn(gas).mul(bn('20000000000')),
      });

      await web3.eth.sendSignedTransaction(signed.rawTransaction);

      const logs = await question.getPastEvents('Vote', { fromBlock: 0, toBlock: 'latest' });
      const event = expectEvent.inLogs(logs, 'Vote');
      return event.args.questionId.should.be.equal(questionId);
    });

    it('attacker cant send a vote', async () => {
      const answer = web3.utils.sha3('answer');
      await question.initAnswer(answer, { from: owner });
      await assertRevert(question.recordUnsignedVote(
        [answer], [10], [3], booth.address, refreshNonce(),
        { from: attacker },
      ));
    });
  });
});
