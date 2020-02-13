pragma solidity ^0.5.0;

import "@gnosis.pm/safe-contracts/contracts/base/OwnerManager.sol";

contract Admin is OwnerManager {
    constructor(address[] memory _owners, uint256 _threshold) public {
        setupOwners(_owners, _threshold);
    }
}