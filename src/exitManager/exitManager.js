/**
 * Copyright (c) 2019-present, LeapDAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

class ExitManager {

  constructor(db) {
    this.db = db;
  }

  async registerExit({ body }) {
    const key = `${body.unspent.outpoint.hash}:${body.unspent.outpoint.index}`;
    await this.db.addSellRequest(key, body);
    return {
      statusCode: 200,
    };
  }
}

export default ExitManager;
