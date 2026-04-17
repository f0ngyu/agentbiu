import { describe, expect, test } from 'bun:test';
import { readJsonBody } from './request';

describe('readJsonBody', () => {
  test('returns parsed payload when JSON is valid', async () => {
    const payload = { ok: true };
    await expect(
      readJsonBody({
        async json() {
          return payload;
        },
      }),
    ).resolves.toEqual(payload);
  });

  test('throws HttpError(400) when JSON is invalid', async () => {
    await expect(
      readJsonBody({
        async json() {
          throw new SyntaxError('bad json');
        },
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: '请求体必须是合法 JSON',
    });
  });
});
