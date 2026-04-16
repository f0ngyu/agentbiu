import { Hono } from 'hono';
import { z } from 'zod';
import { walletSessionService } from '../services/wallet-service';
import { nft8004Service } from '../services/nft8004-service';

const requestSchema = z.object({
  agentName: z.string().trim().min(1, '请输入 Agent 名称'),
  imageUrl: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export const identityRoutes = new Hono();

identityRoutes.post('/register/private-key', async (c) => {
  const body = await c.req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.issues[0]?.message || '参数错误' }, 400);
  }

  const privateKey = walletSessionService.getPrivateKey();
  if (!privateKey) {
    return c.json({ success: false, error: '当前未配置私钥模式钱包' }, 400);
  }

  try {
    const data = await nft8004Service.registerWithPrivateKey(privateKey, parsed.data);
    return c.json({ success: true, data });
  } catch (error) {
    console.error('[identity] private-key register failed', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

identityRoutes.post('/register/browser/prepare', async (c) => {
  const body = await c.req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.issues[0]?.message || '参数错误' }, 400);
  }

  try {
    const data = nft8004Service.prepareBrowserRegistration(parsed.data);
    return c.json({ success: true, data });
  } catch (error) {
    console.error('[identity] browser prepare failed', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '未知错误';
}
