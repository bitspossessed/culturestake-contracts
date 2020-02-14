require('chai')
  .use(require('chai-bn')(web3.utils.BN))
  .should();

const Admin = artifacts.require('Admin');

contract('Admin', ([_, owner]) => {
  let admin;

  beforeEach(async () => {
    admin = await Admin.new([owner], { from: owner });
  });

  it('has the correct owner', async () => {
    (await admin.getOwners()).should.be.deep.equal([owner]);
  });
});
