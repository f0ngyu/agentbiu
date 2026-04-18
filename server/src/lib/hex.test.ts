import { describe, expect, test } from 'bun:test';
import { normalizeHex, normalizePrivateKey } from './hex';

describe('hex helpers', () => {
  test('keeps hex values normalized with 0x prefix', () => {
    expect(normalizeHex(' 0Xabc123 ')).toBe('0xabc123');
  });

  test('decodes base64 when allowed', () => {
    expect(normalizeHex('YQ==', { allowBase64: true })).toBe('0x61');
  });

  test('rejects empty input even when base64 is allowed', () => {
    expect(() => normalizeHex('', { allowBase64: true })).toThrow('十六进制字符串不能为空');
  });

  test('rejects invalid hex input when base64 is not allowed', () => {
    expect(() => normalizeHex('not-a-hex')).toThrow('十六进制字符串格式错误');
  });

  test('normalizes private key input', () => {
    expect(normalizePrivateKey('abc123')).toBe('0xabc123');
  });
});
