import {
  erc20Abi,
  tokenManagerAbi,
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
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import { appEnv } from '../lib/env';
import { fourMemeClient } from './fourmeme-client';
import { nft8004Service } from './nft8004-service';
import { normalizeHex } from '../lib/hex';

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
    feeInfo?: { launchFee: bigint; tradingFeeRate: bigint },
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
    const { launchFee, tradingFeeRate } = feeInfo ?? (await this.readLaunchFees());
    const creationFeeWei = this.computeCreationFee(
      launchFee,
      selectedRaisedToken.symbol,
      String(createBody.preSale ?? '0'),
      tradingFeeRate,
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

    const feeInfo = await this.readLaunchFees();
    const preparation = await this.prepareLaunchWithAccessToken(accessToken, form, image, feeInfo);
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
      feeInfo.tradingFeeRate,
    );

    const txHash = await walletClient.writeContract({
      address: TOKEN_MANAGER2_ADDRESS,
      abi: tokenManagerAbi,
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
    feeRate: bigint,
  ) {
    if (raisedToken.symbol === 'BNB') return;
    if (!preSaleValue || Number(preSaleValue) <= 0) return;
    if (!raisedToken.symbolAddress) {
      throw new Error(`缺少 ${raisedToken.symbol} 合约地址，无法执行授权`);
    }

    const tokenAddress = raisedToken.symbolAddress as `0x${string}`;
    const [decimals, allowance] = await Promise.all([
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

  private computeCreationFee(
    launchFee: bigint,
    raisedSymbol: string,
    preSaleValue: string,
    tradingFeeRate: bigint,
  ): string {
    if (raisedSymbol !== 'BNB' || parseTokenAmount(preSaleValue, 18) <= 0n) {
      return launchFee.toString();
    }

    return computeLaunchCreationFee(launchFee, raisedSymbol, preSaleValue, tradingFeeRate).toString();
  }

  private async readLaunchFees() {
    const [launchFee, tradingFeeRate] = await Promise.all([
      this.publicClient.readContract({
        address: TOKEN_MANAGER2_ADDRESS,
        abi: tokenManagerAbi,
        functionName: '_launchFee',
      }),
      this.publicClient.readContract({
        address: TOKEN_MANAGER2_ADDRESS,
        abi: tokenManagerAbi,
        functionName: '_tradingFeeRate',
      }),
    ]);

    return { launchFee, tradingFeeRate };
  }
}

export const tokenLaunchService = new TokenLaunchService();
