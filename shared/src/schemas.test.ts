import { describe, expect, test } from 'bun:test';
import { launchFormSchema } from './schemas';

describe('launchFormSchema', () => {
  test('accepts a valid minimal payload', () => {
    const parsed = launchFormSchema.safeParse({
      name: 'Agent BIU',
      shortName: 'BIU',
      desc: 'hello',
      label: 'Meme',
      webUrl: '',
      twitterUrl: '',
      telegramUrl: '',
      preSale: '0',
      feePlan: false,
      raisedTokenSymbol: 'BNB',
      agentName: 'Agent BIU',
      agentImageUrl: '',
      agentDescription: '',
    });

    expect(parsed.success).toBe(true);
  });

  test('rejects invalid symbol length', () => {
    const parsed = launchFormSchema.safeParse({
      name: 'Agent BIU',
      shortName: '',
      desc: 'hello',
      label: 'Meme',
      webUrl: '',
      twitterUrl: '',
      telegramUrl: '',
      preSale: '0',
      feePlan: false,
      raisedTokenSymbol: 'BNB',
      agentName: 'Agent BIU',
      agentImageUrl: '',
      agentDescription: '',
    });

    expect(parsed.success).toBe(false);
  });
});
