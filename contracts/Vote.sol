pragma solidity ^0.5.0;

contract Vote {
  address voter;

  function recordVote(address sender) public returns (bool) {
    voter = sender;
    return true;
  }
}