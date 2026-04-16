import type { ApiEnvelope } from '@agentbiu/shared';

async function unwrap<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success || payload.error) {
    throw new Error(payload.error || `请求失败: ${response.status}`);
  }
  return payload.data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path);
  return unwrap<T>(response);
}

export async function apiPostJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return unwrap<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: 'DELETE',
  });
  return unwrap<T>(response);
}

export async function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    body: formData,
  });
  return unwrap<T>(response);
}
