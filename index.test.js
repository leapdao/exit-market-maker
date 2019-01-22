import chai, { expect, assert } from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import { it, describe, afterEach } from 'mocha';
import BigNumber from 'bignumber.js';
import { Tx, Input, Output, Outpoint, Block, Period, Exit } from 'leap-core';
import ExitManager from './src/index';
import Erc20 from './src/erc20Contract';
import ExitHandlerContract from './src/exitHandlerContract';


chai.use(sinonChai);
const alice = '0x83B3525e17F9eAA92dAE3f9924cc333c94C7E98a';
const alicePriv = '0xbd54b17c48ac1fc91d5ef2ef02e9911337f8758e93c801b619e5d178094486cc';
const exitHandler = '0x791186143a8fe5f0287f0DC35df3A71354f607b6';

const contract = {
  startBoughtExit: {
    sendTransaction() {},
  },
  balanceOf: { call() {} },
  allowance: { call() {} },
  getTokenAddr: { call() {} },
};

const web3 = { eth: {
  contract() {},
  at() {},
} };

sinon.stub(web3.eth, 'contract').returns(web3.eth);
sinon.stub(web3.eth, 'at').returns(contract);

describe('Exit Manager', () => {
  it('should throw if rate to low', async () => {
    // prepare state
    const deposit = Tx.deposit(0, 100, alice);
    let transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(50, exitHandler), new Output(50, alice)],
    );
    transfer = transfer.sign([alicePriv]);
    const block = new Block(33);
    block.addTx(deposit).addTx(transfer);
    const prevPeriodRoot = '0x32C220482C68413FBF8290E3B1E49B0A85901CFCD62AB0738761568A2A6E8A57';
    const period = new Period(prevPeriodRoot, [block]);
    const transferProof = period.proof(transfer);

    // sign exit receipt
    const sellPrice = 49;
    const utxoId = (new Outpoint(transfer.hash(), 0)).getUtxoId();
    const signedData = Exit.signOverExit(utxoId, sellPrice, alicePriv);
    const signedDataBytes32 = Exit.bufferToBytes32Array(signedData);

    const manager = new ExitManager(1, null);
    try {
      await manager.sellExit([], transferProof, 0, 0, signedDataBytes32);
    } catch (err) {
      expect(err.message).to.contain('too low for utxo size');
    }
  });


  it('should throw if ERC 721', async () => {
    // prepare state
    const deposit = Tx.deposit(0, 100, alice, 35000);
    let transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(50, exitHandler, 35000), new Output(50, alice, 35000)],
    );
    transfer = transfer.sign([alicePriv]);
    const block = new Block(33);
    block.addTx(deposit).addTx(transfer);
    const prevPeriodRoot = '0x32C220482C68413FBF8290E3B1E49B0A85901CFCD62AB0738761568A2A6E8A57';
    const period = new Period(prevPeriodRoot, [block]);
    const transferProof = period.proof(transfer);

    // sign exit receipt
    const sellPrice = 49;
    const utxoId = (new Outpoint(transfer.hash(), 0)).getUtxoId();
    const signedData = Exit.signOverExit(utxoId, sellPrice, alicePriv);
    const signedDataBytes32 = Exit.bufferToBytes32Array(signedData);

    // mock blockchain
    sinon.stub(contract.getTokenAddr, 'call').yields(null, alice);

    const exitHandlerContract = new ExitHandlerContract(web3, alice, exitHandler);
    const rate = 0.9;
    // rate, exitContract, erc20Contract, senderAddr, exitHandlerAddr
    const manager = new ExitManager(rate, exitHandlerContract, null, alice, exitHandler);
    try {
      await manager.sellExit([], transferProof, 0, 0, signedDataBytes32);
    } catch (err) {
      expect(err.message).to.contain('bad color');
    }
  });

  it('should throw if balance too low', async () => {
    // prepare state
    const deposit = Tx.deposit(0, 100, alice);
    let transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(50, exitHandler), new Output(50, alice)],
    );
    transfer = transfer.sign([alicePriv]);
    const block = new Block(33);
    block.addTx(deposit).addTx(transfer);
    const prevPeriodRoot = '0x32C220482C68413FBF8290E3B1E49B0A85901CFCD62AB0738761568A2A6E8A57';
    const period = new Period(prevPeriodRoot, [block]);
    const transferProof = period.proof(transfer);

    // sign exit receipt
    const sellPrice = 49;
    const utxoId = (new Outpoint(transfer.hash(), 0)).getUtxoId();
    const signedData = Exit.signOverExit(utxoId, sellPrice, alicePriv);
    const signedDataBytes32 = Exit.bufferToBytes32Array(signedData);

    // mock blockchain
    sinon.stub(contract.balanceOf, 'call').yields(null, new BigNumber(30));
    sinon.stub(contract.allowance, 'call').yields(null, new BigNumber(100));
    sinon.stub(contract.getTokenAddr, 'call').yields(null, alice);

    const rate = 0.9;
    const exitHandlerContract = new ExitHandlerContract(web3, alice, exitHandler);
    const erc20 = new Erc20(web3);
    // rate, exitContract, erc20Contract, senderAddr, exitHandlerAddr
    const manager = new ExitManager(rate, exitHandlerContract, erc20, alice, exitHandler);
    try {
      await manager.sellExit([], transferProof, 0, 0, signedDataBytes32);
    } catch (err) {
      expect(err.message).to.contain('insufficient to handle exit size');
    }
  });

  it('should throw if allowance too low', async () => {
    // prepare state
    const deposit = Tx.deposit(0, 100, alice);
    let transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(50, exitHandler), new Output(50, alice)],
    );
    transfer = transfer.sign([alicePriv]);
    const block = new Block(33);
    block.addTx(deposit).addTx(transfer);
    const prevPeriodRoot = '0x32C220482C68413FBF8290E3B1E49B0A85901CFCD62AB0738761568A2A6E8A57';
    const period = new Period(prevPeriodRoot, [block]);
    const transferProof = period.proof(transfer);

    // sign exit receipt
    const sellPrice = 49;
    const utxoId = (new Outpoint(transfer.hash(), 0)).getUtxoId();
    const signedData = Exit.signOverExit(utxoId, sellPrice, alicePriv);
    const signedDataBytes32 = Exit.bufferToBytes32Array(signedData);

    // mock blockchain
    sinon.stub(contract.balanceOf, 'call').yields(null, new BigNumber(100));
    sinon.stub(contract.allowance, 'call').yields(null, new BigNumber(30));
    sinon.stub(contract.getTokenAddr, 'call').yields(null, alice);

    const rate = 0.9;
    const exitHandlerContract = new ExitHandlerContract(web3, alice, exitHandler);
    const erc20 = new Erc20(web3);
    // rate, exitContract, erc20Contract, senderAddr, exitHandlerAddr
    const manager = new ExitManager(rate, exitHandlerContract, erc20, alice, exitHandler);
    try {
      await manager.sellExit([], transferProof, 0, 0, signedDataBytes32);
    } catch (err) {
      expect(err.message).to.contain('allowance');
    }
  });

  it('should allow to sell', async () => {
    // prepare state
    const deposit = Tx.deposit(0, 100, alice);
    let transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(50, exitHandler), new Output(50, alice)],
    );
    transfer = transfer.sign([alicePriv]);
    const block = new Block(33);
    block.addTx(deposit).addTx(transfer);
    const prevPeriodRoot = '0x32C220482C68413FBF8290E3B1E49B0A85901CFCD62AB0738761568A2A6E8A57';
    const period = new Period(prevPeriodRoot, [block]);
    const transferProof = period.proof(transfer);
    const depositProof = period.proof(deposit);
    const outputIndex = 0;
    const inputIndex = 0;

    // sign exit receipt
    const sellPrice = 49;
    const utxoId = (new Outpoint(transfer.hash(), 0)).getUtxoId();
    const signedData = Exit.signOverExit(utxoId, sellPrice, alicePriv);
    const signedDataBytes32 = Exit.bufferToBytes32Array(signedData);

    // mock blockchain
    sinon.stub(contract.balanceOf, 'call').yields(null, new BigNumber(100));
    sinon.stub(contract.allowance, 'call').yields(null, new BigNumber(100));
    sinon.stub(contract.getTokenAddr, 'call').yields(null, alice);
    sinon.stub(contract.startBoughtExit, 'sendTransaction').yields(null, '0x112233');


    const exitHandlerContract = new ExitHandlerContract(web3, alice, exitHandler);
    const erc20 = new Erc20(web3);
    const rate = 0.9;
    // rate, exitContract, erc20Contract, senderAddr, exitHandlerAddr
    const manager = new ExitManager(rate, exitHandlerContract, erc20, alice, exitHandler);
    const rsp = await manager.sellExit(depositProof, transferProof, inputIndex, outputIndex, signedDataBytes32);
    assert.equal(rsp, JSON.stringify({ txHash: '0x112233' }));
  });

  afterEach(() => {
    if (contract.balanceOf.call.restore) contract.balanceOf.call.restore();
    if (contract.allowance.call.restore) contract.allowance.call.restore();
    if (contract.getTokenAddr.call.restore) contract.getTokenAddr.call.restore();
    if (contract.startBoughtExit.sendTransaction.restore) contract.startBoughtExit.sendTransaction.restore();
  });
});
