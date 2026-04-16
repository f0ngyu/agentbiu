import type { LaunchFormInput } from './schemas';

export type WalletMode = 'privateKey' | 'browser';
export type VerifyStatus = 'idle' | 'loading' | 'ready' | 'error';
export type IdentityStatus = 'unknown' | 'missing' | 'ready' | 'registering' | 'error';

export interface RaisedTokenConfig {
  id?: string;
  symbol: string;
  symbolAddress?: string;
  totalBAmount?: string | number;
  totalAmount?: string | number;
  saleRate?: string | number;
  status?: string;
  iconUrl?: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SessionInfo {
  mode: WalletMode;
  address: string | null;
  hasPrivateKey: boolean;
}

export interface VerificationInfo {
  networkName: string;
  chainId: number;
  chainSupported: boolean;
  rpcUrl: string;
  hasPrivateKey: boolean;
  raisedTokens: RaisedTokenConfig[];
}

export interface IdentityCheckResult {
  address: string;
  balance: number;
  hasIdentity: boolean;
  nftAddress: string;
}

export interface RegisterIdentityRequest {
  agentName: string;
  imageUrl?: string;
  description?: string;
}

export interface RegisterIdentityResult {
  txHash: string;
  agentId: number | null;
  agentURI: string;
}

export interface LaunchPreparation {
  createArg: `0x${string}`;
  signature: `0x${string}`;
  creationFeeWei: string;
  accessToken?: string;
  uploadImageUrl: string;
  selectedRaisedToken: RaisedTokenConfig;
}

export interface LaunchResult extends LaunchPreparation {
  txHash: string;
  walletAddress: string;
  tokenAddress: string | null;
}

export interface WalletNonceResponse {
  nonce: string;
  message: string;
}

export interface WalletLoginResult {
  accessToken: string;
}

export interface BrowserLaunchPreparedPayload {
  form: LaunchFormInput;
  accessToken: string;
}

export interface BrowserIdentityPreparation {
  agentURI: string;
  contractAddress: string;
}
