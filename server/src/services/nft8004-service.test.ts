import { describe, expect, mock, test } from 'bun:test';
import { encodeAbiParameters, encodeEventTopics, parseAbiItem } from 'viem';
import { appEnv } from '../lib/env';
import { Nft8004Service } from './nft8004-service';

const address = '0x1111111111111111111111111111111111111111';
const privateKey =
  '0x1111111111111111111111111111111111111111111111111111111111111111' as const;
const registeredEvent = parseAbiItem(
  'event Registered(uint256 indexed agentId, string agentURI, address indexed owner)',
);

function buildRegisteredLog(agentId: bigint, agentURI: string) {
  return {
    address: appEnv.eip8004Address,
    topics: encodeEventTopics({
      abi: [registeredEvent],
      eventName: 'Registered',
      args: {
        agentId,
        owner: address,
      },
    }) as readonly `0x${string}`[],
    data: encodeAbiParameters([{ type: 'string', name: 'agentURI' }], [agentURI]),
  };
}

describe('Nft8004Service', () => {
  test('prepareBrowserRegistration returns data URI and contract address', () => {
    const service = new Nft8004Service();
    const result = service.prepareBrowserRegistration({
      agentName: 'Agent BIU',
      imageUrl: 'https://example.com/avatar.png',
      description: 'hello',
    });

    expect(result.contractAddress).toBe(appEnv.eip8004Address);
    expect(result.agentURI.startsWith('data:application/json;base64,')).toBe(true);
  });

  test('check maps contract balance to hasIdentity', async () => {
    const readContract = mock(async () => 2n);
    const service = new Nft8004Service({
      publicClient: {
        readContract,
        async waitForTransactionReceipt() {
          return { logs: [] };
        },
      },
    });

    const result = await service.check(address);
    expect(result.balance).toBe(2);
    expect(result.hasIdentity).toBe(true);
  });

  test('registerWithPrivateKey parses Registered event', async () => {
    const walletWrite = mock(async () => '0xabc' as const);
    const service = new Nft8004Service({
      publicClient: {
        async readContract() {
          return 0n;
        },
        async waitForTransactionReceipt() {
          return {
            logs: [buildRegisteredLog(7n, 'agent-uri')],
          };
        },
      },
      walletClientFactory() {
        return {
          writeContract: walletWrite,
        };
      },
    });

    const result = await service.registerWithPrivateKey(privateKey, { agentName: 'Agent BIU' });
    expect(walletWrite).toHaveBeenCalledTimes(1);
    expect(result.txHash).toBe('0xabc');
    expect(result.agentId).toBe(7);
    expect(result.agentURI.startsWith('data:application/json;base64,')).toBe(true);
  });

  test('ensureIdentity skips registration when identity already exists', async () => {
    const readContract = mock(async () => 1n);
    const walletWrite = mock(async () => '0xabc' as const);
    const service = new Nft8004Service({
      publicClient: {
        readContract,
        async waitForTransactionReceipt() {
          return { logs: [] };
        },
      },
      walletClientFactory() {
        return {
          writeContract: walletWrite,
        };
      },
    });

    const result = await service.ensureIdentity(address, privateKey, { agentName: 'Agent BIU' });
    expect(readContract).toHaveBeenCalledTimes(1);
    expect(walletWrite).not.toHaveBeenCalled();
    expect(result.hasIdentity).toBe(true);
  });

  test('ensureIdentity registers and rechecks when identity is missing', async () => {
    let calls = 0;
    const readContract = mock(async () => {
      calls += 1;
      return calls === 1 ? 0n : 1n;
    });
    const walletWrite = mock(async () => '0xdef' as const);
    const service = new Nft8004Service({
      publicClient: {
        readContract,
        async waitForTransactionReceipt() {
          return {
            logs: [buildRegisteredLog(9n, 'agent-uri')],
          };
        },
      },
      walletClientFactory() {
        return {
          writeContract: walletWrite,
        };
      },
    });

    const result = await service.ensureIdentity(address, privateKey, { agentName: 'Agent BIU' });
    expect(readContract).toHaveBeenCalledTimes(2);
    expect(walletWrite).toHaveBeenCalledTimes(1);
    expect(result.hasIdentity).toBe(true);
  });
});
