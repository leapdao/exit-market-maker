import Contract from './contract';

const EXIT_HANDLER_ABI = [
  {
    constant: false,
    inputs: [
      {
        name: '',
        type: 'bytes32[]',
      },
      {
        name: '',
        type: 'bytes32[]',
      },
      {
        name: '',
        type: 'uint8',
      },
      {
        name: '',
        type: 'uint8',
      },
      {
        name: '',
        type: 'bytes32[]',
      },
    ],
    name: 'startBoughtExit',
    outputs: [],
    payable: true,
    stateMutability: 'payable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'erc20TokenCount',
    outputs: [
      {
        name: '',
        type: 'uint16',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_color',
        type: 'uint16',
      },
    ],
    name: 'getTokenAddr',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
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

  erc20TokenCount() {
    return this.call(this.contract.erc20TokenCount);
  }

  getTokenAddr(color) {
    return this.call(this.contract.getTokenAddr, color);
  }
}
