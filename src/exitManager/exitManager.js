/**
 * Copyright (c) 2019-present, LeapDAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { Tx } from 'leap-core';
import { bufferToHex } from 'ethereumjs-util';

import getToken from '../common/getToken';

class ExitManager {

  constructor(db, marketConfig, exitHandler, rootWallet) {
    this.db = db;
    this.marketConfig = marketConfig;
    this.exitHandler = exitHandler;
    this.rootWallet = rootWallet;
  }

  async registerExit({ body }) {
    const inputTx = Tx.fromRaw(body.inputTx.raw);
    const color = inputTx.outputs[0].color;
    const value = body.tx.value.toString();

    const tx = Tx.fromRaw(body.tx.raw);
    const account = tx.inputs[0].signer;
    const prevOut = tx.inputs[0].prevout;
    const utxoId = `${bufferToHex(prevOut.hash)}:${prevOut.index}`;
    await this.db.addSellRequest(utxoId, value, color, account, body);
    return {
      statusCode: 200,
    };
  }

  async getAccountExits({ path }) {
    return this.db.getAccountExits(path.account, parseInt(path.color || 0, 10));
  }

  async getDeals() {
    return Promise.all(this.marketConfig.map(async (market) => {
      const token = await getToken(market.color, this.exitHandler, this.rootWallet.provider);
      const balance = await token.balanceOf(this.rootWallet.address);
      return {
        color: market.color,
        tokenAddr: token.address,
        balance: balance.toString(),
        rate: market.rate,
      };
    }));
  }
}

export default ExitManager;
