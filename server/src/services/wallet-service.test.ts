import { afterEach, describe, expect, test } from 'bun:test';
import { appEnv } from '../lib/env';
import { walletSessionService } from './wallet-service';

const originalEnvPrivateKey = appEnv.privateKey;

describe('walletSessionService', () => {
  afterEach(() => {
    walletSessionService.clearPrivateKey();
    appEnv.privateKey = originalEnvPrivateKey;
  });

  test('sets and clears private key session', () => {
    const info = walletSessionService.setPrivateKey(
      '1111111111111111111111111111111111111111111111111111111111111111',
    );
    expect(info.hasPrivateKey).toBe(true);
    expect(info.address).toBeString();

    const cleared = walletSessionService.clearPrivateKey();
    expect(cleared.hasPrivateKey).toBe(false);
  });

  test('adds 0x prefix when missing', () => {
    const info = walletSessionService.setPrivateKey(
      '1111111111111111111111111111111111111111111111111111111111111111',
    );

    expect(walletSessionService.getPrivateKey()).toBe(
      '0x1111111111111111111111111111111111111111111111111111111111111111',
    );
    expect(info.address).toBeString();
  });

  test('falls back to env private key when session is empty', () => {
    appEnv.privateKey = '1111111111111111111111111111111111111111111111111111111111111111';

    expect(walletSessionService.getPrivateKey()).toBe(
      '0x1111111111111111111111111111111111111111111111111111111111111111',
    );
    expect(walletSessionService.getAddress()).toBeString();
  });
});
