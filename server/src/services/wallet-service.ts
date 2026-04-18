import type { SessionInfo } from '@agentbiu/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { appEnv } from '../lib/env';
import { normalizePrivateKey } from '../lib/hex';

class WalletSessionService {
  private sessionPrivateKey: `0x${string}` | null = null;

  setPrivateKey(privateKey: string): SessionInfo {
    this.sessionPrivateKey = normalizePrivateKey(privateKey);
    return this.getSessionInfo();
  }

  clearPrivateKey(): SessionInfo {
    this.sessionPrivateKey = null;
    return this.getSessionInfo();
  }

  getPrivateKey(): `0x${string}` | null {
    if (this.sessionPrivateKey) return this.sessionPrivateKey;
    if (appEnv.privateKey) return normalizePrivateKey(appEnv.privateKey);
    return null;
  }

  getAddress(): string | null {
    const privateKey = this.getPrivateKey();
    if (!privateKey) return null;
    return privateKeyToAccount(privateKey).address;
  }

  getSessionInfo(): SessionInfo {
    return {
      mode: 'privateKey',
      address: this.getAddress(),
      hasPrivateKey: Boolean(this.getPrivateKey()),
    };
  }
}

export const walletSessionService = new WalletSessionService();
