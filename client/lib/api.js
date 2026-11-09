const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export async function api(path, method = 'GET', body) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(BASE + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== 'undefined') { localStorage.clear(); window.location.href = '/login'; }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const fmtDate = (d) => (d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-');
export const pct = (c) => (c.total ? Math.round(((c.sent + c.failed) / c.total) * 100) : 0);
