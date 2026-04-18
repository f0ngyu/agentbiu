import { describe, expect, mock, test } from 'bun:test';
import { appEnv } from '../lib/env';
import { Nft8004Service } from './nft8004-service';

const address = '0x1111111111111111111111111111111111111111';
const privateKey =
  '0x1111111111111111111111111111111111111111111111111111111111111111' as const;

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
    const service = new Nft8004Service();
    const readContract = mock(async () => 2n);
    (service as unknown as { publicClient: { readContract: typeof readContract } }).publicClient = {
      readContract,
    };

    const result = await service.check(address);
    expect(result.balance).toBe(2);
    expect(result.hasIdentity).toBe(true);
  });

  test('ensureIdentity skips registration when identity already exists', async () => {
    const service = new Nft8004Service();
    const checkMock = mock(async () => ({
      address,
      balance: 1,
      hasIdentity: true,
      nftAddress: appEnv.eip8004Address,
    }));
    const registerMock = mock(async () => ({
      txHash: '0xabc',
      agentId: 1,
      agentURI: 'uri',
    }));

    (service as unknown as { check: typeof checkMock }).check = checkMock;
    (service as unknown as { registerWithPrivateKey: typeof registerMock }).registerWithPrivateKey =
      registerMock;

    const result = await service.ensureIdentity(address, privateKey, { agentName: 'Agent BIU' });
    expect(checkMock).toHaveBeenCalledTimes(1);
    expect(registerMock).not.toHaveBeenCalled();
    expect(result.hasIdentity).toBe(true);
  });

  test('ensureIdentity registers and rechecks when identity is missing', async () => {
    const service = new Nft8004Service();
    let calls = 0;
    const checkMock = mock(async () => {
      calls += 1;
      if (calls === 1) {
        return {
          address,
          balance: 0,
          hasIdentity: false,
          nftAddress: appEnv.eip8004Address,
        };
      }

      return {
        address,
        balance: 1,
        hasIdentity: true,
        nftAddress: appEnv.eip8004Address,
      };
    });
    const registerMock = mock(async () => ({
      txHash: '0xdef',
      agentId: 2,
      agentURI: 'uri',
    }));

    (service as unknown as { check: typeof checkMock }).check = checkMock;
    (service as unknown as { registerWithPrivateKey: typeof registerMock }).registerWithPrivateKey =
      registerMock;

    const result = await service.ensureIdentity(address, privateKey, { agentName: 'Agent BIU' });
    expect(checkMock).toHaveBeenCalledTimes(2);
    expect(registerMock).toHaveBeenCalledTimes(1);
    expect(result.hasIdentity).toBe(true);
  });
});
