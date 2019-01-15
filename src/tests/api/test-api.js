const leap = require('leap-core');
const axios = require('axios');

const url = "https://zrz6i33bmc.execute-api.eu-west-1.amazonaws.com/Prod/exit";
const alice = "0x83B3525e17F9eAA92dAE3f9924cc333c94C7E98a";
const alicePriv = "0xbd54b17c48ac1fc91d5ef2ef02e9911337f8758e93c801b619e5d178094486cc";
const exitHandler = "0x791186143a8fe5f0287f0DC35df3A71354f607b6";

async function test() {

  const deposit = leap.Tx.deposit(0, 100, alice);
  let transfer = leap.Tx.transfer(
    [new leap.Input(new leap.Outpoint(deposit.hash(), 0))],
    [new leap.Output(50, exitHandler), new leap.Output(50, alice)]
  );
  transfer = transfer.sign([alicePriv]);

  const block = new leap.Block(33);
  block.addTx(deposit).addTx(transfer);

  const prevPeriodRoot = "0x32C220482C68413FBF8290E3B1E49B0A85901CFCD62AB0738761568A2A6E8A57";
  const period = new leap.Period(prevPeriodRoot, [block]);

  const transferProof = period.proof(transfer);
  const depositProof = period.proof(deposit);

  const outputIndex = 0;
  const inputIndex = 0;

  const sellPrice = 49;
  const utxoId = (new leap.Outpoint(transfer.hash(), 0)).getUtxoId();

  const signedData = leap.Exit.signOverExit(utxoId, sellPrice, alicePriv);
  const signedDataBytes32 = leap.Exit.bufferToBytes32Array(signedData);

  try {
    let response = await axios.post(url, {
      inputProof: depositProof,
      transferProof: transferProof,
      inputIndex: inputIndex,
      outputIndex: outputIndex,
      signedData: signedDataBytes32
    });
    console.log(response.data);    
  } catch(e) {
    console.log(e.response.data);
  }

};
test();