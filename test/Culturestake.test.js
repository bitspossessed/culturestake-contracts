const util = require('ethereumjs-util');
const abi = require('ethereumjs-abi');
const solsha3 = require('solidity-sha3').default;

const { assertRevert } = require('./helpers/assertRevert');
const { getTimestampFromTx } = require('./helpers/getTimestamp');
const { bn } = require('./helpers/constants');
const { increase } = require('./helpers/increaseTime');
const { ZERO_ADDRESS, timestamp } = require('./helpers/constants');


require('chai')
  .use(require('chai-bn')(web3.utils.BN))
  .should();

const Culturestake = artifacts.require('MockCulturestake');

contract('Culturestake', ([_, owner, attacker]) => {
  let culturestake;
  const festival = web3.utils.sha3('my festival');
  const booth = web3.eth.accounts.create();
  const duration = 100000;

  beforeEach(async () => {
    culturestake = await Culturestake.new([owner], { from: owner });
  });

  it('owner can create festival', async () => {
    await culturestake.initFestival(festival, timestamp(), duration, { from: owner });
    ((await culturestake.getFestival(festival))[0]).should.be.equal(true);
  });

  it('should have right duration', async () => {
    await culturestake.initFestival(festival, timestamp(), duration, { from: owner });
    ((await culturestake.getFestival(festival))[2]).should.be.bignumber.equal(bn(duration));
  });

  it('should set starttime', async () => {
    const tx = await culturestake.initFestival(festival, timestamp(), duration, { from: owner });
    const time = await getTimestampFromTx(tx, web3);
    ((await culturestake.getFestival(festival))[1]).should.be.bignumber.equal(bn(time));
  });

  it('only owner can create festival', async () => {
    await assertRevert(
      culturestake.initFestival(festival, timestamp(), duration, { from: attacker })
    );
  });

  describe('after festival is created', () => {
    beforeEach(async () => {
      const starttime = await culturestake.getTimestamp();
      await culturestake.initFestival(festival, starttime, duration, { from: owner });
    });

    it('owner can deactivate festival', async () => {
      await culturestake.deactivateFestival(festival, { from: owner });
      ((await culturestake.getFestival(festival))[0]).should.be.equal(false);
    });

    it('only owner can deactivate festival', async () => {
      await assertRevert(culturestake.deactivateFestival(festival, { from: attacker }));
    });

    it('isValidFestival should return true for active festivals', async () => {
      (await culturestake.isValidFestival(festival)).should.be.equal(true);
    });

    it('isValidFestival should return false for deactivated festivals', async () => {
      await culturestake.deactivateFestival(festival, { from: owner });
      (await culturestake.isValidFestival(festival)).should.be.equal(false);
    });

    it('isValidFestival should return true for festivals that are currently underway', async () => {
      await increase(Math.floor(duration / 2));
      (await culturestake.isValidFestival(festival)).should.be.equal(true);
    });

    it('isValidFestival should return false for expired festivals', async () => {
      await increase(duration);
      (await culturestake.isValidFestival(festival)).should.be.equal(false);
    });

    it('owner can create votingbooth', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      ((await culturestake.getVotingBooth(booth.address))[0]).should.be.equal(true);
    });

    it('votingbooth is attached to correct festival', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      ((await culturestake.getVotingBooth(booth.address))[1]).should.be.equal(festival);
    });

    it('only owner can create votingbooth', async () => {
      await assertRevert(
        culturestake.initVotingBooth(festival, booth.address, { from: attacker }),
      );
    });

    it('owner can deactivate votingbooth', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      await culturestake.deactivateVotingBooth(booth.address, { from: owner });
      ((await culturestake.getVotingBooth(booth.address))[0]).should.be.equal(false);
    });

    it('only owner can deactivate votingbooth', async () => {
      await culturestake.initVotingBooth(festival, booth.address, { from: owner });
      await assertRevert(
        culturestake.deactivateVotingBooth(booth.address, { from: attacker }),
      );
    });

    it('isValidVotingBooth should return true for valid voting booth', async () => {
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
      (await culturestake.isValidVotingBooth(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      )).should.be.equal(booth.address);
    });

    it('isValidVotingBooth should return false for deactivated voting booth', async () => {
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
      (await culturestake.isValidVotingBooth(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      )).should.be.equal(ZERO_ADDRESS);
    });


    it('isValidVotingBooth should return false for wrong festival', async () => {
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
      (await culturestake.isValidVotingBooth(
        otherFestival, [answer], nonce, sig.v, sig.r, sig.s,
      )).should.be.equal(ZERO_ADDRESS);
    });

    it('isValidVotingBooth should return false for used nonce', async () => {
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
      await culturestake.validateVotingBooth(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      );
      (await culturestake.isValidVotingBooth(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      )).should.be.equal(ZERO_ADDRESS);
    });

    it('isValidVotingBooth should return false for used nonce', async () => {
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
      await culturestake.validateVotingBooth(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      );
      (await culturestake.isValidVotingBooth(
        festival, [answer], nonce, sig.v, sig.r, sig.s,
      )).should.be.equal(ZERO_ADDRESS);
    });

    it('isValidVotingBooth should return false for invalid signature', async () => {
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
      (await culturestake.isValidVotingBooth(
        festival, [answer], nonce, sig.v + 1, sig.r, sig.s,
      )).should.be.equal(ZERO_ADDRESS);
    });

    it('isValidVotingNonce should return true for new nonce', async () => {
    });

    it('isValidVotingNonce should return false for used nonce', async () => {
    });
  });
});
