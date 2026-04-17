import { describe, expect, test } from 'bun:test';
import { appendLaunchFormFields, readLaunchFormFields, serializeLaunchForm } from './launch';

const validForm = {
  name: 'Agent BIU',
  shortName: 'BIU',
  desc: 'hello',
  label: 'Meme' as const,
  webUrl: 'https://example.com',
  twitterUrl: 'https://x.com/agentbiu',
  telegramUrl: 'https://t.me/agentbiu',
  preSale: '1.25',
  feePlan: true,
  raisedTokenSymbol: 'BNB',
  agentName: 'Agent BIU',
  agentImageUrl: 'https://example.com/logo.png',
  agentDescription: 'demo',
};

describe('launch form helpers', () => {
  test('serializes all shared launch fields', () => {
    expect(serializeLaunchForm(validForm)).toEqual({
      name: 'Agent BIU',
      shortName: 'BIU',
      desc: 'hello',
      label: 'Meme',
      webUrl: 'https://example.com',
      twitterUrl: 'https://x.com/agentbiu',
      telegramUrl: 'https://t.me/agentbiu',
      preSale: '1.25',
      feePlan: 'true',
      raisedTokenSymbol: 'BNB',
      agentName: 'Agent BIU',
      agentImageUrl: 'https://example.com/logo.png',
      agentDescription: 'demo',
    });
  });

  test('round-trips shared form data fields', () => {
    const formData = new FormData();
    appendLaunchFormFields(formData, validForm);

    expect(readLaunchFormFields(formData)).toEqual(validForm);
  });
});
