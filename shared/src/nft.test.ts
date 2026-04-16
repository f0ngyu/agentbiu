import { describe, expect, test } from 'bun:test';
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
});
