import type { Application, ApplicationInput } from '@/types/application';
export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Please sign in again.');
  }
}
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (response.status === 401) throw new SessionExpiredError();
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Something went wrong. Please try again.');
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export const applicationService = {
  list: () => request<Application[]>('/api/applications'),
  create: (input: ApplicationInput) =>
    request<Application>('/api/applications', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: Partial<ApplicationInput>) =>
    request<Application>(`/api/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<void>(`/api/applications/${id}`, { method: 'DELETE' }),
};
