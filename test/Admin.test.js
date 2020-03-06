const { SENTINEL_OWNERS } = require('./helpers/constants');
const { assertRevert } = require('./helpers/assertRevert');

require('chai')
  .use(require('chai-bn')(web3.utils.BN))
  .should();

const Admin = artifacts.require('Admin');

contract('Admin', ([_, owner, secondOwner, attacker]) => {
  let admin;

  it('has the correct owner', async () => {
    admin = await Admin.new([owner], { from: owner });
    (await admin.getOwners()).should.be.deep.equal([owner]);
  });

  it('has the correct owners', async () => {
    admin = await Admin.new([owner, secondOwner], { from: owner });
    (await admin.getOwners()).should.be.deep.equal([owner, secondOwner]);
  });

  it('does not need to be deployed by owner', async () => {
    admin = await Admin.new([secondOwner], { from: owner });
    (await admin.getOwners()).should.be.deep.equal([secondOwner]);
  });

  it('can swap owner', async () => {
    admin = await Admin.new([owner], { from: owner });
    await admin.swapOwner(SENTINEL_OWNERS, owner, secondOwner, { from: owner });
    (await admin.getOwners()).should.be.deep.equal([secondOwner]);
  });

  it('only owner can swap owners', async () => {
    admin = await Admin.new([owner], { from: owner });
    await assertRevert(admin.swapOwner(SENTINEL_OWNERS, owner, secondOwner, { from: attacker }));
  });

  it('can remove owner', async () => {
    admin = await Admin.new([owner, secondOwner], { from: owner });
    await admin.removeOwner(SENTINEL_OWNERS, owner, { from: owner });
    (await admin.getOwners()).should.be.deep.equal([secondOwner]);
  });

  it('only owner can remove owner', async () => {
    admin = await Admin.new([owner, secondOwner], { from: owner });
    await assertRevert(admin.removeOwner(SENTINEL_OWNERS, owner, { from: attacker }));
  });

  it('can add owner', async () => {
    admin = await Admin.new([owner], { from: owner });
    await admin.addOwner(secondOwner, { from: owner });
    (await admin.getOwners()).should.be.deep.equal([secondOwner, owner]);
  });

  it('only owner can add owner', async () => {
    admin = await Admin.new([owner], { from: owner });
    await assertRevert(admin.addOwner(secondOwner, { from: attacker }));
  });

  it('isOwner returns true for owner', async () => {
    admin = await Admin.new([owner], { from: owner });
    (await admin.isOwner(owner)).should.be.equal(true);
  });

  it('isOwner returns false for nonowner', async () => {
    admin = await Admin.new([owner], { from: owner });
    (await admin.isOwner(attacker)).should.be.equal(false);
  });
});
