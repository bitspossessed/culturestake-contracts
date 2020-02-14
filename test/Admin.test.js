require('chai')
  .use(require('chai-bn')(web3.utils.BN))
  .should();

const Admin = artifacts.require('Admin');

contract('Admin', ([_, owner, secondOwner]) => {
  let admin;

  // beforeEach(async () => {
  //   admin = await Admin.new([owner], { from: owner });
  // });

  it('has the correct owner', async () => {
    admin = await Admin.new([owner], { from: owner });
    (await admin.getOwners()).should.be.deep.equal([owner]);
  });

  it('has the correct owner', async () => {
    admin = await Admin.new([owner, secondOwner], { from: owner });
    (await admin.getOwners()).should.be.deep.equal([owner, secondOwner]);
  });
});
