/**
 * Copyright (c) 2019-present, LeapDAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { Tx } from 'leap-core';
import { bufferToHex } from 'ethereumjs-util';

class ExitManager {

  constructor(db) {
    this.db = db;
  }

  async registerExit({ body }) {
    const inputTx = Tx.fromRaw(body.inputTx.raw);
    const color = inputTx.outputs[0].color;
    const value = inputTx.outputs[0].value.toString();
    const account = inputTx.inputs[0].signer;

    const tx = Tx.fromRaw(body.tx.raw);
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
}

export default ExitManager;
