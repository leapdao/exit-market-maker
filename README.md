# Fast Exit Market Maker

## Testnet

endpoints:
```
  POST - https://2nuxsb25he.execute-api.eu-west-1.amazonaws.com/testnet/sellExit
  GET - https://2nuxsb25he.execute-api.eu-west-1.amazonaws.com/testnet/exits/{account}/{color}
  GET - https://2nuxsb25he.execute-api.eu-west-1.amazonaws.com/testnet/deals
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