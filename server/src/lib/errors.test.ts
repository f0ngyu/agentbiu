import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { HttpError, zodErrorMessage } from './errors';

describe('errors helpers', () => {
  test('zodErrorMessage prefers the first issue message', () => {
    const parsed = z.object({
      name: z.string().min(1, '请输入名称'),
    }).safeParse({ name: '' });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(zodErrorMessage(parsed.error)).toBe('请输入名称');
    }
  });

  test('HttpError preserves status and message', () => {
    const error = new HttpError(403, '禁止访问');
    expect(error.status).toBe(403);
    expect(error.message).toBe('禁止访问');
  });
});
