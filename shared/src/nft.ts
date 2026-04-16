import { DEFAULT_AGENT_DESCRIPTION, REGISTRATION_TYPE } from './constants';

export function buildAgentURI(input: {
  name: string;
  imageUrl?: string;
  description?: string;
}): string {
  const payload = {
    type: REGISTRATION_TYPE,
    name: input.name.trim(),
    description: input.description?.trim() || DEFAULT_AGENT_DESCRIPTION,
    image: input.imageUrl?.trim() || '',
    active: true,
    supportedTrust: [''],
  };

  const json = JSON.stringify(payload);
  const base64 = encodeBase64(json);
  return `data:application/json;base64,${base64}`;
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
