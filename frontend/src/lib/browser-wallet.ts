import {
  BSC_BLOCK_EXPLORER,
  BSC_CHAIN_HEX,
  BSC_CHAIN_ID,
  BSC_CHAIN_NAME,
  BSC_RPC_URL,
  EIP8004_NFT_ADDRESS,
  TOKEN_MANAGER2_ADDRESS,
} from '@agentbiu/shared';
import { createPublicClient, createWalletClient, custom, decodeEventLog, http, parseAbi, parseUnits } from 'viem';
import type { LaunchPreparation } from '@agentbiu/shared';
import { bsc } from 'viem/chains';

const registerAbi = parseAbi([
  'function register(string agentURI) returns (uint256 agentId)',
]);

const createTokenAbi = parseAbi([
  'function createToken(bytes args, bytes signature) payable',
  'event TokenCreate(address creator, address token, uint256 requestId, string name, string symbol, uint256 totalSupply, uint256 launchTime, uint256 launchFee)',
  'function _tradingFeeRate() view returns (uint256)',
]);

const erc20Abi = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
]);

function getProvider() {
  if (!window.ethereum) {
    throw new Error('未检测到浏览器钱包插件，请安装 MetaMask 或兼容钱包');
  }
  return window.ethereum;
}

function getWalletClient(address?: `0x${string}`) {
  return createWalletClient({
    account: address,
    chain: bsc,
    transport: custom(getProvider()),
  });
}

function getPublicClient() {
  return createPublicClient({
    chain: bsc,
    transport: http(BSC_RPC_URL),
  });
}

export async function switchToBsc(): Promise<void> {
  const provider = getProvider();
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BSC_CHAIN_HEX }],
    });
  } catch {
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: BSC_CHAIN_HEX,
          chainName: BSC_CHAIN_NAME,
          nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18,
          },
          rpcUrls: [BSC_RPC_URL],
          blockExplorerUrls: [BSC_BLOCK_EXPLORER],
        },
      ],
    });
  }
}

export async function connectBrowserWallet(): Promise<{
  address: `0x${string}`;
  chainId: number;
}> {
  const provider = getProvider();
  const accounts = (await provider.request({
    method: 'eth_requestAccounts',
  })) as string[];

  if (!accounts[0]) {
    throw new Error('浏览器钱包未返回账户');
  }

  const chainHex = (await provider.request({
    method: 'eth_chainId',
  })) as string;

  return {
    address: accounts[0] as `0x${string}`,
    chainId: Number.parseInt(chainHex, 16),
  };
}

export async function signLoginMessage(address: `0x${string}`, message: string) {
  const walletClient = getWalletClient(address);
  return walletClient.signMessage({
    account: address,
    message,
  });
}

export async function registerIdentityWithBrowser(agentURI: string) {
  const { address } = await connectBrowserWallet();
  const walletClient = getWalletClient(address);
  const hash = await walletClient.writeContract({
    address: EIP8004_NFT_ADDRESS,
    abi: registerAbi,
    functionName: 'register',
    args: [agentURI],
    account: address,
  });

  await getPublicClient().waitForTransactionReceipt({ hash });
  return hash;
}

export async function createTokenWithBrowser(
  input: LaunchPreparation,
  preSaleValue: string | number,
) {
  const { address } = await connectBrowserWallet();
  await ensureRaisedTokenApproval(address, input, preSaleValue);
  const walletClient = getWalletClient(address);
  const hash = await walletClient.writeContract({
    address: TOKEN_MANAGER2_ADDRESS,
    abi: createTokenAbi,
    functionName: 'createToken',
    args: [input.createArg, input.signature],
    value: BigInt(input.creationFeeWei),
    account: address,
  });

  const receipt = await getPublicClient().waitForTransactionReceipt({ hash });
  return {
    txHash: hash,
    address,
    tokenAddress: extractTokenAddress(receipt.logs),
  };
}

export function isBscChain(chainId: number | null) {
  return chainId === BSC_CHAIN_ID;
}

async function ensureRaisedTokenApproval(
  owner: `0x${string}`,
  input: LaunchPreparation,
  preSaleValue: string | number,
) {
  if (input.selectedRaisedToken.symbol === 'BNB') return;
  const normalizedPreSaleValue = normalizeDecimalInput(preSaleValue);
  if (!normalizedPreSaleValue || Number(normalizedPreSaleValue) <= 0) return;
  if (!input.selectedRaisedToken.symbolAddress) {
    throw new Error(`缺少 ${input.selectedRaisedToken.symbol} 合约地址，无法执行授权`);
  }

  const publicClient = getPublicClient();
  const tokenAddress = input.selectedRaisedToken.symbolAddress as `0x${string}`;
  const [decimals, allowance, feeRate] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals',
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [owner, TOKEN_MANAGER2_ADDRESS],
    }),
    publicClient.readContract({
      address: TOKEN_MANAGER2_ADDRESS,
      abi: createTokenAbi,
      functionName: '_tradingFeeRate',
    }),
  ]);

  const preSaleUnits = parseUnits(normalizedPreSaleValue, Number(decimals));
  if (preSaleUnits <= 0n) return;

  const requiredAllowance = preSaleUnits + (preSaleUnits * feeRate) / 10000n;
  if (allowance >= requiredAllowance) return;

  const walletClient = getWalletClient(owner);
  const approveHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [TOKEN_MANAGER2_ADDRESS, requiredAllowance],
    account: owner,
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
}

function normalizeDecimalInput(value: string | number) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    return String(value);
  }
  return value.trim();
}

function extractTokenAddress(
  logs: Array<{ address: string; data: `0x${string}`; topics: readonly `0x${string}`[] }>,
) {
  for (const log of logs) {
    if (log.address.toLowerCase() !== TOKEN_MANAGER2_ADDRESS.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: createTokenAbi,
        data: log.data,
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
      });
      if (decoded.eventName === 'TokenCreate') {
        return (decoded.args as { token: string }).token;
      }
    } catch {
      continue;
    }
  }

  return null;
}
