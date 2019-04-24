/**
 * Copyright (c) 2019-present, LeapDAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { Tx } from 'leap-core';
import { bufferToHex } from 'ethereumjs-util';
import { bi, lessThan } from 'jsbi-utils';

import getToken from '../common/getToken';

class ExitManager {

  constructor(db, marketConfig, exitHandler, rootWallet, plasmaWallet) {
    this.db = db;
    this.marketConfig = marketConfig;
    this.exitHandler = exitHandler;
    this.rootWallet = rootWallet;
    this.plasmaWallet = plasmaWallet;
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
    const deals = await Promise.all(this.marketConfig.map(async (market) => {
      const token = await getToken(market.color, this.exitHandler, this.rootWallet.provider);
      const balance = await token.balanceOf(this.rootWallet.address);
      return {
        color: market.color,
        tokenAddr: token.address,
        balance: balance.toString(),
        rate: market.rate,
      };
    }));

    return {
      address: this.rootWallet.address,
      deals,
    };
  }

  async directSell({ body }) {
    const { txHash } = body;
    console.log('Direct sell request:', txHash);

    const sellRequest = await this.db.getDirectSellRequest(txHash);
    if (sellRequest) {
      throw new Error('Wrong tx: already payed out');
    }

    const { raw } = await this.plasmaWallet.provider.getTransaction(txHash);
    const tx = Tx.fromRaw(raw);
    console.log(tx);

    const ourOutput = tx.outputs.find(out => 
      out.address.toLowerCase() === this.rootWallet.address.toLowerCase()
    );
    if (!ourOutput) {
      throw new Error('Wrong tx: not sending to market maker');
    }

    const { color, value } = ourOutput;

    const market = this.marketConfig.find(m => m.color === color);
    if (!market) {
      throw new Error('No market for color', color);
    }

    const token = await getToken(color, this.exitHandler, this.rootWallet);
    const balance = await token.balanceOf(this.rootWallet.address);
    if (lessThan(bi(balance), value)) {
      throw new Error('Not enough tokens on the market');
    }

    const account = tx.inputs[0].signer;

    const payoutTx = await token.transfer(account, value.toString());
    console.log('Direct sell payout:', payoutTx);
    await this.db.addDirectSellRequest(txHash, value, color, account, payoutTx.hash);
    return payoutTx.hash;
  }
}

export default ExitManager;
