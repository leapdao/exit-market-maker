/**
 * Copyright (c) 2019-present, LeapDAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { Router } from 'leap-lambda-boilerplate';

import ExitManager from './exitManager';
import Db from '../db';

exports.handler = async (event) => {
  const path = event.context['resource-path'];
  const method = event.context['http-method'];

  const tableName = process.env.TABLE_NAME;

  const exitManager = new ExitManager(new Db(tableName));

  const router = new Router([
    ['POST', '/sellExit', exitManager.registerExit.bind(exitManager)],
  ]);

  return router.dispatch(method, path, {
    body: event.body,
    querystring: event.params.querystring,
    headers: event.params.header,
  });
};
