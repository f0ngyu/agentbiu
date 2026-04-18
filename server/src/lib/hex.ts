type NormalizeHexOptions = {
  allowBase64?: boolean;
};

export function normalizeHex(value: string, options: NormalizeHexOptions = {}): `0x${string}` {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('十六进制字符串不能为空');
  }
  if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
    return `0x${trimmed.slice(2)}` as `0x${string}`;
  }

  if (/^[0-9a-fA-F]+$/.test(trimmed)) {
    return `0x${trimmed}` as `0x${string}`;
  }

  if (options.allowBase64) {
    return `0x${Buffer.from(trimmed, 'base64').toString('hex')}` as `0x${string}`;
  }

  throw new Error('十六进制字符串格式错误');
}

export function normalizePrivateKey(privateKey: string): `0x${string}` {
  return normalizeHex(privateKey);
}
