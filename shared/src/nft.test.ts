import { describe, expect, test } from 'bun:test';
import { DEFAULT_AGENT_DESCRIPTION } from './constants';
import { buildAgentURI } from './nft';

describe('buildAgentURI', () => {
  test('returns base64 data uri', () => {
    const result = buildAgentURI({
      name: 'AgentBIU',
      imageUrl: 'https://example.com/logo.png',
      description: 'demo',
    });

    expect(result.startsWith('data:application/json;base64,')).toBe(true);
    expect(result).toContain('application/json');
  });

  test('encodes chinese names correctly', () => {
    const result = buildAgentURI({
      name: '币安人生',
      imageUrl: 'https://example.com/logo.png',
      description: 'demo',
    });

    const payload = JSON.parse(Buffer.from(result.split(',')[1], 'base64').toString('utf8'));
    expect(payload.name).toBe('币安人生');
  });

  test('uses empty image and default description when omitted', () => {
    const result = buildAgentURI({
      name: 'Agent BIU',
    });

    const payload = JSON.parse(Buffer.from(result.split(',')[1], 'base64').toString('utf8'));
    expect(payload.image).toBe('');
    expect(payload.description).toBe(DEFAULT_AGENT_DESCRIPTION);
  });
});
