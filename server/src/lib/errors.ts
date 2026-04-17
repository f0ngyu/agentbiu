export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '未知错误';
}

export type ApiErrorStatus = 400 | 403 | 500;

export function getErrorStatus(error: unknown, fallback: ApiErrorStatus = 500): ApiErrorStatus {
  if (error instanceof HttpError && (error.status === 400 || error.status === 403 || error.status === 500)) {
    return error.status;
  }
  return fallback;
}
