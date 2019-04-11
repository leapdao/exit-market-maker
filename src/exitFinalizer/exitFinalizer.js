/**
 * Copyright (c) 2019-present, LeapDAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { Exit, helpers } from 'leap-core';
import { lessThan, divide, multiply, bi } from 'jsbi-utils';
import { Errors } from 'leap-lambda-boilerplate';
import { erc20Abi } from 'leap-guardian/abis';
import { ethers } from 'ethers';

const { getProof } = helpers;

const { BadRequest, ServerError } = Errors;

const EMPTY_ADDR = '0x0000000000000000000000000000000000000000';

class ExitFinalizer {

  constructor(rate, senderAddr, exitHandler, operator, root, plasma, db) {
    this.rate = rate;
    this.senderAddr = senderAddr;
    this.exitHandler = exitHandler;
    this.operator = operator;
    this.db = db;
    this.root = root;
    this.plasma = plasma;
  }

  async sellExits() {
    const latestBlock = await this.plasma.getBlockNumber();
    const latestPeriod = Math.floor(latestBlock / 32);
    console.log(`Latest block: ${latestBlock}. Latest period: ${latestPeriod}`);

    const exits = await this.db.findProvableExits(latestBlock);
    console.log('Sold exits to process:', exits.length);

    let done = 0;
    // TODO: do not wait for tx's to mine
    await Promise.all(exits.map(exit =>
      this.sellExit(exit.Attributes).then((txHash) => {
        console.log('Processed sold exit:', exit.Name, txHash);
        done += 1;
        return this.db.setAsFinalized(exit.Name);
      }),
    ));

    return {
      statusCode: 200,
      body: {
        exits: exits.length,
        done,
      },
    };
  }

  async sellExit(exit) {
    console.log('Finalizing fast exit', exit);
    const slotId = 0; // TODO: any slot
    const { signer } = await this.operator.slots(slotId);

    const inputTx = JSON.parse(exit.inputTx);
    const exitingTx = JSON.parse(exit.tx);
    const signedData = JSON.parse(exit.signedData);

    // workaround for https://github.com/leapdao/leap-node/issues/236
    // TODO: remove and use this.plasma once the issue is fixed and deployed
    const blockProvider = {
      getBlock: (num, includeTxs) =>
        this.plasma.send('eth_getBlockByNumber', [num, includeTxs]),
    };
    const txProof = await getProof(blockProvider, exitingTx, 0, signer);
    const inputProof = await getProof(blockProvider, inputTx, 0, signer);

    const outputIndex = 0;
    const inputIndex = 0;

    const tx = Exit.txFromProof(txProof);

    // check value
    const sellValue = bi(signedData[1]);
    const utxoValue = tx.outputs[outputIndex].value;
    if (lessThan(sellValue, divide(multiply(bi(this.rate), bi(utxoValue)), bi(1000)))) {
      throw new BadRequest(`Price ${sellValue} too low for utxo size ${utxoValue}.`);
    }

    // check color
    const color = tx.outputs[outputIndex].color;
    const tokenAddr = await this.exitHandler.getTokenAddr(color);
    const exitStake = await this.exitHandler.exitStake();

    if (color > 32768 || !tokenAddr || tokenAddr === EMPTY_ADDR || tokenAddr === '0x') {
      throw new BadRequest(`bad color ${color}.`);
    }

    const token = new ethers.Contract(tokenAddr, erc20Abi, this.root);

    const balance = await token.balanceOf(this.senderAddr);
    const allowance = await token.allowance(this.senderAddr, this.exitHandler.address);

    if (lessThan(bi(balance.toString()), sellValue)) {
      throw new ServerError(`balance of ${balance.toNumber()} insufficient to handle exit size ${sellValue}.`);
    }
    if (lessThan(bi(allowance.toString()), sellValue)) {
      console.log('Insufficient allowance. Approving 2^256 for ExitHandler..');
      await token.approve(this.exitHandler.address, bi(2 ** 256).toString());
    }

    // do tx
    return this.exitHandler.startBoughtExit(
      inputProof,
      txProof,
      outputIndex,
      inputIndex,
      signedData,
      { value: exitStake, gasLimit: 350000 },
    );
  }

}

export default ExitFinalizer;
