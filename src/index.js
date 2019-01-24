import { Exit } from 'leap-core';
import { BadRequest, ServerError } from './errors';

const EMPTY_ADDR = '0x0000000000000000000000000000000000000000';

function getBalAndAllowance(erc20, tokenAddr, owner, exitHandlerAddr) {
  const balProm = erc20.balanceOf(tokenAddr, owner);
  const allowProm = erc20.allowance(tokenAddr, owner, exitHandlerAddr);
  return Promise.all([balProm, allowProm]);
}

class ExitManager {
  constructor(rate, exitContract, erc20Contract, senderAddr, exitHandlerAddr) {
    this.rate = rate;
    this.exitHandler = exitContract;
    this.erc20 = erc20Contract;
    this.senderAddr = senderAddr;
    this.exitHandlerAddr = exitHandlerAddr;
  }

  async sellExit(inputProof,
    transferProof,
    outputIndex,
    inputIndex,
    signedData) {
    const tx = Exit.txFromProof(transferProof);

    // check value
    const sellValue = parseInt(signedData[1], 16);      // TODO: use bigNumber
    const utxoValue = tx.outputs[outputIndex].value;
    if (sellValue < this.rate * utxoValue) {        // TODO: use bigNumber
      throw new BadRequest(`Price ${sellValue} too low for utxo size ${utxoValue}.`);
    }

    // check color
    const color = tx.outputs[outputIndex].color;
    const tokenAddr = await this.exitHandler.getTokenAddr(color);
    if (color > 32768 || !tokenAddr || tokenAddr === EMPTY_ADDR || tokenAddr === '0x') {
      throw new BadRequest(`bad color ${color}.`);
    }

    // check availability
    const [balance, allowance] = await getBalAndAllowance(this.erc20, tokenAddr, this.senderAddr, this.exitHandlerAddr);
    if (balance.toNumber() < sellValue) {
      throw new ServerError(`balance of ${balance.toNumber()} insufficient to handle exit size ${sellValue}.`);
    }
    if (allowance.toNumber() < sellValue) {
      throw new ServerError(`allowance of ${allowance.toNumber()} insufficient.`);
    }

    // do tx
    const txHash = await this.exitHandler.startBoughtExit(
      inputProof,
      transferProof,
      outputIndex,
      inputIndex,
      signedData,
    );
    return JSON.stringify({ txHash });
  }

}

export default ExitManager;