pragma solidity ^0.5.0;

import './Admin.sol';
import './Question.sol';

contract Culturestake is Admin {
  mapping (bytes32 => Festival) festivals;
  mapping (address => VotingBooth) votingBooths;
  mapping (address => bool) public questions;

  struct VotingBooth {
    bool active;
    bytes32 festival;
    mapping (uint256 => bool) nonces;
  }

  struct Festival {
    bool active;
    uint256 startTime;
    uint256 duration;
    mapping (address => bool) questions;
  }

  event InitQuestion(bytes32 festival, address questionAddress, uint8 questionType, bytes32 question);
  event InitFestival(bytes32 festival, uint256 startTime, uint256 duration);
  event InitVotingBooth(bytes32 festival, address boothAddress);

  event DeactivateQuestion(address questionAddress);
  event DeactivateFestival(bytes32 festival);
  event DeactivateVotingBooth(address boothAddress);

  modifier onlyQuestions() {
      require(questions[msg.sender], "Method can only be called by questions");
      _;
  }

  constructor(address[] memory _owners) public Admin(_owners) {}

  function isValidFestival(bytes32 _festival) public view returns (bool) {
    // case festival has been manually deactivated
    if (!festivals[_festival].active) return false;
    // case festival hasn't started
    if (festivals[_festival].startTime > block.timestamp) return false;
    // case festival has expired
    uint256 festivalEnd = festivals[_festival].startTime + festivals[_festival].duration;
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
    _burnNonce(addressFromSig, _nonce);
    return true;
  }

  function _burnNonce(address _booth, uint256 _nonce) internal {
    votingBooths[_booth].nonces[_nonce] = true;
  }

  function burnNonce(address _booth, uint256 _nonce) public onlyQuestions {
    _burnNonce(_booth, _nonce);
  }

  function initVotingBooth(
    bytes32 _festival,
    address _booth
  ) public authorized {
      require(isValidFestival(_festival));
      votingBooths[_booth].active = true;
      votingBooths[_booth].festival = _festival;
      emit InitVotingBooth(_festival, _booth);
  }

  function deactivateVotingBooth(address _booth) public authorized {
    votingBooths[_booth].active = false;
    emit DeactivateVotingBooth(_booth);
  }

  function getVotingBooth(address _booth) public view returns (bool, bytes32) {
    return (votingBooths[_booth].active, votingBooths[_booth].festival);
  }

  function isValidVotingNonce(address _booth, uint256 _nonce) public view returns (bool) {
    return (!votingBooths[_booth].nonces[_nonce]);
  }

  function initFestival(
    bytes32 _festival,
    uint256 _startTime,
    uint256 _duration
  ) public authorized {
    festivals[_festival].active = true;
    festivals[_festival].startTime = _startTime;
    festivals[_festival].duration = _duration;
    emit InitFestival(_festival, _startTime, _duration);
  }

  function deactivateFestival(bytes32 _festival) public authorized {
    festivals[_festival].active = false;
    emit DeactivateFestival(_festival);
  }

  function getFestival(bytes32 _festival) public view returns (bool, uint256, uint256) {
    return (
      festivals[_festival].active,
      festivals[_festival].startTime,
      festivals[_festival].duration
    );
  }

  function deactivateQuestion(address _question) public authorized {
    questions[_question] = false;
    emit DeactivateQuestion(_question);
  }

  function initQuestion(
    uint8 _questionType,
    bytes32 _question,
    uint256 _maxVoteTokens,
    bytes32 _festival
  ) public authorized {
    require(isValidFestival(_festival));
    Question questionContract = new Question(_questionType, _question, _maxVoteTokens, _festival);
    questions[address(questionContract)] = true;
    emit InitQuestion(_festival, address(questionContract), _questionType, _question);
  }
}