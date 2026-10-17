import type { Entry, EntryPatch, Person, Section } from './types';

class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = 'ApiError'; }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
      credentials: 'same-origin',
    });
  } catch { throw new ApiError('Network unavailable', 0); }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || `HTTP ${res.status}`, res.status);
  }
  return res.status === 204 ? undefined as T : res.json() as Promise<T>;
}

export { ApiError };
export const api = {
  getNames: (section: Section) => call<Person[]>(`/names?section=${section}`),
  addName: (name: string, section: Section) => call<Person>('/names', { method: 'POST', body: JSON.stringify({ name, section }) }),
  renameName: (id: string, name: string) => call<Person>(`/names/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  deleteName: (id: string) => call<void>(`/names/${id}`, { method: 'DELETE' }),
  getEntries: (nameId: string) => call<Entry[]>(`/names/${nameId}/entries`),
  addEntry: (nameId: string, input: Pick<Entry, 'date' | 'title' | 'quantity' | 'price' | 'completed'>) =>
    call<Entry>(`/names/${nameId}/entries`, { method: 'POST', body: JSON.stringify(input) }),
  patchEntry: (id: string, patch: EntryPatch, keepalive = false) =>
    call<Entry>(`/entries/${id}`, { method: 'PATCH', body: JSON.stringify(patch), keepalive }),
  deleteEntry: (id: string) => call<void>(`/entries/${id}`, { method: 'DELETE' }),
};
