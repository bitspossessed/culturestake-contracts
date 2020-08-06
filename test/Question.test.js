const { assertRevert } = require('./helpers/assertRevert');
const { bn } = require('./helpers/constants');
const { ZERO_ADDRESS, timestamp } = require('./helpers/constants');
const expectEvent = require('./helpers/expectEvent');

require('chai')
  .use(require('chai-bn')(web3.utils.BN))
  .should();

const Culturestake = artifacts.require('MockCulturestake');
const Question = artifacts.require('Question');

contract('Question', ([_, owner, attacker]) => {
  let culturestake;
  let startTime;
  let endTime;
  let questionMasterCopy;
  let question;
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
});
