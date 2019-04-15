/**
 * Copyright (c) 2019-present, LeapDAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { bufferToHex, privateToAddress, toBuffer } from 'ethereumjs-util';
import { ethers } from 'ethers';
import { Properties } from 'leap-lambda-boilerplate';

import wallet from 'leap-guardian/scripts/utils/wallet';
import { operatorAbi, exitHandlerAbi } from 'leap-guardian/abis';

import ExitFinalizer from './exitFinalizer';
import Db from '../db';

let finalizer;

exports.handler = async () => {
  const nodeUrl = process.env.NODE_URL;
  const rate = parseInt(process.env.RATE, 10);
  const tableName = process.env.TABLE_NAME;
  const privKey = await Properties.readEncrypted(`/exit-market/${process.env.ENV}/PRIV_KEY`);
  const handlerAddr = bufferToHex(privateToAddress(toBuffer(privKey)));

  if (!finalizer) {
    const { plasmaWallet, rootWallet, nodeConfig } = await wallet({ nodeUrl, privKey });
    const { exitHandlerAddr, operatorAddr } = nodeConfig;
    const exitHandler = new ethers.Contract(exitHandlerAddr, exitHandlerAbi, rootWallet);
    const operator = new ethers.Contract(operatorAddr, operatorAbi, rootWallet);

    finalizer = new ExitFinalizer(
      rate,
      handlerAddr,
      exitHandler,
      operator,
      rootWallet,
      plasmaWallet.provider,
      new Db(tableName),
    );
  }

  return finalizer.sellExits();
};
