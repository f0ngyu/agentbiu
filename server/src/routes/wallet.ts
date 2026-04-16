import { Hono } from 'hono';
import { addressPayloadSchema, walletLoginSchema } from '@agentbiu/shared';
import { fourMemeClient } from '../services/fourmeme-client';

export const walletRoutes = new Hono();

walletRoutes.post('/nonce', async (c) => {
  const body = await c.req.json();
  const parsed = addressPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.issues[0]?.message || '地址格式错误' }, 400);
  }

  try {
    const data = await fourMemeClient.generateNonce(parsed.data.address);
    return c.json({ success: true, data });
  } catch (error) {
    console.error('[wallet] nonce failed', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

walletRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = walletLoginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.issues[0]?.message || '登录参数不完整' }, 400);
  }

  try {
    const data = await fourMemeClient.loginWithSignature(parsed.data);
    return c.json({ success: true, data });
  } catch (error) {
    console.error('[wallet] login failed', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '未知错误';
}
