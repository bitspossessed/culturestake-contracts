const { assertRevert } = require('./helpers/assertRevert');
const { getTimestamp } = require('./helpers/getTimestamp');
const { bn } = require('./helpers/constants');
const { increase } = require('./helpers/increaseTime');


require('chai')
  .use(require('chai-bn')(web3.utils.BN))
  .should();

const Culturestake = artifacts.require('Culturestake');

contract('Culturestake', ([_, owner, attacker]) => {
  let culturestake;
  const festival = web3.utils.sha3('my festival');
  const duration = 1000;

  beforeEach(async () => {
    culturestake = await Culturestake.new([owner], { from: owner });
  });

  it('owner can create festival', async () => {
    await culturestake.initFestival(festival, duration, { from: owner });
    ((await culturestake.getFestival(festival))[0]).should.be.equal(true);
  });

  it('should have right duration', async () => {
    await culturestake.initFestival(festival, duration, { from: owner });
    ((await culturestake.getFestival(festival))[2]).should.be.bignumber.equal(bn(duration));
  });

  it('should set createdAt', async () => {
    const tx = await culturestake.initFestival(festival, duration, { from: owner });
    const time = await getTimestamp(tx, web3);
    ((await culturestake.getFestival(festival))[1]).should.be.bignumber.equal(bn(time));
  });

  it('only owner can create festival', async () => {
    await assertRevert(culturestake.initFestival(festival, duration, { from: attacker }));
  });

  it('owner can deactivate festival', async () => {
    await culturestake.initFestival(festival, duration, { from: owner });
    await culturestake.deactivateFestival(festival, { from: owner });
    ((await culturestake.getFestival(festival))[0]).should.be.equal(false);
  });

  it('only owner can deactivate festival', async () => {
    await culturestake.initFestival(festival, duration, { from: owner });
    await assertRevert(culturestake.deactivateFestival(festival, { from: attacker }));
  });

  it('isValidFestival should return true for active festivals', async () => {
    await culturestake.initFestival(festival, duration, { from: owner });
    (await culturestake.isValidFestival(festival)).should.be.equal(true);
  });

  it('isValidFestival should return false for deactivated festivals', async () => {
    await culturestake.initFestival(festival, duration, { from: owner });
    await culturestake.deactivateFestival(festival, { from: owner });
    (await culturestake.isValidFestival(festival)).should.be.equal(false);
  });

  it('isValidFestival should return false for expired festivals', async () => {
    await culturestake.initFestival(festival, duration, { from: owner });
    await culturestake.deactivateFestival(festival, { from: owner });
    await increase(duration);
    (await culturestake.isValidFestival(festival)).should.be.equal(false);
  });
});
