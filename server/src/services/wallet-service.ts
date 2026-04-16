import type { SessionInfo } from '@agentbiu/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { appEnv } from '../lib/env';

function normalizePrivateKey(privateKey: string): `0x${string}` {
  const trimmed = privateKey.trim();
  return (trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`) as `0x${string}`;
}

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
