const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ id: string; name: string; username: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getCards: () => request<import('@/types').Card[]>('/api/cards'),

  createCard: (data: { title: string; description?: string; status: string }) =>
    request<import('@/types').Card>('/api/cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCard: (id: string, data: { title?: string; description?: string }) =>
    request<import('@/types').Card>(`/api/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  moveCard: (id: string, data: { status: string; order: number }) =>
    request<import('@/types').Card[]>(`/api/cards/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
