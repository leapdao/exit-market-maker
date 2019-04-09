import Contract from '../contract';

const ERC20_ABI = [
  {
    constant: true,
    inputs: [
      {
        name: 'who',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: '',
        type: 'uint256',
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
        name: 'owner',
        type: 'address',
      },
      {
        name: 'spender',
        type: 'address',
      },
    ],
    name: 'allowance',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

export default class Erc20Contract extends Contract {

  balanceOf(erc20Addr, owner) {
    const contract = this.web3.eth.contract(ERC20_ABI).at(erc20Addr);
    return this.call(contract.balanceOf, owner);
  }

  allowance(erc20Addr, owner, spender) {
    const contract = this.web3.eth.contract(ERC20_ABI).at(erc20Addr);
    return this.call(contract.allowance, owner, spender);
  }
}
