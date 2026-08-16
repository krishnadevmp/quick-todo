import { useAuthStore } from '@/stores/authStore';

// ── API client ────────────────────────────────────────────────────────────
// Thin fetch wrapper shared by every src/api/*.api.ts module. Mirrors
// quick-todo-service's error shape exactly (see errorHandler.ts):
// non-2xx responses are `{ error: string, details?: unknown }`.

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const url = new URL(BASE_URL.replace(/\/$/, '') + path);
  if (opts.query) {
    for (const [key, value] of Object.entries(opts.query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) {
    // Network failure (offline, DNS, CORS, server down) — distinguishable
    // from an ApiError so callers (esp. the sync engine) can tell "retry
    // later" apart from "the server rejected this".
    throw new ApiError(0, e instanceof Error ? e.message : 'Network error');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => undefined);

  if (!res.ok) {
    if (res.status === 401) useAuthStore.getState().handleUnauthorized();
    throw new ApiError(res.status, data?.error ?? res.statusText, data?.details);
  }

  return data as T;
}
