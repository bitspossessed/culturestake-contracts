pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import './Admin.sol';
import './Question.sol';
import "./Proxy.sol";

contract Culturestake is Admin {
  using SafeMath for uint256;

  mapping (bytes32 => Festival) festivals;
  mapping (bytes32 => QuestionStruct) questions;
  mapping (address => VotingBooth) votingBooths;
  mapping (address => bool) public questionsByAddress;
  address public questionMasterCopy;

  struct VotingBooth {
    bool inited;
    bool deactivated;
    bytes32 festival;
    mapping (uint256 => bool) nonces;
  }

  struct Festival {
    bool inited;
    bool deactivated;
    uint256 startTime;
    uint256 endTime;
  }

  struct QuestionStruct {
    bool inited;
    bool deactivated;
    address contractAddress;
    bytes32 festival;
    uint256 maxVoteTokens;
  }

  event InitQuestion(bytes32 indexed question, bytes32 indexed festival, address indexed questionAddress);
  event InitFestival(bytes32 indexed festival, uint256 startTime, uint256 endTime);
  event InitVotingBooth(bytes32 indexed festival, address indexed boothAddress);

  event DeactivateQuestion(bytes32 indexed question);
  event DeactivateFestival(bytes32 indexed festival);
  event DeactivateVotingBooth(address indexed boothAddress);

  event ProxyCreation(Proxy proxy);

  modifier onlyQuestions() {
      require(questionsByAddress[msg.sender], "Method can only be called by questions");
      _;
  }

  constructor(address[] memory _owners, address _questionMasterCopy) public Admin(_owners) {
    questionMasterCopy = _questionMasterCopy;
  }

  function setQuestionMasterCopy(address _newQuestionMasterCopy) public authorized {
    questionMasterCopy = _newQuestionMasterCopy;
  }

  function isActiveFestival(bytes32 _festival) public view returns (bool) {
    // case festival has not been inited
    if (!festivals[_festival].inited) return false;
    // case festival has been manually deactivated
    if (festivals[_festival].deactivated) return false;
    // case festival hasn't started
    if (festivals[_festival].startTime > block.timestamp) return false;
    // case festival has ended
    if (festivals[_festival].endTime < block.timestamp) return false;
    return true;
  }

  function checkBoothSignature(
    bytes32 _festival,
    bytes32[] memory _answers,
    uint256 _nonce,
    uint8 sigV,
    bytes32 sigR,
    bytes32 sigS
  ) public view returns (address) {
      bytes32 h = getHash(_answers, _nonce);
      address addressFromSig = ecrecover(h, sigV, sigR, sigS);
      // case is not a booth
      if (!votingBooths[addressFromSig].inited) return address(0);
      // case was manually deactivated
      if (votingBooths[addressFromSig].deactivated) return address(0);
      // case is from the wrong festival
      if (!(votingBooths[addressFromSig].festival == _festival)) return address(0);
      // case nonce has been used
      if (!isValidVotingNonce(addressFromSig, _nonce)) return address(0);
      return addressFromSig;
  }

  function getHash(
    bytes32[] memory _answers,
    uint256 _nonce
  ) public view returns (bytes32) {
    return keccak256(abi.encode(_answers, _nonce));
  }

  function checkBoothSignatureAndBurnNonce(
    bytes32 _festival,
    bytes32[] memory _answers,
    uint256 _nonce,
    uint8 sigV,
    bytes32 sigR,
    bytes32 sigS
  ) public returns (bool) {
    address addressFromSig = checkBoothSignature(_festival, _answers, _nonce, sigV, sigR, sigS);
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
      require(festivals[_festival].inited);
      require(!votingBooths[_booth].inited);
      votingBooths[_booth].inited = true;
      votingBooths[_booth].festival = _festival;
      emit InitVotingBooth(_festival, _booth);
  }

  function deactivateVotingBooth(address _booth) public authorized {
    votingBooths[_booth].deactivated = true;
    emit DeactivateVotingBooth(_booth);
  }

  function getVotingBooth(address _booth) public view returns (bool, bool, bytes32) {
    return (votingBooths[_booth].inited, votingBooths[_booth].deactivated, votingBooths[_booth].festival);
  }

  function isValidVotingNonce(address _booth, uint256 _nonce) public view returns (bool) {
    return (!votingBooths[_booth].nonces[_nonce]);
  }

  function initFestival(
    bytes32 _festival,
    uint256 _startTime,
    uint256 _endTime
  ) public authorized {
    require(!festivals[_festival].inited);
    festivals[_festival].inited = true;
    festivals[_festival].startTime = _startTime;
    festivals[_festival].endTime = _endTime;
    emit InitFestival(_festival, _startTime, _endTime);
  }

  function deactivateFestival(bytes32 _festival) public authorized {
    festivals[_festival].deactivated = true;
    emit DeactivateFestival(_festival);
  }

  function getFestival(bytes32 _festival) public view returns (bool, bool, uint256, uint256) {
    return (
      festivals[_festival].inited,
      festivals[_festival].deactivated,
      festivals[_festival].startTime,
      festivals[_festival].endTime
    );
  }

  function deactivateQuestion(bytes32 _question) public authorized {
    questions[_question].deactivated = true;
    questionsByAddress[questions[_question].contractAddress] = false;
    emit DeactivateQuestion(_question);
  }

  // function initQuestion(
  //   bytes32 _question,
  //   uint256 _maxVoteTokens,
  //   bytes32 _festival
  // ) public authorized {
  //   require(festivals[_festival].inited);
  //   require(!questions[_question].inited);

  //   Question questionContract = new Question(_question, _maxVoteTokens, _festival);
  //   questionsByAddress[address(questionContract)] = true;

  //   questions[_question].inited = true;
  //   questions[_question].festival = _festival;
  //   questions[_question].contractAddress = address(questionContract);
  //   questions[_question].maxVoteTokens = _maxVoteTokens;

  //   emit InitQuestion(_question, _festival, address(questionContract));
  // }

  function initQuestion(
    bytes32 _question,
    uint256 _maxVoteTokens,
    bytes32 _festival
  ) public authorized {
    require(festivals[_festival].inited);
    require(!questions[_question].inited);

    bytes memory data = abi.encodeWithSelector(
      0x2fa97de7, address(this), _question, _maxVoteTokens, _festival
    );

    Proxy questionContract = createProxy(data);
    questionsByAddress[address(questionContract)] = true;

    questions[_question].inited = true;
    questions[_question].festival = _festival;
    questions[_question].contractAddress = address(questionContract);
    questions[_question].maxVoteTokens = _maxVoteTokens;

    emit InitQuestion(_question, _festival, address(questionContract));
  }

  /// @dev Allows to create new proxy contact and execute a message call to the new proxy within one transaction.
  /// @param data Payload for message call sent to new proxy contract.
  function createProxy(bytes memory data)
      internal
      returns (Proxy proxy)
  {
      proxy = new Proxy(questionMasterCopy);
      if (data.length > 0)
          // solium-disable-next-line security/no-inline-assembly
          assembly {
              if eq(call(gas, proxy, 0, add(data, 0x20), mload(data), 0, 0), 0) { revert(0, 0) }
          }
      emit ProxyCreation(proxy);
  }

  function getQuestion(bytes32 _question) public view returns (bool, bool, address, bytes32, uint256) {
    return (
      questions[_question].inited,
      questions[_question].deactivated,
      questions[_question].contractAddress,
      questions[_question].festival,
      questions[_question].maxVoteTokens
    );
  }
}