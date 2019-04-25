# Fast Exit Market Maker

## Endpoints

### /sellExit

Registers a new fast sell exit.

First, you have to transfer your UTXO to exitHander address on plasma. Then you you call `/sellExit` to notify market maker.

Usage: [Exit.fastSellUtxo and Exit.fastSellAmount helpers](https://github.com/leapdao/leap-core/blob/master/lib/exit.js#L81)

Example payload:
```
{
    "tx": {
        "value": "0xf43fc2c04ee0000",
        "color": 0,
        "hash": "0x76e9032dda4fc2ba6e850754770652783555de7add8b535ae7777a7a7c590f2a",
        "from": "0xaf0939af286a35dbfab7ded7c777a5f6e8be26a8",
        "raw": "0x0311b9a0ff624f789a75bbaf72a524b9e49e0ad86f90ecbdce7022c5e3d70273aa6f00fc6abf47a13842d50525030824b1089c57c94e8847cac1d3e4be0deaedf7f69b6e07b7b8a4f1a67111c26c06fff814ef57d8aa82402b20cbac8e6742e6e98ce51b0000000000000000000000000000000000000000000000000f43fc2c04ee000000002c2a3b359edbcfe3c3ac0cd9f9f1349a96c02530",
        "blockHash": "0x0934854f4fd9fed3ea93ccf64e40ef6251fa3b6a90f4aca10f3e8661bb59ecd8",
        "blockNumber": 15275,
        "transactionIndex": 0,
        "to": "0x2c2a3b359edbcfe3c3ac0cd9f9f1349a96c02530",
        "gas": "0x0",
        "gasPrice": "0x0",
        "nonce": 0,
        "input": "0x"
    },
    "effectiveBlock": 15295,
    "inputTx": {
        "value": "1100000000000000000",
        "color": 0,
        "hash": "0xb9a0ff624f789a75bbaf72a524b9e49e0ad86f90ecbdce7022c5e3d70273aa6f",
        "from": "0xaf0939af286A35DBfab7DEd7c777A5F6E8BE26A8",
        "raw": "0x03124deb9da953e92bea4021a11fdfbb0ca461765eef83f53739927b6625890f095b013193352ecf53c9d2fcda1318ff5662e1447dc7ae8e939502929e0575a30890a04df251c7e4668d710918b866b809be1dbe0c6d205d9283a6a8393d5e59a8952d1c0000000000000000000000000000000000000000000000000f43fc2c04ee00000000af0939af286a35dbfab7ded7c777a5f6e8be26a8000000000000000000000000000000000000000000000030c73c1f9ad0f640000000af0939af286a35dbfab7ded7c777a5f6e8be26a8",
        "blockHash": "0x0ea374b424a98d92e5fb0cee4da72e5545afaecb22700bdbb74b30e15cf29779",
        "blockNumber": 15274,
        "transactionIndex": 0,
        "to": "0xaf0939af286A35DBfab7DEd7c777A5F6E8BE26A8",
        "gas": 0,
        "gasPrice": "0",
        "nonce": 0,
        "input": "0x"
    },
    "signedData": [
        "0x000000000000000000000000000000000055de7add8b535ae7777a7a7c590f2a",
        "0x0000000000000000000000000000000000000000000000000f43fc2c04ee0000",
        "0x2244868e84c68666224794b55946e971fd6866aa0651c2677907a594258cd08d",
        "0x3a6f670eeb3fa225465a0bf522f0e9e88402597355c6e1421f0df975ca20c3ee",
        "0x000000000000000000000000000000000000000000000000000000000000001b"
    ]
}
```

### GET /exits/{account}/{color}

Returns pending exits for given account for a given color. Pending = registered with market maker, but not yet finalized (waiting for a next period to be mined).

### GET /deals

Returns configuration for the market maker: supported markets, balances and MM adress.

Example response:

```
{
    "address": "0x83B3525e17F9eAA92dAE3f9924cc333c94C7E98a",
    "deals": [
        {
            "color": 0,
            "tokenAddr": "0xD2D0F8a6ADfF16C2098101087f9548465EC96C98",
            "balance": "18352119999999999872",
            "rate": 980
        }
    ]
}
```

### POST - /directSell

Request market maker to payout tokens skipping ExitHandler contract. For that you have to supply a txHash of plasma transaction spending from your account ot market maker account. The value of that transaction will be payed out to you on a root network.

Returns: txHash of payout transaction.

Usage example: [burner](https://github.com/leapdao/burner-wallet/pull/65/files#diff-b00b060794e8d5797bffd335bd17e2a1R252)

## Testnet endpoints

```
  POST - https://2nuxsb25he.execute-api.eu-west-1.amazonaws.com/testnet/sellExit
  GET - https://2nuxsb25he.execute-api.eu-west-1.amazonaws.com/testnet/exits/{account}/{color}
  GET - https://2nuxsb25he.execute-api.eu-west-1.amazonaws.com/testnet/deals
  POST - https://2nuxsb25he.execute-api.eu-west-1.amazonaws.com/testnet/directSell
```

## Mainnet endpoints

```
  POST - https://k238oyefqc.execute-api.eu-west-1.amazonaws.com/mainnet/sellExit
  GET - https://k238oyefqc.execute-api.eu-west-1.amazonaws.com/mainnet/exits/{account}/{color}
  GET - https://k238oyefqc.execute-api.eu-west-1.amazonaws.com/mainnet/deals
  POST - https://k238oyefqc.execute-api.eu-west-1.amazonaws.com/mainnet/directSell
```

## Development

Run offline (AWS profile required):

```
yarn start
```

## Deploy

Testnet:
```
yarn deploy:testnet
```

Mainnet:
```
yarn deploy:mainnet
```

## Operations

### Initial setup

Fund market maker address (derived from PRIV_KEY) with Ether and tokens you want to create markets for. Note, that market maker will submit exits to FastExitHandler and thus needs enough ether not only for tx fees, but for exit stake as well.

### Adding new markets / changing market settings

Change MARKET_CONFIG env var (see package.json for examples)

### Troubleshooting

*Logs*
mainnet exit finalizer: `sls logs -f finalizer -s mainnet` (fastExits)
mainnet exit manager: `sls logs -f manager -s mainnet` (registering fastExits, processing directSell of sunDai)

*Receipts*
Hashes for outbound transactions are stored in DynamoDb as well (see `txHash` attribute). For `directSell` (sunDai) it will be a hash of payout tx, for `fastSell` it will be a hash of `startBoughtExit` tx.
