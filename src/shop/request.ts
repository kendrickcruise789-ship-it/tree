// Copied from the Qoder Sites request helper: it is the only place browser calls to
// the shop service are shaped, so 401/403 handling and error mapping stay consistent.
export class ApiError extends Error {
  constructor(message: string, readonly code: string, readonly status: number = 0) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function requestJson(
  url: string,
  init: RequestInit = {},
  messages: Readonly<Record<string, string>> = {},
): Promise<unknown> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers, credentials: 'same-origin' });
  } catch {
    if (init.signal?.aborted) throw new ApiError('Cancelled', 'aborted');
    throw new ApiError(
      'The shop service could not be reached. Nothing was changed.',
      'service_unavailable',
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new ApiError('You need the shop owner sign-in to do that.', 'access_denied', response.status);
  }
  if (response.redirected || !response.headers.get('content-type')?.includes('application/json')) {
    throw new ApiError('The shop service did not answer with data.', 'service_unavailable', response.status);
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('The shop service sent unreadable data.', 'service_unavailable', response.status);
  }
  const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  const code = typeof body?.error === 'string'
    ? body.error
    : (!response.ok || body?.ok === false) && typeof body?.code === 'string'
      ? body.code
      : response.ok
        ? null
        : 'request_failed';
  if (!response.ok || body?.ok === false || code) {
    const resolved = code ?? 'request_failed';
    const message = Object.prototype.hasOwnProperty.call(messages, resolved)
      ? messages[resolved]
      : 'That change did not go through. Nothing was saved.';
    throw new ApiError(message, resolved, response.status);
  }
  return data;
}

// A lost response cannot establish whether a write committed, so callers must
// re-read instead of replaying the mutation.
export function isWriteOutcomeUnknown(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status === 401 || error.status === 403) return false;
  if (error.code === 'write_rejected' || error.code === 'invalid_input') return false;
  return (
    ['service_unavailable', 'write_result_unknown'].includes(error.code) ||
    (error.status >= 500 && error.status < 600)
  );
}
