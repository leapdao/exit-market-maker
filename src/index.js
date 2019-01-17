import { Exit } from 'leap-core';
import { BadRequest } from './errors';

class ExitManager {
  constructor(rate, exitContract) {
    this.rate = rate;
    this.exitHandler = exitContract;
  }

  async sellExit(inputProof,
    transferProof,
    outputIndex,
    inputIndex,
    signedData) {
    const tx = Exit.txFromProof(transferProof);
    const sellValue = parseInt(signedData[1], 16);      // TODO: use bigNumber
    const utxoValue = tx.outputs[outputIndex].value;
    if (sellValue < this.rate * utxoValue) {        // TODO: use bigNumber
      throw new BadRequest('Price too low.');
    }
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
