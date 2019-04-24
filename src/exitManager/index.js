/**
 * Copyright (c) 2019-present, LeapDAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { ethers } from 'ethers';
import { Router, Properties } from 'leap-lambda-boilerplate';
import wallet from 'leap-guardian/scripts/utils/wallet';
import { exitHandlerAbi } from 'leap-guardian/abis';

import ExitManager from './exitManager';
import Db from '../db';

let exitManager;

exports.handler = async (event) => {
  const path = event.context['resource-path'];
  const method = event.context['http-method'];

  const tableName = process.env.TABLE_NAME;
  const nodeUrl = process.env.NODE_URL;
  const privKey = await Properties.readEncrypted(`/exit-market/${process.env.ENV}/PRIV_KEY`);

  const marketConfig = JSON.parse(process.env.MARKET_CONFIG);

  if (!exitManager) {
    const { rootWallet, plasmaWallet, nodeConfig } = await wallet({ nodeUrl, privKey });
    const { exitHandlerAddr } = nodeConfig;
    const exitHandler = new ethers.Contract(exitHandlerAddr, exitHandlerAbi, rootWallet);

    exitManager = new ExitManager(
      new Db(tableName),
      marketConfig,
      exitHandler,
      rootWallet,
      plasmaWallet,
    );
  }

  const router = new Router([
    ['POST', '/sellExit', exitManager.registerExit.bind(exitManager)],
    ['GET', '/exits/:account', exitManager.getAccountExits.bind(exitManager)],
    ['GET', '/deals', exitManager.getDeals.bind(exitManager)],
    ['POST', '/directSell', exitManager.directSell.bind(exitManager)],
  ]);

  return router.dispatch(method, path, {
    body: event.body,
    querystring: event.params.querystring,
    headers: event.params.header,
    path: event.params.path,
  });
};
