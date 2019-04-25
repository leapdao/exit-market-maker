import { ethers } from 'ethers';
import { erc20Abi } from 'leap-guardian/abis';

const EMPTY_ADDR = '0x0000000000000000000000000000000000000000';

module.exports = async (color, exitHandler, rootProvider) => {
  const tokenAddr = await exitHandler.getTokenAddr(color);

  if (color > 32768 || !tokenAddr || tokenAddr === EMPTY_ADDR || tokenAddr === '0x') {
    throw new Error(`bad color ${color}.`);
  }

  return new ethers.Contract(tokenAddr, erc20Abi, rootProvider);
};
