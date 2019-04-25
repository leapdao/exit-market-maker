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
        utxoId: utxoId.toLowerCase(),
        color,
        account: account.toLowerCase(),
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

  setAsFinalized(utxoId, txHash) {
    const params = {
      TableName: this.tableName,
      Key: { utxoId: utxoId.toLowerCase() },
      UpdateExpression: 'set finalized = :f, txHash = :hash',
      ExpressionAttributeValues: {
        ':f': 1,
        ':hash': txHash,
      },
    };
    return this.update(params);
  }

  getAccountExits(account, color) {
    const params = {
      TableName: this.tableName,
      IndexName: 'account-index',
      KeyConditionExpression: 'account = :account and finalized = :f',
      FilterExpression: 'color = :color',
      ExpressionAttributeValues: {
        ':account': account.toLowerCase(),
        ':f': 0,
        ':color': color,
      },
    };
    return this.query(params);
  }

  getProvableExits(color, latestBlock) {
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

  addDirectSellRequest(txHash, value, color, account, payoutTxHash) {
    const params = {
      TableName: this.tableName,
      Item: {
        utxoId: txHash.toLowerCase(),
        color,
        account: account.toLowerCase(),
        value,
        finalized: 1,
        txHash: payoutTxHash,
      },
    };
    console.log(params);
    return this.add(params);
  }

  getDirectSellRequest(txHash) {
    const params = {
      TableName: this.tableName,
      Key: {
        utxoId: txHash.toLowerCase(),
      },
    };
    return this.get(params);
  }

}
