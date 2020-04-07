pragma solidity ^0.5.0;

import './interfaces/CulturestakeI.sol';

contract Question {
  address public admin;
  uint8 public questionType;
  bytes32 public question;
  bytes32 public festival;
  uint256 public maxVoteTokens;
  uint256 public votes;
  mapping (bytes32 => Answer) answers;
  mapping (address => bool) public hasVoted;

  struct Answer {
    bool active;
    bytes32 answer;
    uint256 votePower;
    uint256 voteTokens;
    uint256 votes;
  }

  event InitAnswer(bytes32 answer);

  modifier authorized() {
      require(CulturestakeI(admin).isOwner(msg.sender), "Must be an admin" );
      _;
  }

  constructor(
    uint8 _questionType,
    bytes32 _question,
    uint256 _maxVoteTokens,
    bytes32 _festival
  ) public {
    admin = msg.sender;
    maxVoteTokens = _maxVoteTokens;
    questionType = _questionType;
    question = _question;
    festival = _festival;
  }

  function initAnswer(bytes32 _answer) public authorized {
    answers[_answer].active = true;
    answers[_answer].answer = _answer;
    emit InitAnswer(_answer);
  }

  function deactivateAnswer(bytes32 _answer) public authorized {
    answers[_answer].active = false;
  }

  function getAnswer(bytes32 _answer) public returns (bool, uint256, uint256, uint256) {
    return (
      answers[_answer].active,
      answers[_answer].votePower,
      answers[_answer].voteTokens,
      answers[_answer].votes
    );
  }

  function sqrt(uint256 num) internal view returns (uint256) {
    //should be the sqrt
    return num;
  }

  function recordVote(
    bytes32[] memory _answers,
    uint256[] memory _voteTokens,
    bytes32 _festival,
    uint256 _nonce,
    uint8 sigV,
    bytes32 sigR,
    bytes32 sigS
  ) public returns (bool) {
    require(CulturestakeI(admin).questions(address(this)));
    require(!hasVoted[msg.sender]);
    require(_answers.length == _voteTokens.length);
    require(festival == _festival);
    require(CulturestakeI(admin).isValidFestival(_festival));
    require(CulturestakeI(admin).validateVotingBooth(_festival, _answers, _nonce, sigV, sigR, sigS));
    //require no duplicates in _answers array
    //require not more than _maxVoteTokens
    hasVoted[msg.sender] = true;
    for (uint i = 0; i < _answers.length; i++) {
      require(answers[_answers[i]].active);
      answers[_answers[i]].votes = answers[_answers[i]].votes + 1;
      answers[_answers[i]].voteTokens = answers[_answers[i]].voteTokens + _voteTokens[i];
      answers[_answers[i]].votePower = answers[_answers[i]].votePower + sqrt(_voteTokens[i]);
      //add event
    }
    return true;
  }

  function recordUnsignedVote(
    bytes32[] memory _answers,
    uint256[] memory _voteTokens,
    address _booth,
    uint256 _nonce
  ) public authorized returns (bool) {
    // this method assumes all checks have been done by an admin
    for (uint i = 0; i < _answers.length; i++) {
      answers[_answers[i]].votes = answers[_answers[i]].votes + 1;
      answers[_answers[i]].voteTokens = answers[_answers[i]].voteTokens + _voteTokens[i];
      answers[_answers[i]].votePower = answers[_answers[i]].votePower + sqrt(_voteTokens[i]);
      CulturestakeI(admin).burnNonce(_booth, _nonce);
      //add event
    }
    return true;
  }
}