/**
 * Copyright (c) 2019-present, LeapDAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { SimpleDb } from 'leap-lambda-boilerplate';

export default class Db extends SimpleDb {

  addSellRequest(key, request) {
    const attrs = {
      inputTx: JSON.stringify(request.inputTx),
      effectiveBlock: String(request.effectiveBlock).padStart(14, '0'),
      signedData: JSON.stringify(request.signedData),
      tx: JSON.stringify(request.tx),
    };
    return this.setAttrs(key, attrs);
  }

  setAsFinalized(key) {
    return this.setAttr(key, 'finalized', 'true');
  }

  findProvableExits(latestBlock) {
    return this.select(`
SELECT * FROM \`${this.tableName}\` 
WHERE effectiveBlock < '${String(latestBlock).padStart(14, '0')}'
      intersection finalized is null
    `);
  }

}
