pragma solidity ^0.5.0;

contract CulturestakeI {
    function burnNonce(address, uint256) public;
    function isOwner(address) public view returns (bool);
    function questions(address) public returns (bool);
    function isValidFestival(bytes32) public returns (bool);
    function validateVotingBooth(
        bytes32 _festival,
        bytes32[] memory _answers,
        uint256 _nonce,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS
    ) public returns(bool);
}