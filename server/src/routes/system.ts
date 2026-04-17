import { Hono } from 'hono';
import {
  addressPayloadSchema,
  privateKeySessionSchema,
} from '@agentbiu/shared';
import { tokenLaunchService } from '../services/token-launch-service';
import { walletSessionService } from '../services/wallet-service';
import { nft8004Service } from '../services/nft8004-service';
import { getErrorMessage, getErrorStatus } from '../lib/errors';
import { readJsonBody } from '../lib/request';

export const systemRoutes = new Hono();

systemRoutes.get('/health', (c) => c.json({ success: true, data: { ok: true } }));

systemRoutes.get('/session', (c) => {
  return c.json({ success: true, data: walletSessionService.getSessionInfo() });
});

systemRoutes.post('/session/private-key', async (c) => {
  const body = await readJsonBody(c.req).catch((error) => {
    return c.json({ success: false, error: getErrorMessage(error) }, getErrorStatus(error, 500));
  });
  if (body instanceof Response) {
    return body;
  }

  const parsed = privateKeySessionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.issues[0]?.message || '私钥格式错误' }, 400);
  }

  return c.json({
    success: true,
    data: walletSessionService.setPrivateKey(parsed.data.privateKey),
  });
});

systemRoutes.delete('/session/private-key', (c) => {
  return c.json({ success: true, data: walletSessionService.clearPrivateKey() });
});

systemRoutes.get('/verify', async (c) => {
  try {
    const info = await tokenLaunchService.getVerificationInfo(
      walletSessionService.getSessionInfo().hasPrivateKey,
    );
    return c.json({ success: true, data: info });
  } catch (error) {
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

systemRoutes.post('/identity/check', async (c) => {
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
    const result = await nft8004Service.check(parsed.data.address);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});
