/**
 * Copyright (c) 2019-present, LeapDAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import { DynamoDb } from 'leap-lambda-boilerplate';
import AWSDynamoDb from 'aws-sdk/clients/dynamodb';

export default class Db extends DynamoDb {

  constructor(tableName) {
    super(new AWSDynamoDb.DocumentClient());
    this.tableName = tableName;
  }

  addSellRequest(utxoId, value, color, account, data) {
    console.log(utxoId, color, data);
    const params = {
      TableName: this.tableName,
      Item: {
        utxoId,
        color,
        account,
        value,
        effectiveBlock: data.effectiveBlock,
        finalized: 0,
        data: {
          inputTx: data.inputTx,
          tx: data.tx,
          signedData: data.signedData,
        },
      },
    };
    return this.add(params);
  }

  setAsFinalized(utxoId) {
    const params = {
      TableName: this.tableName,
      Key: { utxoId },
      UpdateExpression: 'set finalized = :f',
      ExpressionAttributeValues: {
        ':f': 1,
      },
    };
    return this.update(params);
  }

  findProvableExits(color, latestBlock) {
    const params = {
      TableName: this.tableName,
      IndexName: 'block-index',
      KeyConditionExpression: 'color = :color and effectiveBlock < :block',
      FilterExpression: 'finalized = :f',
      ExpressionAttributeValues: {
        ':color': color,
        ':block': latestBlock,
        ':f': 0,
      },
    };
    return this.query(params);
  }

}
