import chai, { expect, assert } from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import { it, describe, afterEach } from 'mocha';
import { Tx, Input, Output, Outpoint, Block, Period, Exit } from 'leap-core';
import ExitManager from './src/index';
import ExitHandler from './src/exitHandlerContract';


chai.use(sinonChai);
const alice = '0x83B3525e17F9eAA92dAE3f9924cc333c94C7E98a';
const alicePriv = '0xbd54b17c48ac1fc91d5ef2ef02e9911337f8758e93c801b619e5d178094486cc';
const exitHandler = '0x791186143a8fe5f0287f0DC35df3A71354f607b6';

const contract = {
  startBoughtExit: {
    sendTransaction() {},
    estimateGas() {},
  },
};

const web3 = { eth: {
  contract() {},
  at() {},
} };

sinon.stub(web3.eth, 'contract').returns(web3.eth);
sinon.stub(web3.eth, 'at').returns(contract);

describe('Exit Manager', () => {
  it('should allow to sell', async () => {
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

    const sellPrice = 49;
    const utxoId = (new Outpoint(transfer.hash(), 0)).getUtxoId();

    const signedData = Exit.signOverExit(utxoId, sellPrice, alicePriv);
    const signedDataBytes32 = Exit.bufferToBytes32Array(signedData);

    sinon.stub(contract.startBoughtExit, 'estimateGas').yields(null, 1000);
    sinon.stub(contract.startBoughtExit, 'sendTransaction').yields(null, '0x112233');

    const manager = new ExitManager(0.9, new ExitHandler(web3, alice, exitHandler));
    console.log(depositProof, transferProof, inputIndex, outputIndex, signedDataBytes32);
    const rsp = await manager.sellExit(depositProof, transferProof, inputIndex, outputIndex, signedDataBytes32);
    assert.equal(rsp, JSON.stringify({ txHash: '0x112233' }));
  });

  it('should throw if rate to low', async () => {
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


    const sellPrice = 49;
    const utxoId = (new Outpoint(transfer.hash(), 0)).getUtxoId();

    const signedData = Exit.signOverExit(utxoId, sellPrice, alicePriv);
    const signedDataBytes32 = Exit.bufferToBytes32Array(signedData);

    const manager = new ExitManager(1, null);
    try {
      await manager.sellExit([], transferProof, 0, 0, signedDataBytes32);
    } catch (err) {
      expect(err.message).to.contain('Price too low.');
    }
  });

  afterEach(() => {
    if (contract.startBoughtExit.estimateGas.restore) contract.startBoughtExit.estimateGas.restore();
    if (contract.startBoughtExit.sendTransaction.restore) contract.startBoughtExit.sendTransaction.restore();
  });
});
