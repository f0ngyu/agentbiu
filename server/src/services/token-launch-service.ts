import {
  BSC_CHAIN_ID,
  BSC_CHAIN_NAME,
  type LaunchFormInput,
  type LaunchPreparation,
  type LaunchResult,
  type RaisedTokenConfig,
  type TokenReceiptLog,
  type VerificationInfo,
  TOKEN_MANAGER2_ADDRESS,
  computeCreationFeeWei,
  computeRequiredAllowance,
  extractTokenAddressFromLogs,
  parseTokenAmount,
} from '@agentbiu/shared';
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import { appEnv } from '../lib/env';
import { fourMemeClient } from './fourmeme-client';
import { nft8004Service } from './nft8004-service';

const readAbi = parseAbi([
  'function _launchFee() view returns (uint256)',
  'function _tradingFeeRate() view returns (uint256)',
]);

const erc20Abi = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
]);

const writeAbi = parseAbi([
  'function createToken(bytes args, bytes signature) payable',
]);

function normalizeHex(value: string): `0x${string}` {
  if (value.startsWith('0x')) return value as `0x${string}`;
  if (/^[0-9a-fA-F]+$/.test(value)) return `0x${value}` as `0x${string}`;
  return `0x${Buffer.from(value, 'base64').toString('hex')}` as `0x${string}`;
}

export function extractLaunchedTokenAddress(logs: TokenReceiptLog[]) {
  return extractTokenAddressFromLogs(logs);
}

export function computeLaunchRequiredAllowance(
  preSaleValue: string | number,
  decimals: number,
  feeRate: bigint,
) {
  const preSaleUnits = parseTokenAmount(preSaleValue, decimals);
  if (preSaleUnits <= 0n) return 0n;
  return computeRequiredAllowance(preSaleUnits, feeRate);
}

export function computeLaunchCreationFee(
  launchFee: bigint,
  raisedSymbol: string,
  preSaleValue: string,
  tradingFeeRate: bigint,
) {
  return computeCreationFeeWei(launchFee, raisedSymbol, preSaleValue, tradingFeeRate);
}

export class TokenLaunchService {
  private publicClient = createPublicClient({
    chain: bsc,
    transport: http(appEnv.bscRpcUrl),
  });

  async getVerificationInfo(hasPrivateKey: boolean): Promise<VerificationInfo> {
    const raisedTokens = await fourMemeClient.fetchPublicConfig();
    return {
      networkName: BSC_CHAIN_NAME,
      chainId: BSC_CHAIN_ID,
      chainSupported: true,
      rpcUrl: appEnv.bscRpcUrl,
      hasPrivateKey,
      raisedTokens,
    };
  }

  async loginWithPrivateKey(privateKey: `0x${string}`) {
    const account = privateKeyToAccount(privateKey);
    const nonceInfo = await fourMemeClient.generateNonce(account.address);
    const signature = await account.signMessage({ message: nonceInfo.message });
    const login = await fourMemeClient.loginWithSignature({
      address: account.address,
      signature,
    });

    return {
      account,
      accessToken: login.accessToken,
    };
  }

  async prepareLaunchWithAccessToken(
    accessToken: string,
    form: LaunchFormInput,
    image: File,
  ): Promise<LaunchPreparation> {
    console.info('[launch] reading raised token config');
    const raisedTokens = await fourMemeClient.fetchPublicConfig();
    const selectedRaisedToken = fourMemeClient.pickRaisedToken(raisedTokens, form.raisedTokenSymbol);
    console.info(`[launch] selected raised token: ${selectedRaisedToken.symbol}`);
    console.info('[launch] uploading token image');
    const imageUrl = await fourMemeClient.uploadImage(image, accessToken);
    console.info('[launch] creating four.meme createArg/signature');
    const createBody = fourMemeClient.buildCreateBody(form, imageUrl, selectedRaisedToken);
    const response = await fourMemeClient.createToken(accessToken, createBody);
    const creationFeeWei = await this.computeCreationFee(
      selectedRaisedToken.symbol,
      String(createBody.preSale ?? '0'),
    );

    return {
      createArg: normalizeHex(response.createArg),
      signature: normalizeHex(response.signature),
      creationFeeWei,
      accessToken,
      uploadImageUrl: imageUrl,
      selectedRaisedToken,
    };
  }

  async launchWithPrivateKey(
    privateKey: `0x${string}`,
    form: LaunchFormInput,
    image: File,
  ): Promise<LaunchResult> {
    console.info('[launch] starting private-key launch flow');
    const { account, accessToken } = await this.loginWithPrivateKey(privateKey);
    console.info(`[launch] logged in as ${account.address}`);
    console.info('[launch] checking or registering 8004 identity');
    await nft8004Service.ensureIdentity(account.address, privateKey, {
      agentName: form.agentName,
      imageUrl: form.agentImageUrl,
      description: form.agentDescription,
    });

    const preparation = await this.prepareLaunchWithAccessToken(accessToken, form, image);
    const walletClient = createWalletClient({
      account,
      chain: bsc,
      transport: http(appEnv.bscRpcUrl),
    });
    await this.ensureRaisedTokenApproval(
      walletClient,
      account.address,
      preparation.selectedRaisedToken,
      form.preSale,
    );

    const txHash = await walletClient.writeContract({
      address: TOKEN_MANAGER2_ADDRESS,
      abi: writeAbi,
      functionName: 'createToken',
      args: [preparation.createArg, preparation.signature],
      value: BigInt(preparation.creationFeeWei),
    });
    console.info(`[launch] createToken tx submitted: ${txHash}`);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    console.info(`[launch] receipt status: ${receipt.status}`);
    const tokenAddress = extractLaunchedTokenAddress(receipt.logs as TokenReceiptLog[]);
    console.info(`[launch] token address parsed: ${tokenAddress ?? 'null'}`);

    return {
      ...preparation,
      txHash,
      walletAddress: account.address,
      tokenAddress,
    };
  }

  private async ensureRaisedTokenApproval(
    walletClient: ReturnType<typeof createWalletClient>,
    owner: `0x${string}`,
    raisedToken: RaisedTokenConfig,
    preSaleValue: string,
  ) {
    if (raisedToken.symbol === 'BNB') return;
    if (!preSaleValue || Number(preSaleValue) <= 0) return;
    if (!raisedToken.symbolAddress) {
      throw new Error(`缺少 ${raisedToken.symbol} 合约地址，无法执行授权`);
    }

    const tokenAddress = raisedToken.symbolAddress as `0x${string}`;
    const [decimals, allowance, feeRate] = await Promise.all([
      this.publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      }),
      this.publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [owner, TOKEN_MANAGER2_ADDRESS],
      }),
      this.publicClient.readContract({
        address: TOKEN_MANAGER2_ADDRESS,
        abi: readAbi,
        functionName: '_tradingFeeRate',
      }),
    ]);

    const requiredAllowance = computeLaunchRequiredAllowance(preSaleValue, Number(decimals), feeRate);
    if (requiredAllowance <= 0n) return;
    if (allowance >= requiredAllowance) {
      console.info(`[launch] ${raisedToken.symbol} allowance already sufficient`);
      return;
    }

    console.info(`[launch] approving ${raisedToken.symbol} for createToken flow`);
    const approveHash = await walletClient.writeContract({
      chain: bsc,
      account: owner,
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [TOKEN_MANAGER2_ADDRESS, requiredAllowance],
    });
    await this.publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.info(`[launch] ${raisedToken.symbol} approve tx confirmed: ${approveHash}`);
  }

  private async computeCreationFee(raisedSymbol: string, preSaleValue: string): Promise<string> {
    const launchFee = await this.publicClient.readContract({
      address: TOKEN_MANAGER2_ADDRESS,
      abi: readAbi,
      functionName: '_launchFee',
    });

    if (raisedSymbol !== 'BNB' || parseTokenAmount(preSaleValue, 18) <= 0n) {
      return launchFee.toString();
    }

    const tradingFeeRate = await this.publicClient.readContract({
      address: TOKEN_MANAGER2_ADDRESS,
      abi: readAbi,
      functionName: '_tradingFeeRate',
    });

    return computeLaunchCreationFee(launchFee, raisedSymbol, preSaleValue, tradingFeeRate).toString();
  }
}

export const tokenLaunchService = new TokenLaunchService();
