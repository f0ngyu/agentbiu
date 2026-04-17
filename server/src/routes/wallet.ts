import { Hono } from 'hono';
import { addressPayloadSchema, walletLoginSchema } from '@agentbiu/shared';
import { fourMemeClient } from '../services/fourmeme-client';
import { getErrorMessage, getErrorStatus } from '../lib/errors';
import { readJsonBody } from '../lib/request';

export const walletRoutes = new Hono();

walletRoutes.post('/nonce', async (c) => {
  const body = await readJsonBody(c.req).catch((error) => {
    return c.json({ success: false, error: getErrorMessage(error) }, getErrorStatus(error, 500));
  });
  if (body instanceof Response) {
    return body;
  }

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
  const body = await readJsonBody(c.req).catch((error) => {
    return c.json({ success: false, error: getErrorMessage(error) }, getErrorStatus(error, 500));
  });
  if (body instanceof Response) {
    return body;
  }

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
