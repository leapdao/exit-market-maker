import Contract from './contract';

const EXIT_HANDLER_ABI = [
  {
    constant: false,
    inputs: [
      {
        name: '_youngestInputProof',
        type: 'bytes32[]',
      },
      {
        name: '_proof',
        type: 'bytes32[]',
      },
      {
        name: '_outputIndex',
        type: 'uint8',
      },
      {
        name: '_inputIndex',
        type: 'uint8',
      },
      {
        name: 'signedData',
        type: 'bytes32[]',
      },
    ],
    name: 'startBoughtExit',
    outputs: [],
    payable: true,
    stateMutability: 'payable',
    type: 'function',
  },
];

export default class ExitHandlerContract extends Contract {
  constructor(web3, senderAddr, exitHandlerAddr) {
    super(web3, senderAddr);
    this.exitHandlerAddr = exitHandlerAddr;
    this.contract = this.web3.eth.contract(EXIT_HANDLER_ABI).at(exitHandlerAddr);
  }

  startBoughtExit(inputProof, transferProof, outputIndex, inputIndex, signedData) {
    return this.sendTransaction(
      this.contract.startBoughtExit,
      3000000,
      inputProof,
      transferProof,
      outputIndex,
      inputIndex,
      signedData,
    );
  }
}
