import { describe, expect, test } from 'bun:test';
import { walletSessionService } from './wallet-service';

describe('walletSessionService', () => {
  test('sets and clears private key session', () => {
    const info = walletSessionService.setPrivateKey(
      '1111111111111111111111111111111111111111111111111111111111111111',
    );
    expect(info.hasPrivateKey).toBe(true);
    expect(info.address).toBeString();

    const cleared = walletSessionService.clearPrivateKey();
    expect(cleared.hasPrivateKey).toBe(false);
  });
});
