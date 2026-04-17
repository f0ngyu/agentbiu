import { describe, expect, test } from 'bun:test';
import { appendLaunchFormFields } from '@agentbiu/shared';
import { parseLaunchRequest } from './launch';

const validForm = {
  name: 'Agent BIU',
  shortName: 'BIU',
  desc: 'hello',
  label: 'Meme' as const,
  webUrl: '',
  twitterUrl: '',
  telegramUrl: '',
  preSale: '0.5',
  feePlan: true,
  raisedTokenSymbol: 'BNB',
  agentName: 'Agent BIU',
  agentImageUrl: '',
  agentDescription: '',
};

describe('parseLaunchRequest', () => {
  test('reads launch form fields and access token from multipart form data', async () => {
    const formData = new FormData();
    appendLaunchFormFields(formData, validForm);
    formData.set('image', new File(['demo'], 'token.png', { type: 'image/png' }));
    formData.set('accessToken', 'demo-token');

    const result = await parseLaunchRequest({
      async formData() {
        return formData;
      },
    });

    expect(result.form).toEqual(validForm);
    expect(result.accessToken).toBe('demo-token');
    expect(result.image.name).toBe('token.png');
  });

  test('rejects missing image uploads', async () => {
    const formData = new FormData();
    appendLaunchFormFields(formData, validForm);

    await expect(
      parseLaunchRequest({
        async formData() {
          return formData;
        },
      }),
    ).rejects.toThrow('请上传 token 图片');
  });

  test('rejects invalid shared field values', async () => {
    const formData = new FormData();
    appendLaunchFormFields(formData, {
      ...validForm,
      shortName: '',
    });
    formData.set('image', new File(['demo'], 'token.png', { type: 'image/png' }));

    await expect(
      parseLaunchRequest({
        async formData() {
          return formData;
        },
      }),
    ).rejects.toThrow('请输入代币简称');
  });
});
