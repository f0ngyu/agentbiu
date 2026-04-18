import { describe, expect, test } from 'bun:test';
import { launchFormSchema } from './schemas';

function buildValidPayload() {
  return {
    name: 'Agent BIU',
    shortName: 'BIU',
    desc: 'hello',
    label: 'Meme' as const,
    webUrl: '',
    twitterUrl: '',
    telegramUrl: '',
    preSale: '0',
    feePlan: false,
    raisedTokenSymbol: 'BNB',
    agentName: 'Agent BIU',
    agentImageUrl: '',
    agentDescription: '',
  };
}

describe('launchFormSchema', () => {
  test('accepts a valid minimal payload', () => {
    const parsed = launchFormSchema.safeParse(buildValidPayload());

    expect(parsed.success).toBe(true);
  });

  test('rejects invalid symbol length', () => {
    const parsed = launchFormSchema.safeParse({
      ...buildValidPayload(),
      shortName: '',
    });

    expect(parsed.success).toBe(false);
  });

  test('rejects overlong name', () => {
    const parsed = launchFormSchema.safeParse({
      ...buildValidPayload(),
      name: 'A'.repeat(41),
    });

    expect(parsed.success).toBe(false);
  });

  test('rejects invalid label', () => {
    const parsed = launchFormSchema.safeParse({
      ...buildValidPayload(),
      label: 'Invalid',
    });

    expect(parsed.success).toBe(false);
  });

  test('rejects non-URL webUrl', () => {
    const parsed = launchFormSchema.safeParse({
      ...buildValidPayload(),
      webUrl: 'not-a-url',
    });

    expect(parsed.success).toBe(false);
  });

  test('rejects overlong desc', () => {
    const parsed = launchFormSchema.safeParse({
      ...buildValidPayload(),
      desc: 'A'.repeat(281),
    });

    expect(parsed.success).toBe(false);
  });

  test('rejects overlong agentName', () => {
    const parsed = launchFormSchema.safeParse({
      ...buildValidPayload(),
      agentName: 'A'.repeat(41),
    });

    expect(parsed.success).toBe(false);
  });
});
