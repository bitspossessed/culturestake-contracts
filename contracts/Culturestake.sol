pragma solidity ^0.5.0;

import './Admin.sol';

contract Culturestake is Admin {
  mapping (string => Festival) festivals;
  mapping (address => VotingBooth) votingBooths;

  struct VotingBooth {
    bool active;
    bytes32 festival;
    mapping (uint256 => bool) nonces;
  }

  struct Festival {
    bool active;
    uint256 createdAt;
    uint256 duration;
    mapping (address => bool) questions;
  }

  constructor() public {

  }

  function isValidFestival(string memory _festival) internal {
    require(festivals[_festival].active);
    require(festivals[_festival].createdAt + festivals[_festival].duration >= block.timestamp);
  }

  function isValidVotingBooth(
    string memory _festival,
    uint256 _nonce,
    uint8 sigV,
    bytes32 sigR,
    bytes32 sigS) internal {
      bytes32 h = keccak256(abi.encodePacked(byte(0x19), byte(0), _festival, _nonce));
      address addressFromSig = ecrecover(h, sigV, sigR, sigS);
      require(votingBooths[addressFromSig].active);
      require(votingBooths[addressFromSig].festival == _festival);
      require(!votingBooths[addressFromSig].nonces[_nonce]);
      votingBooths[addressFromSig].nonces[_nonce] = true;
  }

  function initVotingBooth(
    string memory _festival,
    address _booth) public authorized {
      votingBooths[_booth].active = true;
      votingBooths[_booth].festival = _festival;
  }

  function deactivateVotingBooth(address _booth) public authorized {
    votingBooths[_booth].active = false;
  }

  function initFestival(
    string memory _festival,
    uint256 _duration
    ) public authorized {
    festivals[_festival].active = true;
    festivals[_festival].createdAt = block.timestamp;
    festivals[_festival].duration = _duration;
  }

  function deactivateFestival(string memory _festival) public authorized {
    festivals[_festival].active = false;
  }

  function vote() public {

  }

}