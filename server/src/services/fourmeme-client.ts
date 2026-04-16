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

function ensureSuccess<T>(payload: FourMemeResponse<T>, fallback: string): T {
  if (payload.code === 0 || payload.code === '0') {
    return payload.data;
  }
  throw new Error(payload.msg || payload.message || fallback);
}

export class FourMemeClient {
  async fetchPublicConfig(): Promise<RaisedTokenConfig[]> {
    const response = await fetch(`${FOUR_MEME_API_BASE}/public/config`);
    if (!response.ok) {
      throw new Error(`获取 four.meme 配置失败: ${response.status}`);
    }

    const payload = (await response.json()) as FourMemeResponse<RaisedTokenConfig[]>;
    const configs = ensureSuccess(payload, '无法读取 raised token 配置');
    return this.filterOfficialRaisedTokens(configs);
  }

  async generateNonce(address: string): Promise<WalletNonceResponse> {
    const response = await fetch(`${FOUR_MEME_API_BASE}/private/user/nonce/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountAddress: address,
        verifyType: 'LOGIN',
        networkCode: FOUR_MEME_NETWORK_CODE,
      }),
    });
    const payload = (await response.json()) as FourMemeResponse<string>;
    const nonce = ensureSuccess(payload, '获取登录 nonce 失败');
    return {
      nonce,
      message: `You are sign in Meme ${nonce}`,
    };
  }

  async loginWithSignature(input: WalletLoginInput): Promise<WalletLoginResult> {
    const response = await fetch(`${FOUR_MEME_API_BASE}/private/user/login/dex`, {
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
    });

    const payload = (await response.json()) as FourMemeResponse<string>;
    return {
      accessToken: ensureSuccess(payload, 'four.meme 登录失败'),
    };
  }

  async uploadImage(file: File, accessToken: string): Promise<string> {
    const formData = new FormData();
    formData.set('file', file, file.name);

    const response = await fetch(`${FOUR_MEME_API_BASE}/private/token/upload`, {
      method: 'POST',
      headers: {
        'meme-web-access': accessToken,
      },
      body: formData,
    });

    const payload = (await response.json()) as FourMemeResponse<string>;
    return ensureSuccess(payload, '图片上传失败');
  }

  async createToken(accessToken: string, body: Record<string, unknown>): Promise<{
    createArg: string;
    signature: string;
  }> {
    const response = await fetch(`${FOUR_MEME_API_BASE}/private/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'meme-web-access': accessToken,
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as FourMemeResponse<{
      createArg: string;
      signature: string;
    }>;

    return ensureSuccess(payload, '创建 token 参数失败');
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
}

export const fourMemeClient = new FourMemeClient();
