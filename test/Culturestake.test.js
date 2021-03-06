const util = require('ethereumjs-util');
const abi = require('ethereumjs-abi');
const solsha3 = require('solidity-sha3').default;

const { assertRevert } = require('./helpers/assertRevert');
const { bn } = require('./helpers/constants');
const { increase } = require('./helpers/increaseTime');
const { ZERO_ADDRESS, timestamp } = require('./helpers/constants');
const expectEvent = require('./helpers/expectEvent');

require('chai')
  .use(require('chai-bn')(web3.utils.BN))
  .should();

const Culturestake = artifacts.require('MockCulturestake');
const Question = artifacts.require('Question');

const validStartTime = () => timestamp() + 10;

contract('Culturestake', ([_, owner, attacker]) => {
  let culturestake;
  let questionMasterCopy;
  let startTime;
  let endTime;
  const question = web3.utils.sha3('question');
  const festival = web3.utils.sha3('festival');
  const booth = web3.eth.accounts.create();
  const duration = 1000000;

  beforeEach(async () => {
    startTime = validStartTime();
    endTime = startTime + duration;
    questionMasterCopy = await Question.new({ from: owner });
    await questionMasterCopy.setup(ZERO_ADDRESS, question, 0, festival);
    culturestake = await Culturestake.new([owner], questionMasterCopy.address, { from: owner });
  });

  it('owner can change questionMasterCopy', async () => {
    questionMasterCopy = await Question.new({ from: owner });
    await questionMasterCopy.setup(ZERO_ADDRESS, question, 0, festival);
    await culturestake.setQuestionMasterCopy(questionMasterCopy.address, { from: owner });
    (await culturestake.questionMasterCopy()).should.be.equal(questionMasterCopy.address);
  });

  it('only owner can change questionMasterCopy', async () => {
    await assertRevert(
      culturestake.setQuestionMasterCopy(questionMasterCopy.address, { from: attacker }),
    );
  });

  it('owner can set voteRelayer', async () => {
    const voteRelayer = web3.eth.accounts.create();
    await culturestake.setVoteRelayer(voteRelayer.address, { from: owner });
    (await culturestake.voteRelayer()).should.be.equal(voteRelayer.address);
  });

  it('only owner can set voteRelayer', async () => {
    const voteRelayer = web3.eth.accounts.create();
    await assertRevert(
      culturestake.setVoteRelayer(voteRelayer.address, { from: attacker }),
    );
  });

  it('owner can create festival', async () => {
    await culturestake.initFestival(festival, validStartTime(), endTime, { from: owner });
    ((await culturestake.getFestival(festival))[0]).should.be.equal(true);
  });

  it('owner cant create festival that starts in the past', async () => {
    await assertRevert(
      culturestake.initFestival(festival, validStartTime() - 100, endTime, { from: owner }),
    );
  });

  it('owner cant create festival that ends before it starts', async () => {
    await assertRevert(
      culturestake.initFestival(festival, validStartTime(), validStartTime() - 100, { from: owner }),
    );
  });

  it('creating festival should emit InitFestival', async () => {
    await culturestake.initFestival(festival, startTime, endTime, { from: owner });
    const logs = await culturestake.getPastEvents('InitFestival', { fromBlock: 0, toBlock: 'latest' });
    const event = expectEvent.inLogs(logs, 'InitFestival', {
      festival,
    });
    return event.args.startTime.should.be.bignumber.equal(bn(startTime));
  });

  it('should have right endTime', async () => {
    await culturestake.initFestival(festival, startTime, endTime, { from: owner });
    ((await culturestake.getFestival(festival))[3]).should.be.bignumber.equal(bn(endTime));
  });

  it('should set starttime', async () => {
    await culturestake.initFestival(festival, startTime, endTime, { from: owner });
    ((await culturestake.getFestival(festival))[2]).should.be.bignumber.equal(bn(startTime));
  });

  it('only owner can create festival', async () => {
    await assertRevert(
      culturestake.initFestival(festival, startTime, endTime, { from: attacker }),
    );
  });

  describe('after festival is created', () => {
    beforeEach(async () => {
      startTime = await culturestake.getTimestamp();
      startTime = parseInt(startTime, 10) + 10;
      endTime = startTime + duration;
      await culturestake.initFestival(festival, startTime, endTime, { from: owner });
    });

    it('cannot re-init festival', async () => {
      await assertRevert(culturestake.initFestival(festival, startTime, endTime, { from: owner }));
    });

    it('owner can deactivate festival', async () => {
      await culturestake.deactivateFestival(festival, { from: owner });
      ((await culturestake.getFestival(festival))[1]).should.be.equal(true);
    });

    it('should emit DeactivateFestival', async () => {
      await culturestake.deactivateFestival(festival, { from: owner });
      const logs = await culturestake.getPastEvents('DeactivateFestival', { fromBlock: 0, toBlock: 'latest' });
      const event = expectEvent.inLogs(logs, 'DeactivateFestival', {
        festival,
      });
      return event.args.festival.should.be.equal(festival);
    });

    it('only owner can deactivate festival', async () => {
      await assertRevert(culturestake.deactivateFestival(festival, { from: attacker }));
    });

    it('isActiveFestival should return true for active festivals', async () => {
      await increase(15);
      (await culturestake.isActiveFestival(festival)).should.be.equal(true);
    });

    it('isActiveFestival should return false for uninited festivals', async () => {
      (await culturestake.isActiveFestival(web3.utils.sha3('wrong festival'))).should.be.equal(false);
    });

    it('isActiveFestival should return false for deactivated festivals', async () => {
      await culturestake.deactivateFestival(festival, { from: owner });
      (await culturestake.isActiveFestival(festival)).should.be.equal(false);
    });

    it('isActiveFestival should return true for festivals that are currently underway', async () => {
      await increase(Math.floor(duration / 2));
      (await culturestake.isActiveFestival(festival)).should.be.equal(true);
    });

    it('isActiveFestival should return false for expired festivals', async () => {
      await increase(duration + 11);
      (await culturestake.isActiveFestival(festival)).should.be.equal(false);
    });

    it('owner can create votingbooth', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      ((await culturestake.getVotingBooth(booth.address))[0]).should.be.equal(true);
    });

    it('cannot reinit votingbooth', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      await assertRevert(culturestake.initVotingBooth(festival, booth.address, { from: owner }));
    });

    it('should emit InitVotingBooth', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      const logs = await culturestake.getPastEvents('InitVotingBooth', { fromBlock: 0, toBlock: 'latest' });
      const event = expectEvent.inLogs(logs, 'InitVotingBooth', {
        festival,
      });
      return event.args.boothAddress.should.be.equal(booth.address);
    });

    it('votingbooth is attached to correct festival', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      ((await culturestake.getVotingBooth(booth.address))[2]).should.be.equal(festival);
    });

    it('only owner can create votingbooth', async () => {
      await assertRevert(
        culturestake.initVotingBooth(festival, booth.address, { from: attacker }),
      );
    });

    it('owner can deactivate votingbooth', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      await culturestake.deactivateVotingBooth(booth.address, { from: owner });
      ((await culturestake.getVotingBooth(booth.address))[1]).should.be.equal(true);
    });

    it('should emit DeactivateVotingBooth', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      await culturestake.deactivateVotingBooth(booth.address, { from: owner });
      const logs = await culturestake.getPastEvents('DeactivateVotingBooth', { fromBlock: 0, toBlock: 'latest' });
      const event = expectEvent.inLogs(logs, 'DeactivateVotingBooth');
      return event.args.boothAddress.should.be.equal(booth.address);
    });

    it('only owner can deactivate votingbooth', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      await assertRevert(
        culturestake.deactivateVotingBooth(booth.address, { from: attacker }),
      );
    });

    it('checkBoothSignature should return the correct address for valid voting booth', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      const answer = web3.utils.sha3('an answer');
      const nonce = 12;
      let encoded = abi.rawEncode(['bytes32[]', 'uint256'], [[answer], nonce]);
      encoded = `0x${encoded.toString('hex')}`;
      const hash = solsha3(encoded);
      const sig = util.ecsign(
        Buffer.from(util.stripHexPrefix(hash), 'hex'),
        Buffer.from(util.stripHexPrefix(booth.privateKey), 'hex'),
      );
      (await culturestake.checkBoothSignature(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      )).should.be.equal(booth.address);
    });

    it('checkBoothSignature should return the zero address for uninited booth', async () => {
      const answer = web3.utils.sha3('an answer');
      const nonce = 12;
      let encoded = abi.rawEncode(['bytes32[]', 'uint256'], [[answer], nonce]);
      encoded = `0x${encoded.toString('hex')}`;
      const hash = solsha3(encoded);
      const sig = util.ecsign(
        Buffer.from(util.stripHexPrefix(hash), 'hex'),
        Buffer.from(util.stripHexPrefix(booth.privateKey), 'hex'),
      );
      (await culturestake.checkBoothSignature(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      )).should.be.equal(ZERO_ADDRESS);
    });

    it('checkBoothSignature should return the zero address for deactivated voting booth', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      await culturestake.deactivateVotingBooth(booth.address, { from: owner });
      const answer = web3.utils.sha3('an answer');
      const nonce = 12;
      let encoded = abi.rawEncode(['bytes32[]', 'uint256'], [[answer], nonce]);
      encoded = `0x${encoded.toString('hex')}`;
      const hash = solsha3(encoded);
      const sig = util.ecsign(
        Buffer.from(util.stripHexPrefix(hash), 'hex'),
        Buffer.from(util.stripHexPrefix(booth.privateKey), 'hex'),
      );
      (await culturestake.checkBoothSignature(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      )).should.be.equal(ZERO_ADDRESS);
    });

    it('checkBoothSignature should return the zero address for wrong festival', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      const otherFestival = web3.utils.sha3('other festival');
      const answer = web3.utils.sha3('an answer');
      const nonce = 12;
      let encoded = abi.rawEncode(['bytes32[]', 'uint256'], [[answer], nonce]);
      encoded = `0x${encoded.toString('hex')}`;
      const hash = solsha3(encoded);
      const sig = util.ecsign(
        Buffer.from(util.stripHexPrefix(hash), 'hex'),
        Buffer.from(util.stripHexPrefix(booth.privateKey), 'hex'),
      );
      (await culturestake.checkBoothSignature(
        otherFestival, [answer], nonce, sig.v, sig.r, sig.s,
      )).should.be.equal(ZERO_ADDRESS);
    });

    it('checkBoothSignature should return the zero address for used nonce', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      const answer = web3.utils.sha3('an answer');
      const nonce = 12;
      let encoded = abi.rawEncode(['bytes32[]', 'uint256'], [[answer], nonce]);
      encoded = `0x${encoded.toString('hex')}`;
      const hash = solsha3(encoded);
      const sig = util.ecsign(
        Buffer.from(util.stripHexPrefix(hash), 'hex'),
        Buffer.from(util.stripHexPrefix(booth.privateKey), 'hex'),
      );
      await culturestake.checkBoothSignatureAndBurnNonce(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      );
      (await culturestake.checkBoothSignature(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      )).should.be.equal(ZERO_ADDRESS);
    });

    it('checkBoothSignature should return false for used nonce', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      const answer = web3.utils.sha3('an answer');
      const nonce = 12;
      let encoded = abi.rawEncode(['bytes32[]', 'uint256'], [[answer], nonce]);
      encoded = `0x${encoded.toString('hex')}`;
      const hash = solsha3(encoded);
      const sig = util.ecsign(
        Buffer.from(util.stripHexPrefix(hash), 'hex'),
        Buffer.from(util.stripHexPrefix(booth.privateKey), 'hex'),
      );
      await culturestake.checkBoothSignatureAndBurnNonce(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      );
      (await culturestake.checkBoothSignature(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      )).should.be.equal(ZERO_ADDRESS);
    });

    it('checkBoothSignature should return the zero address for invalid signature', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      const answer = web3.utils.sha3('an answer');
      const nonce = 12;
      let encoded = abi.rawEncode(['bytes32[]', 'uint256'], [[answer], nonce]);
      encoded = `0x${encoded.toString('hex')}`;
      const hash = solsha3(encoded);
      const sig = util.ecsign(
        Buffer.from(util.stripHexPrefix(hash), 'hex'),
        Buffer.from(util.stripHexPrefix(booth.privateKey), 'hex'),
      );
      (await culturestake.checkBoothSignature(
        festival, [answer], nonce, sig.v + 1, sig.r, sig.s,
      )).should.be.equal(ZERO_ADDRESS);
    });

    it('isValidVotingNonce should return true for new nonce', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      (await culturestake.isValidVotingNonce(booth.address, 12)).should.be.equal(true);
    });

    it('isValidVotingNonce should return false for used nonce', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      const answer = web3.utils.sha3('an answer');
      const nonce = 12;
      let encoded = abi.rawEncode(['bytes32[]', 'uint256'], [[answer], nonce]);
      encoded = `0x${encoded.toString('hex')}`;
      const hash = solsha3(encoded);
      const sig = util.ecsign(
        Buffer.from(util.stripHexPrefix(hash), 'hex'),
        Buffer.from(util.stripHexPrefix(booth.privateKey), 'hex'),
      );
      await culturestake.checkBoothSignatureAndBurnNonce(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      );
      (await culturestake.isValidVotingNonce(booth.address, 12)).should.be.equal(false);
    });
  });
});
