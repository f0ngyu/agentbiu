import {
  nft8004Abi,
  buildAgentURI,
  type BrowserIdentityPreparation,
  type IdentityCheckResult,
  type RegisterIdentityRequest,
  type RegisterIdentityResult,
} from '@agentbiu/shared';
import { createPublicClient, createWalletClient, decodeEventLog, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import { appEnv } from '../lib/env';

type Nft8004ReceiptLog = {
  address: string;
  data: `0x${string}`;
  topics: readonly `0x${string}`[];
};

type Nft8004PublicClient = {
  readContract(args: {
    address: `0x${string}`;
    abi: typeof nft8004Abi;
    functionName: 'balanceOf';
    args: [`0x${string}`];
  }): Promise<bigint>;
  waitForTransactionReceipt(args: { hash: `0x${string}` }): Promise<{
    logs: Nft8004ReceiptLog[];
  }>;
};

type Nft8004WalletClient = {
  writeContract(args: {
    address: `0x${string}`;
    abi: typeof nft8004Abi;
    functionName: 'register';
    args: [string];
  }): Promise<`0x${string}`>;
};

type Nft8004ServiceDeps = {
  publicClient?: Nft8004PublicClient;
  walletClientFactory?: (account: ReturnType<typeof privateKeyToAccount>) => Nft8004WalletClient;
};

export class Nft8004Service {
  private readonly publicClient: Nft8004PublicClient;
  private readonly walletClientFactory: (account: ReturnType<typeof privateKeyToAccount>) => Nft8004WalletClient;

  constructor(deps: Nft8004ServiceDeps = {}) {
    this.publicClient =
      deps.publicClient ??
      (createPublicClient({
        chain: bsc,
        transport: http(appEnv.bscRpcUrl),
      }) as unknown as Nft8004PublicClient);
    this.walletClientFactory =
      deps.walletClientFactory ??
      ((account) =>
        createWalletClient({
          account,
          chain: bsc,
          transport: http(appEnv.bscRpcUrl),
        }) as unknown as Nft8004WalletClient);
  }

  async check(address: string): Promise<IdentityCheckResult> {
    const balance = await this.publicClient.readContract({
      address: appEnv.eip8004Address as `0x${string}`,
      abi: nft8004Abi,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    return {
      address,
      balance: Number(balance),
      hasIdentity: Number(balance) > 0,
      nftAddress: appEnv.eip8004Address,
    };
  }

  prepareBrowserRegistration(input: RegisterIdentityRequest): BrowserIdentityPreparation {
    return {
      agentURI: buildAgentURI({
        name: input.agentName,
        imageUrl: input.imageUrl,
        description: input.description,
      }),
      contractAddress: appEnv.eip8004Address,
    };
  }

  async registerWithPrivateKey(
    privateKey: `0x${string}`,
    input: RegisterIdentityRequest,
  ): Promise<RegisterIdentityResult> {
    const account = privateKeyToAccount(privateKey);
    const walletClient = this.walletClientFactory(account);

    const agentURI = buildAgentURI({
      name: input.agentName,
      imageUrl: input.imageUrl,
      description: input.description,
    });

    const txHash = await walletClient.writeContract({
      address: appEnv.eip8004Address as `0x${string}`,
      abi: nft8004Abi,
      functionName: 'register',
      args: [agentURI],
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    let agentId: number | null = null;

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== appEnv.eip8004Address.toLowerCase()) continue;
      try {
        const decoded = decodeEventLog({
          abi: nft8004Abi,
          data: log.data,
          topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
        });
        if (decoded.eventName === 'Registered') {
          agentId = Number((decoded.args as { agentId: bigint }).agentId);
          break;
        }
      } catch {
        continue;
      }
    }

    return {
      txHash,
      agentId,
      agentURI,
    };
  }

  async ensureIdentity(
    address: string,
    privateKey: `0x${string}`,
    input: RegisterIdentityRequest,
  ): Promise<IdentityCheckResult> {
    const status = await this.check(address);
    console.info(`[identity] current 8004 balance for ${address}: ${status.balance}`);
    if (status.hasIdentity) {
      console.info('[identity] existing 8004 detected, skip registration');
      return status;
    }

    console.info('[identity] no 8004 found, registering now');
    await this.registerWithPrivateKey(privateKey, input);
    console.info('[identity] registration submitted, rechecking balance');
    return this.check(address);
  }
}

export const nft8004Service = new Nft8004Service();
