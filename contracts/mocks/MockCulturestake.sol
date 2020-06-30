pragma solidity ^0.5.0;
import "../Culturestake.sol";

contract MockCulturestake is Culturestake {
    constructor(address[] memory _owners)
    Culturestake(_owners)
    public {

    }

    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }
}