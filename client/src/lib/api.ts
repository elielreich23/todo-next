export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  // Pull user id from localStorage if present to scope requests server-side
  let userHeaders: Record<string, string> = {};
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('taskero_user') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) userHeaders['x-user-id'] = String(parsed.id);
    }
  } catch {}
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...userHeaders,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}


