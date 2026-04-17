import { HttpError } from './errors';

export async function readJsonBody(request: { json(): Promise<unknown> }) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, '请求体必须是合法 JSON');
  }
}
