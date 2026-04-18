import { parseAbi } from 'viem';

export const erc20Abi = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
]);

export const tokenManagerAbi = parseAbi([
  'function createToken(bytes args, bytes signature) payable',
  'function _launchFee() view returns (uint256)',
  'function _tradingFeeRate() view returns (uint256)',
  'event TokenCreate(address creator, address token, uint256 requestId, string name, string symbol, uint256 totalSupply, uint256 launchTime, uint256 launchFee)',
]);

export const nft8004Abi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function register(string agentURI) returns (uint256 agentId)',
  'event Registered(uint256 indexed agentId, string agentURI, address indexed owner)',
]);
