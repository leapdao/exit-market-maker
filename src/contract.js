export default class Contract {

  constructor(web3, senderAddr) {
    this.web3 = web3;
    this.senderAddr = senderAddr;
  }

  sendTransaction(
    contractMethod,
    maxGas,
    ...args
  ) {
    return new Promise((resolve, reject) => {
      contractMethod.estimateGas(...args, (gasErr, gas) => {
        if (gasErr) {
          reject(`Estimate error: ${JSON.stringify(gasErr)}`);
        } else if (gas > maxGas) {
          reject(`Too many gas required for tx (${gas})`);
        } else {
          contractMethod.sendTransaction(
            ...args,
            { from: this.senderAddr, gas: Math.round(gas * 1.2) },
            (txErr, txHash) => {
              if (txErr) {
                return reject(`Tx error: ${txErr}`);
              }
              return resolve(txHash);
            },
          );
        }
      });
    });
  }

  call(contractMethod, ...args) { // eslint-disable-line class-methods-use-this
    const callee = contractMethod.call === Function.prototype.call ? contractMethod
                                                                   : contractMethod.call;
    return new Promise((resolve, reject) => {
      callee(...args, (err, val) => {
        if (err) {
          return reject(err);
        }
        return resolve(val);
      });
    });
  }

}
