// Minimal API helper for the standalone free frontend
const base = '/api';

async function request(method, path, body, token) {
  const opts = { method, headers: {} };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(base + path, opts);
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; } catch (e) { return { status: res.status, body: text }; }
}

// Expose globally for browser use
window.apiRequest = (method, path, body, token) => request(method, path, body, token);
window.notificationsAPI = { getAll: (token) => request('GET', '/notifications', null, token) };
window.api = { request };
