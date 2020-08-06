pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import './interfaces/CulturestakeI.sol';

contract Question {
  using SafeMath for uint256;

  address public admin;
  bytes32 public id;
  bytes32 public festival;
  uint256 public maxVoteTokens;
  uint256 public votes;
  bool public configured;
  mapping (bytes32 => Answer) answers;
  mapping (address => bool) public hasVoted;

  struct Answer {
    bool inited;
    bool deactivated;
    bytes32 answer;
    uint256 votePower;
    uint256 voteTokens;
    uint256 votes;
  }

  event InitAnswer(bytes32 questionId, bytes32 indexed answer);
  event DeactivateAnswer(bytes32 questionId, bytes32 indexed answer);
  event Vote(
    bytes32 questionId,
    bytes32 indexed answer,
    uint256 voteTokens,
    uint256 votePower,
    uint256 votes,
    address booth,
    uint256 nonce
  );

  modifier authorized() {
      require(CulturestakeI(admin).isOwner(msg.sender), "Must be an admin" );
      _;
  }

  function setup(
    address _admin,
    bytes32 _question,
    uint256 _maxVoteTokens,
    bytes32 _festival
  ) public {
    require(!configured);
    admin = _admin;
    id = _question;
    maxVoteTokens = _maxVoteTokens;
    festival = _festival;
    configured = true;
  }

  function initAnswer(bytes32 _answer) public authorized {
    answers[_answer].inited = true;
    answers[_answer].answer = _answer;
    emit InitAnswer(id, _answer);
  }

  function deactivateAnswer(bytes32 _answer) public authorized {
    answers[_answer].deactivated = true;
     emit DeactivateAnswer(id, _answer);
  }

  function getAnswer(bytes32 _answer) public returns (bool, bool, uint256, uint256, uint256) {
    return (
      answers[_answer].inited,
      answers[_answer].deactivated,
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
    require(CulturestakeI(admin).isActiveFestival(_festival));
    require(CulturestakeI(admin).checkBoothSignatureAndBurnNonce(_festival, _answers, _nonce, sigV, sigR, sigS));
    //require no duplicates in _answers array
    //require not more than _maxVoteTokens
    hasVoted[msg.sender] = true;
    for (uint i = 0; i < _answers.length; i++) {
      require(answers[_answers[i]].inited);
      answers[_answers[i]].votes = answers[_answers[i]].votes.add(1);
      answers[_answers[i]].voteTokens = answers[_answers[i]].voteTokens.add(_voteTokens[i]);
      answers[_answers[i]].votePower = answers[_answers[i]].votePower.add(sqrt(_voteTokens[i]));
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
      answers[_answers[i]].votes = answers[_answers[i]].votes.add(1);
      answers[_answers[i]].voteTokens = answers[_answers[i]].voteTokens.add(_voteTokens[i]);
      uint256 votePower = sqrt(_voteTokens[i]);
      answers[_answers[i]].votePower = answers[_answers[i]].votePower.add(votePower);
      CulturestakeI(admin).burnNonce(_booth, _nonce);
      emit Vote(id, _answers[i], _voteTokens[i], votePower, answers[_answers[i]].votes, _booth, _nonce);
    }
    return true;
  }
}