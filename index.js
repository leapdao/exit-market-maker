import Web3 from 'web3';
import ethUtil from 'ethereumjs-util';
import HDWalletProvider from 'truffle-hdwallet-provider';
import ExitManager from './src/index';
import ExitHandler from './src/exitHandlerContract';

let provider;
let web3;

exports.handler = function handler(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = true;
  const path = event.context['resource-path'];
  const method = event.context['http-method'];
  const providerUrl = process.env.PROVIDER_URL;
  const handlerPriv = process.env.HANDLER_PRIV;
  const priv = Buffer.from(handlerPriv.replace('0x', ''), 'hex');
  const handlerAddr = `0x${ethUtil.privateToAddress(priv).toString('hex')}`;
  console.log(handlerAddr);
  const exitAddr = process.env.EXIT_ADDR;
  const rate = parseInt(process.env.RATE, 10);

  if (!provider) {
    provider = new HDWalletProvider(handlerPriv, providerUrl);
  }
  if (!web3) {
    web3 = new Web3(provider);
  }
  const exitHandler = new ExitHandler(web3, handlerAddr, exitAddr);
  const exitManager = new ExitManager(rate, exitHandler);
  const requestHandler = () => {
    if (path.indexOf('sellExit') > -1) {
      return exitManager.sellExit(
        event.inputProof,
        event.transferProof,
        event.outputIndex,
        event.inputIndex,
        event.signedData,
      );
    } else if (path.indexOf('test') > -1) {
      if (method === 'GET') {
        return Promise.resolve(`called path: ${path}`);
      }
    }

    return Promise.reject(`Not Found: unexpected path: ${path}`);
  };

  try {
    requestHandler().then((data) => {
      callback(null, data);
    }).catch((err) => {
      callback(err);
    });
  } catch (err) {
    callback(err);
  }
};
