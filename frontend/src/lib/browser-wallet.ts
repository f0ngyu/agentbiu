import {
  BSC_BLOCK_EXPLORER,
  BSC_CHAIN_HEX,
  BSC_CHAIN_ID,
  BSC_CHAIN_NAME,
  BSC_RPC_URL,
  erc20Abi,
  EIP8004_NFT_ADDRESS,
  nft8004Abi,
  TOKEN_MANAGER2_ADDRESS,
  tokenManagerAbi,
  computeRequiredAllowance,
  extractTokenAddressFromLogs,
  parseTokenAmount,
} from '@agentbiu/shared';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import type { LaunchPreparation } from '@agentbiu/shared';
import { bsc } from 'viem/chains';

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

export async function registerIdentityWithBrowser(address: `0x${string}`, agentURI: string) {
  const walletClient = getWalletClient(address);
  const hash = await walletClient.writeContract({
    address: EIP8004_NFT_ADDRESS,
    abi: nft8004Abi,
    functionName: 'register',
    args: [agentURI],
    account: address,
  });

  await getPublicClient().waitForTransactionReceipt({ hash });
  return hash;
}

export async function createTokenWithBrowser(
  address: `0x${string}`,
  input: LaunchPreparation,
  preSaleValue: string | number,
) {
  await ensureRaisedTokenApproval(address, input, preSaleValue);
  const walletClient = getWalletClient(address);
  const hash = await walletClient.writeContract({
    address: TOKEN_MANAGER2_ADDRESS,
    abi: tokenManagerAbi,
    functionName: 'createToken',
    args: [input.createArg, input.signature],
    value: BigInt(input.creationFeeWei),
    account: address,
  });

  const receipt = await getPublicClient().waitForTransactionReceipt({ hash });
  return {
    txHash: hash,
    address,
    tokenAddress: extractTokenAddressFromLogs(receipt.logs),
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
      abi: tokenManagerAbi,
      functionName: '_tradingFeeRate',
    }),
  ]);

  const preSaleUnits = parseTokenAmount(preSaleValue, Number(decimals));
  if (preSaleUnits <= 0n) return;

  const requiredAllowance = computeRequiredAllowance(preSaleUnits, feeRate);
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
