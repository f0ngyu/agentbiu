import type {
  LaunchFormInput,
  RaisedTokenConfig,
  WalletLoginInput,
  WalletLoginResult,
  WalletNonceResponse,
} from '@agentbiu/shared';
import {
  FOUR_MEME_API_BASE,
  FOUR_MEME_NETWORK_CODE,
  OFFICIAL_RAISED_TOKENS,
  RAISED_TOKEN_PREFERENCE,
} from '@agentbiu/shared';

type FourMemeResponse<T> = {
  code: number | string;
  data: T;
  msg?: string;
  message?: string;
};

const DEFAULT_TIMEOUT_MS = 15000;

function ensureSuccess<T>(payload: FourMemeResponse<T>, fallback: string): T {
  if (payload.code === 0 || payload.code === '0') {
    return payload.data;
  }
  throw new Error(payload.msg || payload.message || fallback);
}

export class FourMemeClient {
  constructor(private readonly timeoutMs = DEFAULT_TIMEOUT_MS) {}

  async fetchPublicConfig(): Promise<RaisedTokenConfig[]> {
    const configs = await this.request<RaisedTokenConfig[]>(
      '/public/config',
      undefined,
      '获取 four.meme 配置失败',
    );
    return this.filterOfficialRaisedTokens(configs);
  }

  async generateNonce(address: string): Promise<WalletNonceResponse> {
    const nonce = await this.request<string>(
      '/private/user/nonce/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountAddress: address,
          verifyType: 'LOGIN',
          networkCode: FOUR_MEME_NETWORK_CODE,
        }),
      },
      '获取登录 nonce 失败',
    );
    return {
      nonce,
      message: `You are sign in Meme ${nonce}`,
    };
  }

  async loginWithSignature(input: WalletLoginInput): Promise<WalletLoginResult> {
    return {
      accessToken: await this.request<string>(
        '/private/user/login/dex',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            region: 'WEB',
            langType: 'EN',
            loginIp: '',
            inviteCode: '',
            verifyInfo: {
              address: input.address,
              networkCode: FOUR_MEME_NETWORK_CODE,
              signature: input.signature,
              verifyType: 'LOGIN',
            },
            walletName: 'MetaMask',
          }),
        },
        'four.meme 登录失败',
      ),
    };
  }

  async uploadImage(file: File, accessToken: string): Promise<string> {
    const formData = new FormData();
    formData.set('file', file, file.name);

    return this.request<string>(
      '/private/token/upload',
      {
        method: 'POST',
        headers: {
          'meme-web-access': accessToken,
        },
        body: formData,
      },
      '图片上传失败',
    );
  }

  async createToken(accessToken: string, body: Record<string, unknown>): Promise<{
    createArg: string;
    signature: string;
  }> {
    return this.request<{
      createArg: string;
      signature: string;
    }>(
      '/private/token/create',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'meme-web-access': accessToken,
        },
        body: JSON.stringify(body),
      },
      '创建 token 参数失败',
    );
  }

  pickRaisedToken(configs: RaisedTokenConfig[], preferredSymbol?: string): RaisedTokenConfig {
    const published = configs.filter((item) => item.status === 'PUBLISH');
    const candidates = published.length > 0 ? published : configs;
    if (preferredSymbol) {
      const preferred = candidates.find((item) => item.symbol === preferredSymbol);
      if (preferred) return preferred;
    }

    for (const symbol of RAISED_TOKEN_PREFERENCE) {
      const match = candidates.find((item) => item.symbol === symbol);
      if (match) return match;
    }

    if (!candidates[0]) {
      throw new Error('four.meme 当前没有可用的 raised token 配置');
    }
    return candidates[0];
  }

  private filterOfficialRaisedTokens(configs: RaisedTokenConfig[]): RaisedTokenConfig[] {
    const published = configs.filter((item) => item.status === 'PUBLISH');
    const source = published.length > 0 ? published : configs;

    return OFFICIAL_RAISED_TOKENS.map((symbol) =>
      source.find((item) => item.symbol === symbol),
    ).filter((item): item is RaisedTokenConfig => Boolean(item));
  }

  buildCreateBody(form: LaunchFormInput, imageUrl: string, raisedToken: RaisedTokenConfig) {
    return {
      name: form.name,
      shortName: form.shortName,
      desc: form.desc,
      totalSupply: Number(raisedToken.totalAmount ?? 1000000000),
      raisedAmount: Number(raisedToken.totalBAmount ?? 24),
      saleRate: Number(raisedToken.saleRate ?? 0.8),
      reserveRate: 0,
      imgUrl: imageUrl,
      raisedToken,
      launchTime: Date.now(),
      funGroup: false,
      label: form.label,
      lpTradingFee: 0.0025,
      preSale: form.preSale || '0',
      clickFun: false,
      symbol: raisedToken.symbol,
      dexType: 'PANCAKE_SWAP',
      rushMode: false,
      onlyMPC: false,
      feePlan: form.feePlan,
      ...(form.webUrl ? { webUrl: form.webUrl } : {}),
      ...(form.twitterUrl ? { twitterUrl: form.twitterUrl } : {}),
      ...(form.telegramUrl ? { telegramUrl: form.telegramUrl } : {}),
    };
  }

  private async request<T>(path: string, init: RequestInit | undefined, fallback: string): Promise<T> {
    const response = await this.fetchWithTimeout(`${FOUR_MEME_API_BASE}${path}`, init);
    if (!response.ok) {
      throw new Error(`${fallback}: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as FourMemeResponse<T>;
    return ensureSuccess(payload, fallback);
  }

  private async fetchWithTimeout(input: string, init?: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`请求 four.meme 超时（${this.timeoutMs}ms）`, { cause: error });
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const fourMemeClient = new FourMemeClient();
