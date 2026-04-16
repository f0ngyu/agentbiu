import {
  buildAgentURI,
  type BrowserIdentityPreparation,
  type IdentityCheckResult,
  type RegisterIdentityRequest,
  type RegisterIdentityResult,
} from '@agentbiu/shared';
import { createPublicClient, createWalletClient, decodeEventLog, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import { appEnv } from '../lib/env';

const balanceAbi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
]);

const registerAbi = parseAbi([
  'function register(string agentURI) returns (uint256 agentId)',
  'event Registered(uint256 indexed agentId, string agentURI, address indexed owner)',
]);

export class Nft8004Service {
  private publicClient = createPublicClient({
    chain: bsc,
    transport: http(appEnv.bscRpcUrl),
  });

  async check(address: string): Promise<IdentityCheckResult> {
    const balance = await this.publicClient.readContract({
      address: appEnv.eip8004Address as `0x${string}`,
      abi: balanceAbi,
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
    const walletClient = createWalletClient({
      account,
      chain: bsc,
      transport: http(appEnv.bscRpcUrl),
    });

    const agentURI = buildAgentURI({
      name: input.agentName,
      imageUrl: input.imageUrl,
      description: input.description,
    });

    const txHash = await walletClient.writeContract({
      address: appEnv.eip8004Address as `0x${string}`,
      abi: registerAbi,
      functionName: 'register',
      args: [agentURI],
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    let agentId: number | null = null;

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== appEnv.eip8004Address.toLowerCase()) continue;
      try {
        const decoded = decodeEventLog({
          abi: registerAbi,
          data: log.data,
          topics: log.topics,
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
