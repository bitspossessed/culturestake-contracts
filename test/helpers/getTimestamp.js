const getTimestamp = async (tx, web3) => {
  const { blockNumber } = tx.receipt;
  const block = await web3.eth.getBlock(blockNumber);
  return block.timestamp;
};

module.exports = { getTimestamp };
