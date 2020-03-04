pragma solidity ^0.5.0;

import './Admin.sol';

contract Question {
  Admin admin;
  uint8 questionType;
  string question;
  bool active;
  uint256 maxVoteTokens;
  uint256 votes;
  mapping (string => Answer) answers;
  mapping (address => bool) hasVoted;

  struct Answer {
    bool active;
    uint256 votePower;
    uint256 voteTokens;
    uint256 votes;
  }

  modifier authorized() {
      require(address(Admin) == msg.sender, "Method can only be called by owner");
      _;
  }

  modifier onlyRelayer() {
    // should check relayer whitelist in admin contract
    require(address(Admin) == msg.sender, "Method can only be called by owner");
    _;
  }

  constructor(
    uint8 questionType,
    string memory question,
    uint256 maxVoteTokens
    ) public {
    admin = new Admin(msg.sender);
    active = true;
  }

  function deactivateQuestion() public authorized {
    active = false;
  }

  function initAnswer(string memory _answer) public authorized {
    answers[_answer].active = true;
  }

  function deactivateAnswer(string memory _answer) public authorized {
    answers[_answer].active = false;
  }

  function sqrt(uint256 num) internal view returns (uint256) {
    //should be the sqrt
    return num;
  }

  function recordVote(
    address sender,
    string[] memory _answers,
    uint256[] memory _voteTokens
    ) public onlyRelayer returns (bool) {
    require(!hasVoted[sender]);
    require(_answers.length == _voteTokens.length);
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