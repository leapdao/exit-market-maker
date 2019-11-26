/**
 * Copyright (c) 2019-present, LeapDAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */

import { Exit, helpers } from 'leap-core';
import { lessThan, divide, multiply, bi } from 'jsbi-utils';
import { Errors } from 'leap-lambda-boilerplate';
import getToken from '../common/getToken';

const { getProof } = helpers;

const { BadRequest, ServerError } = Errors;

class ExitFinalizer {
  constructor(rate, senderAddr, exitHandler, operator, root, plasma, db, marketConfig) {
    this.rate = rate;
    this.senderAddr = senderAddr;
    this.exitHandler = exitHandler;
    this.operator = operator;
    this.db = db;
    this.root = root;
    this.plasma = plasma;
    this.marketConfig = marketConfig;
  }

  async sellExits() {
    const latestBlock = await this.plasma.getBlockNumber();
    const latestPeriod = Math.floor(latestBlock / 32);
    console.log(`Latest block: ${latestBlock}. Latest period: ${latestPeriod}`);

    const result = {};

    await Promise.all(this.marketConfig.map(async (market) => {
      const exits = (
        await this.db.getProvableExits(market.color, latestBlock)
      ).sort(a => (!a.txHash ? -1 : 1)); // new first
      console.log('Sold exits to process:', exits.length);

      result[market.color] = { total: exits.length, done: 0 };

      for (let i = 0; i < exits.length; i += 1) {
        const exit = exits[i];
        await this.sellExit(exit).then((rsp) => { // eslint-disable-line no-await-in-loop
          console.log('Processed sold exit:', exit.utxoId, rsp);
          result[market.color].done += 1;
          return this.db.setAsFinalized(exit.utxoId, rsp.hash);
        }).catch(e => console.error(e));
      }
    }));

    return {
      statusCode: 200,
      body: result,
    };
  }

  async sellExit(exit) {
    console.log('Finalizing fast exit', exit);

    const { inputTx, signedData } = exit.data;
    const exitingTx = exit.data.tx;

    const slotId = 0;
    const { signer } = await this.operator.slots(slotId);
    const fallbackPeriodData = { slotId, validatorAddress: signer };

    const txProof = await getProof(this.plasma, exitingTx, fallbackPeriodData);
    const inputProof = await getProof(this.plasma, inputTx, fallbackPeriodData);

    const outputIndex = 0;
    const inputIndex = 0;

    const tx = Exit.txFromProof(txProof);

    // check value
    const sellValue = bi(signedData[1]);
    const utxoValue = tx.outputs[outputIndex].value;
    if (lessThan(sellValue, divide(multiply(bi(this.rate), bi(utxoValue)), bi(1000)))) {
      throw new BadRequest(`Price ${sellValue} too low for utxo size ${utxoValue}.`);
    }

    const exitStake = await this.exitHandler.exitStake();
    // check color
    const color = tx.outputs[outputIndex].color;
    const token = await getToken(color, this.exitHandler, this.root);

    const balance = await token.balanceOf(this.senderAddr);
    const allowance = await token.allowance(this.senderAddr, this.exitHandler.address);

    if (lessThan(bi(balance.toString()), sellValue)) {
      throw new ServerError(
        `balance of ${balance.toString()} insufficient to handle exit size ${sellValue.toString()}.`
      );
    }
    if (lessThan(bi(allowance.toString()), sellValue)) {
      console.log('Insufficient allowance. Approving 2^255 for ExitHandler..');
      await token.approve(this.exitHandler.address, bi(2 ** 255).toString());
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
