import { Hono } from 'hono';
import { launchFormSchema } from '@agentbiu/shared';
import { tokenLaunchService } from '../services/token-launch-service';
import { walletSessionService } from '../services/wallet-service';

export const launchRoutes = new Hono();

launchRoutes.post('/private-key', async (c) => {
  const privateKey = walletSessionService.getPrivateKey();
  if (!privateKey) {
    return c.json({ success: false, error: '请先配置私钥，或改用浏览器钱包模式' }, 400);
  }

  try {
    const { form, image } = await parseLaunchRequest(c.req);
    const data = await tokenLaunchService.launchWithPrivateKey(privateKey, form, image);
    return c.json({ success: true, data });
  } catch (error) {
    console.error('[launch] private-key flow failed', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

launchRoutes.post('/browser/prepare', async (c) => {
  try {
    const { form, image, accessToken } = await parseLaunchRequest(c.req);
    if (!accessToken) {
      return c.json({ success: false, error: '浏览器钱包模式缺少 four.meme access token' }, 400);
    }

    const data = await tokenLaunchService.prepareLaunchWithAccessToken(accessToken, form, image);
    return c.json({ success: true, data });
  } catch (error) {
    console.error('[launch] browser prepare failed', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

async function parseLaunchRequest(request: { formData(): Promise<FormData> }) {
  const formData = await request.formData();
  const image = formData.get('image');
  if (!(image instanceof File)) {
    throw new Error('请上传 token 图片');
  }

  const parsed = launchFormSchema.safeParse({
    name: String(formData.get('name') || ''),
    shortName: String(formData.get('shortName') || ''),
    desc: String(formData.get('desc') || ''),
    label: String(formData.get('label') || 'Meme'),
    webUrl: String(formData.get('webUrl') || ''),
    twitterUrl: String(formData.get('twitterUrl') || ''),
    telegramUrl: String(formData.get('telegramUrl') || ''),
    preSale: String(formData.get('preSale') || '0'),
    feePlan: String(formData.get('feePlan') || 'false') === 'true',
    raisedTokenSymbol: String(formData.get('raisedTokenSymbol') || 'BNB'),
    agentName: String(formData.get('agentName') || ''),
    agentImageUrl: String(formData.get('agentImageUrl') || ''),
    agentDescription: String(formData.get('agentDescription') || ''),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || '表单参数不合法');
  }

  return {
    form: parsed.data,
    image,
    accessToken: String(formData.get('accessToken') || ''),
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '未知错误';
}
