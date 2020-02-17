require('dotenv').config();

const Admin = artifacts.require('Admin');

module.exports = function (deployer) {
  deployer.deploy(Admin, [process.env.ADDR1, process.env.ADDR2]);
};
