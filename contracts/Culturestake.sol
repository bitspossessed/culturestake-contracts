pragma solidity ^0.5.0;

import './Admin.sol';
import './Question.sol';

contract Culturestake is Admin {
  mapping (bytes32 => Festival) festivals;
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

  constructor(address[] memory _owners) public Admin(_owners) {}

  function isValidFestival(bytes32 _festival) public view returns (bool) {
    // case festival has been manually deactivated
    if (!festivals[_festival].active) return false;
    // case festival has expired
    uint256 festivalEnd = festivals[_festival].createdAt + festivals[_festival].duration;
    if (festivalEnd <= block.timestamp) return false;
    return true;
  }

  function isValidVotingBooth(
    bytes32 _festival,
    bytes32[] memory _answers,
    uint256 _nonce,
    uint8 sigV,
    bytes32 sigR,
    bytes32 sigS
  ) public view returns (address) {
      //bytes32 h = keccak256(abi.encodePacked(byte(0x19), byte(0), _answers, _nonce));
      bytes32 h = getHash(_answers, _nonce);
      address addressFromSig = ecrecover(h, sigV, sigR, sigS);
      if (!votingBooths[addressFromSig].active) return address(0);
      if (!(votingBooths[addressFromSig].festival == _festival)) return address(0);
      if (!isValidVotingNonce(addressFromSig, _nonce)) return address(0);
      return addressFromSig;
  }

  function getHash(
    bytes32[] memory _answers,
    uint256 _nonce
  ) public view returns (bytes32) {
    return keccak256(abi.encode(_answers, _nonce));
  }

  // function getEncoding(
  //   bytes32[] memory _answers,
  //   uint256 _nonce
  // ) public view returns (bytes memory) {
  //   return abi.encode(_answers, _nonce);
  // }

  function validateVotingBooth(
    bytes32 _festival,
    bytes32[] memory _answers,
    uint256 _nonce,
    uint8 sigV,
    bytes32 sigR,
    bytes32 sigS
  ) public returns (bool) {
    address addressFromSig = isValidVotingBooth(_festival, _answers, _nonce, sigV, sigR, sigS);
    require(addressFromSig != address(0));
    votingBooths[addressFromSig].nonces[_nonce] = true;
    return true;
  }

  function initVotingBooth(
    bytes32 _festival,
    address _booth
  ) public authorized {
      require(isValidFestival(_festival));
      votingBooths[_booth].active = true;
      votingBooths[_booth].festival = _festival;
  }

  function deactivateVotingBooth(address _booth) public authorized {
    votingBooths[_booth].active = false;
  }

  function getVotingBooth(address _booth) public view returns (bool, bytes32) {
    return (votingBooths[_booth].active, votingBooths[_booth].festival);
  }

  function isValidVotingNonce(address _booth, uint256 _nonce) public view returns (bool) {
    return (!votingBooths[_booth].nonces[_nonce]);
  }

  function initFestival(
    bytes32 _festival,
    uint256 _duration
  ) public authorized {
    festivals[_festival].active = true;
    festivals[_festival].createdAt = block.timestamp;
    festivals[_festival].duration = _duration;
  }

  function deactivateFestival(bytes32 _festival) public authorized {
    festivals[_festival].active = false;
  }

  function getFestival(bytes32 _festival) public view returns (bool, uint256, uint256) {
    return (
      festivals[_festival].active,
      festivals[_festival].createdAt,
      festivals[_festival].duration
    );
  }

  function initQuestion(
    uint8 _questionType,
    bytes32 _question,
    uint256 _maxVoteTokens,
    bytes32 _festival
  ) public authorized {
    new Question(_questionType, _question, _maxVoteTokens, _festival);
  }
}