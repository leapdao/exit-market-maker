/**
 * Copyright (c) 2019-present, LeapDAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { bufferToHex, privateToAddress, toBuffer } from 'ethereumjs-util';
import { ethers } from 'ethers';
import { Properties } from 'leap-lambda-boilerplate';

import { getRootNetworkProvider } from 'leap-guardian/scripts/utils';
import { operatorAbi, exitHandlerAbi } from 'leap-guardian/abis';

import ExitFinalizer from './exitFinalizer';
import Db from '../db';

let root;
let plasma;
let finalizer;
let exitHandler;
let operator;

exports.handler = async () => {
  const nodeUrl = process.env.NODE_URL;
  const rate = parseInt(process.env.RATE, 10);
  const tableName = process.env.TABLE_NAME;
  const privKey = await Properties.readEncrypted(`/exit-market/${process.env.ENV}/PRIV_KEY`);
  const handlerAddr = bufferToHex(privateToAddress(toBuffer(privKey)));

  if (!finalizer) {
    plasma = new ethers.providers.JsonRpcProvider(nodeUrl);

    const nodeConfig = await plasma.send('plasma_getConfig', []);
    root = new ethers.Wallet(
      privKey,
      new ethers.providers.JsonRpcProvider(getRootNetworkProvider(nodeConfig)),
    );

    const { exitHandlerAddr, operatorAddr } = nodeConfig;
    exitHandler = new ethers.Contract(exitHandlerAddr, exitHandlerAbi, root);
    operator = new ethers.Contract(operatorAddr, operatorAbi, root);

    finalizer = new ExitFinalizer(
      rate,
      handlerAddr,
      exitHandler,
      operator,
      root,
      plasma,
      new Db(tableName),
    );
  }

  return finalizer.sellExits();
};
