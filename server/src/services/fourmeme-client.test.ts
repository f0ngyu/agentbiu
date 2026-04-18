import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { OFFICIAL_RAISED_TOKENS } from '@agentbiu/shared';
import { FourMemeClient } from './fourmeme-client';

const originalFetch = globalThis.fetch;

describe('FourMemeClient', () => {
  beforeEach(() => {
    mock.restore();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('returns filtered config on success', async () => {
    globalThis.fetch = mock(async () => {
      return new Response(
        JSON.stringify({
          code: 0,
          data: [
            { symbol: 'USDT', status: 'PUBLISH' },
            { symbol: 'BNB', status: 'PUBLISH' },
            { symbol: '币安人生', status: 'PUBLISH' },
            { symbol: 'UNKNOWN', status: 'PUBLISH' },
          ],
        }),
      );
    }) as unknown as typeof fetch;

    const client = new FourMemeClient(20);
    const result = await client.fetchPublicConfig();

    expect(result).toEqual([
      { symbol: 'BNB', status: 'PUBLISH' },
      { symbol: 'USDT', status: 'PUBLISH' },
      { symbol: '币安人生', status: 'PUBLISH' },
    ]);
    expect(result.every((token) => OFFICIAL_RAISED_TOKENS.includes(token.symbol as (typeof OFFICIAL_RAISED_TOKENS)[number]))).toBe(true);
  });

  test('throws HTTP status errors', async () => {
    globalThis.fetch = mock(async () => new Response('bad gateway', { status: 502 })) as unknown as typeof fetch;

    const client = new FourMemeClient(20);
    await expect(client.generateNonce('0x1234567890123456789012345678901234567890')).rejects.toThrow(
      '获取登录 nonce 失败: HTTP 502',
    );
  });

  test('throws business errors from payload', async () => {
    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify({ code: 1001, data: null, msg: '签名失效' }));
    }) as unknown as typeof fetch;

    const client = new FourMemeClient(20);
    await expect(
      client.loginWithSignature({
        address: '0x1234567890123456789012345678901234567890',
        signature: '0xdeadbeef',
      }),
    ).rejects.toThrow('签名失效');
  });

  test('aborts hung requests with a timeout error', async () => {
    globalThis.fetch = mock((_, init?: RequestInit) => {
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    }) as unknown as typeof fetch;

    const client = new FourMemeClient(5);
    await expect(client.fetchPublicConfig()).rejects.toThrow('请求 four.meme 超时（5ms）');
  });
});
