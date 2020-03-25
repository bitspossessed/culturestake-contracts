pragma solidity ^0.5.0;

import './Admin.sol';

contract Question {
  address public admin;
  uint8 public questionType;
  bytes32 public question;
  bytes32 public festival;
  bool public active;
  uint256 public maxVoteTokens;
  uint256 public votes;
  mapping (bytes32 => Answer) answers;
  mapping (address => bool) hasVoted;

  struct Answer {
    bool active;
    bytes32 sigS;
    bytes32 sigR;
    uint8 sigV;
    uint256 votePower;
    uint256 voteTokens;
    uint256 votes;
  }

  modifier authorized() {
      require(admin == msg.sender, "Method can only be called by owner");
      _;
  }

  modifier onlyRelayer() {
    // should check relayer whitelist in admin contract
    require(admin == msg.sender, "Method can only be called by owner");
    _;
  }

  constructor(
    uint8 _questionType,
    bytes32 _question,
    uint256 _maxVoteTokens,
    bytes32 _festival
  ) public {
    admin = msg.sender;
    active = true;
    maxVoteTokens = _maxVoteTokens;
    questionType = _questionType;
    question = _question;
    festival = _festival;
  }

  function deactivateQuestion() public authorized {
    active = false;
  }

  function initAnswer(bytes32 _sigS, bytes32 _sigR, uint8 _sigV) public authorized {
    answers[_sigS].active = true;
    answers[_sigS].sigS = _sigS;
    answers[_sigS].sigR = _sigR;
    answers[_sigS].sigV = _sigV;
  }

  function deactivateAnswer(bytes32 _answer) public authorized {
    answers[_answer].active = false;
  }

  function sqrt(uint256 num) internal view returns (uint256) {
    //should be the sqrt
    return num;
  }

  function recordVote(
    address sender,
    bytes32[] memory _answers,
    uint256[] memory _voteTokens
    //string memory _festival
    //uint256 nonce
    // uint8 sigV
    // bytes32 sigR
    // bytes32 sigS

    ) public onlyRelayer returns (bool) {

    require(!hasVoted[sender]);
    require(_answers.length == _voteTokens.length);
    //require(festival == _festival);
    //require validateVotingBooth(_festival, _answers, _nonce, sigV, sigR, sigS)
    //require no duplicates in _answers array

    for (uint i = 0; i < _answers.length; i++) {
      require(answers[_answers[i]].active);
      answers[_answers[i]].votes = answers[_answers[i]].votes + 1;
      answers[_answers[i]].voteTokens = answers[_answers[i]].voteTokens + _voteTokens[i];
      answers[_answers[i]].votePower = answers[_answers[i]].votePower + sqrt(_voteTokens[i]);
      //add event
    }
    return true;
  }
}